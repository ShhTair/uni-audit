"""
Site URL discoverer — fast pre-crawl scan.

Discovers URLs via:
1. sitemap.xml / sitemap_index.xml / robots.txt sitemap directives
2. Shallow homepage link extraction (depth 0-1, no JS rendering)

Returns a flat list of DiscoveredUrl items so the user can manually
select/exclude pages before the real crawl begins.
"""

import asyncio
import logging
import re
import xml.etree.ElementTree as ET
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger("uni_audit.discoverer")

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}

# Patterns for URLs we never want to discover
_SKIP_PATTERNS = re.compile(
    r"(\.pdf|\.doc|\.docx|\.xls|\.xlsx|\.ppt|\.zip|\.rar|"
    r"#|mailto:|tel:|javascript:|/login|/portal|/my\.|"
    r"/search\?|/calendar|/news/\d|/events/\d)",
    re.IGNORECASE,
)


def _normalize(url: str) -> str:
    p = urlparse(url)
    path = p.path.rstrip("/") or "/"
    return f"{p.scheme}://{p.hostname}{path}"


def _is_same_domain(url: str, domains: list[str]) -> bool:
    host = urlparse(url).hostname or ""
    return any(host == d or host.endswith("." + d) for d in domains)


def _should_skip(url: str) -> bool:
    return bool(_SKIP_PATTERNS.search(url))


def _depth_estimate(url: str, base_domain: str) -> int:
    """Estimate crawl depth based on path segments."""
    path = urlparse(url).path.strip("/")
    if not path:
        return 0
    return min(len(path.split("/")), 6)


async def _fetch(client: httpx.AsyncClient, url: str) -> str | None:
    try:
        r = await client.get(url, headers=_HEADERS, timeout=10, follow_redirects=True)
        if r.status_code == 200:
            return r.text
    except Exception as e:
        logger.debug("Fetch failed %s: %s", url, e)
    return None


async def _parse_sitemap(
    client: httpx.AsyncClient,
    sitemap_url: str,
    domains: list[str],
    results: dict,
    depth: int = 0,
) -> None:
    """Recursively parse sitemap XML."""
    if depth > 3:
        return
    text = await _fetch(client, sitemap_url)
    if not text:
        return

    try:
        root = ET.fromstring(text)
        ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}

        # Sitemap index — recurse
        for sitemap in root.findall("sm:sitemap", ns):
            loc = sitemap.findtext("sm:loc", namespaces=ns)
            if loc and _is_same_domain(loc, domains):
                await _parse_sitemap(client, loc.strip(), domains, results, depth + 1)

        # URL entries
        for url_el in root.findall("sm:url", ns):
            loc = url_el.findtext("sm:loc", namespaces=ns)
            if not loc:
                continue
            loc = loc.strip()
            if not _is_same_domain(loc, domains):
                continue
            if _should_skip(loc):
                continue
            norm = _normalize(loc)
            if norm not in results:
                p = urlparse(loc)
                results[norm] = {
                    "url": loc,
                    "title": "",
                    "path": p.path or "/",
                    "domain": p.hostname or "",
                    "source": "sitemap",
                    "depth_estimate": _depth_estimate(loc, domains[0]),
                }
    except ET.ParseError:
        pass


async def _discover_from_homepage(
    client: httpx.AsyncClient,
    domain: str,
    domains: list[str],
    results: dict,
) -> None:
    """Extract links from homepage and one level down (navigation only)."""
    home_url = f"https://{domain}"
    html = await _fetch(client, home_url)
    if not html:
        return

    soup = BeautifulSoup(html, "lxml")

    # Get title of homepage
    norm_home = _normalize(home_url)
    if norm_home not in results:
        title = soup.find("title")
        results[norm_home] = {
            "url": home_url,
            "title": title.get_text(strip=True) if title else domain,
            "path": "/",
            "domain": domain,
            "source": "homepage",
            "depth_estimate": 0,
        }

    # Focus on nav/header links for top-level discovery
    nav_selectors = ["nav", "header", '[role="navigation"]', ".navbar", ".main-nav", ".primary-nav"]
    nav_links: list[str] = []

    for sel in nav_selectors:
        for nav in soup.select(sel):
            for a in nav.find_all("a", href=True):
                href = a["href"].strip()
                if not href or href.startswith("#"):
                    continue
                full = urljoin(home_url, href)
                if _is_same_domain(full, domains) and not _should_skip(full):
                    nav_links.append(full)

    # Also get all links but limit to avoid explosion
    all_links: list[str] = []
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        if not href or href.startswith("#"):
            continue
        full = urljoin(home_url, href)
        if _is_same_domain(full, domains) and not _should_skip(full):
            all_links.append(full)

    # Combine: nav links first, then rest (deduplicated, capped at 200)
    seen = set()
    combined = []
    for url in nav_links + all_links:
        n = _normalize(url)
        if n not in seen:
            seen.add(n)
            combined.append(url)
        if len(combined) >= 200:
            break

    # Fetch each nav-level page to get its title and sub-links
    depth1_tasks = []
    for url in combined[:60]:  # limit concurrent requests
        norm = _normalize(url)
        if norm not in results:
            p = urlparse(url)
            results[norm] = {
                "url": url,
                "title": "",
                "path": p.path or "/",
                "domain": p.hostname or "",
                "source": "homepage",
                "depth_estimate": 1,
            }
            depth1_tasks.append(url)

    # Fetch titles for depth-1 pages concurrently (limited)
    async def _fetch_title(u: str) -> None:
        html2 = await _fetch(client, u)
        if not html2:
            return
        soup2 = BeautifulSoup(html2, "lxml")
        title_el = soup2.find("title")
        title = title_el.get_text(strip=True) if title_el else ""
        norm = _normalize(u)
        if norm in results:
            results[norm]["title"] = title

        # Also collect depth-2 links from this page
        for a in soup2.find_all("a", href=True):
            href = a["href"].strip()
            if not href or href.startswith("#"):
                continue
            full = urljoin(u, href)
            if not _is_same_domain(full, domains) or _should_skip(full):
                continue
            n2 = _normalize(full)
            if n2 not in results:
                p2 = urlparse(full)
                results[n2] = {
                    "url": full,
                    "title": "",
                    "path": p2.path or "/",
                    "domain": p2.hostname or "",
                    "source": "homepage",
                    "depth_estimate": 2,
                }

    # Run in batches of 10
    for i in range(0, len(depth1_tasks), 10):
        batch = depth1_tasks[i : i + 10]
        await asyncio.gather(*[_fetch_title(u) for u in batch])


async def discover_site_urls(
    domains: list[str],
    max_urls: int = 500,
) -> list[dict]:
    """
    Discover all URLs for a university site.
    Returns list of dicts with url, title, path, domain, source, depth_estimate.
    """
    results: dict[str, dict] = {}

    async with httpx.AsyncClient(
        timeout=15,
        follow_redirects=True,
        verify=False,
    ) as client:
        for domain in domains:
            # 1. Try robots.txt to find sitemap pointers
            robots_text = await _fetch(client, f"https://{domain}/robots.txt")
            sitemap_urls: list[str] = []
            if robots_text:
                for line in robots_text.splitlines():
                    if line.lower().startswith("sitemap:"):
                        sm_url = line.split(":", 1)[1].strip()
                        if sm_url:
                            sitemap_urls.append(sm_url)

            # 2. Try common sitemap locations
            sitemap_candidates = [
                f"https://{domain}/sitemap.xml",
                f"https://{domain}/sitemap_index.xml",
                f"https://{domain}/sitemap-index.xml",
                f"https://{domain}/wp-sitemap.xml",
                f"https://{domain}/news-sitemap.xml",
            ]
            for sm_url in sitemap_urls + sitemap_candidates:
                await _parse_sitemap(client, sm_url, domains, results)
                if len(results) >= max_urls:
                    break

            # 3. Homepage link discovery (always run for nav structure)
            await _discover_from_homepage(client, domain, domains, results)

    # Sort: depth 0 first, then by path
    items = list(results.values())
    items.sort(key=lambda x: (x["depth_estimate"], x["path"]))

    # Cap at max_urls
    return items[:max_urls]
