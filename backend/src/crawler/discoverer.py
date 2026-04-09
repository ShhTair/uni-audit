"""
Site URL discoverer — fast pre-crawl scan.

Discovers URLs via:
1. sitemap.xml / sitemap_index.xml / robots.txt sitemap directives
2. Shallow homepage link extraction (depth 0-2, no JS rendering)

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

# File extensions — never useful for content analysis
_SKIP_EXTENSIONS = re.compile(
    r"\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|gz|tar|"
    r"jpg|jpeg|png|gif|svg|webp|ico|mp4|mp3|avi|mov|"
    r"css|js|json|xml|rss|atom|woff|woff2|ttf|eot)$",
    re.IGNORECASE,
)

# URL patterns that indicate junk (CMS artifacts, tracking, login walls, etc.)
_SKIP_URL_PATTERNS = re.compile(
    r"(mailto:|tel:|javascript:|"
    r"/wp-content/|/wp-includes/|/wp-json/|"
    r"/feed/?$|/rss/?$|/atom/?$|"
    r"/tag/|/tags/|/author/|/category/|/categories/|"
    r"/page/\d+|[?&]p=\d|[?&]page=\d|"
    r"/login|/logout|/signin|/signout|/register|/my\.|/portal/|/my-|"
    r"/search[/?]|/\?s=|/\?q=|"
    r"/print/?$|/print\?|"
    r"/calendar/|/events/\d{4}|/news/\d{4}|"
    r"[#?]|/cdn-cgi/)",
    re.IGNORECASE,
)

# Admission-related keywords — used to boost sort order
_ADMISSION_KEYWORDS = re.compile(
    r"(admiss|apply|application|tuition|fee|scholar|financial[- ]aid|"
    r"international|undergraduate|graduate|enroll|requirement|deadline|"
    r"program|major|degree|visa|housing|accommodation|cost)",
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
    parsed = urlparse(url)
    # Skip files by extension
    if _SKIP_EXTENSIONS.search(parsed.path):
        return True
    # Skip junk URL patterns
    if _SKIP_URL_PATTERNS.search(url):
        return True
    return False


def _depth_estimate(url: str) -> int:
    """Estimate crawl depth based on path segments."""
    path = urlparse(url).path.strip("/")
    if not path:
        return 0
    return min(len(path.split("/")), 6)


def _is_admission_related(url: str, title: str = "") -> bool:
    return bool(_ADMISSION_KEYWORDS.search(url) or _ADMISSION_KEYWORDS.search(title))


def _clean_title(title: str) -> str:
    """Strip site name suffix from titles (e.g. 'Admissions | University Name')."""
    if not title:
        return ""
    # Remove common separators + everything after the last one
    for sep in [" | ", " - ", " – ", " :: ", " › "]:
        if sep in title:
            parts = title.split(sep)
            # If the last part is the longest it's probably the site name at the start
            # Keep the most specific (usually first) segment
            return parts[0].strip()
    return title.strip()


async def _fetch(client: httpx.AsyncClient, url: str) -> str | None:
    try:
        r = await client.get(url, headers=_HEADERS, timeout=10, follow_redirects=True)
        if r.status_code == 200:
            return r.text
    except Exception as e:
        logger.debug("Fetch failed %s: %s", url, e)
    return None


def _extract_title_from_html(html: str) -> str:
    """Extract the best available title from an HTML document."""
    soup = BeautifulSoup(html, "lxml")

    # 1. <title> tag
    title_el = soup.find("title")
    if title_el:
        t = _clean_title(title_el.get_text(strip=True))
        if t and len(t) > 2:
            return t

    # 2. <h1> (main page heading — often more specific than <title>)
    h1 = soup.find("h1")
    if h1:
        t = h1.get_text(strip=True)
        if t and len(t) > 2:
            return t[:100]

    # 3. og:title meta tag
    og = soup.find("meta", property="og:title")
    if og and og.get("content"):
        t = _clean_title(og["content"].strip())
        if t:
            return t

    return ""


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
                # sitemap <image:title> or <news:title> can provide a title hint
                title_hint = (
                    url_el.findtext("sm:title", namespaces=ns)
                    or url_el.findtext("{http://www.google.com/schemas/sitemap-news/0.9}title")
                    or ""
                )
                results[norm] = {
                    "url": loc,
                    "title": title_hint.strip() if title_hint else "",
                    "path": p.path or "/",
                    "domain": p.hostname or "",
                    "source": "sitemap",
                    "depth_estimate": _depth_estimate(loc),
                }
    except ET.ParseError:
        pass


async def _discover_from_homepage(
    client: httpx.AsyncClient,
    domain: str,
    domains: list[str],
    results: dict,
) -> None:
    """Extract links from homepage and one level down."""
    home_url = f"https://{domain}"
    html = await _fetch(client, home_url)
    if not html:
        return

    soup = BeautifulSoup(html, "lxml")

    # Homepage entry
    norm_home = _normalize(home_url)
    if norm_home not in results:
        title_el = soup.find("title")
        results[norm_home] = {
            "url": home_url,
            "title": _clean_title(title_el.get_text(strip=True)) if title_el else domain,
            "path": "/",
            "domain": domain,
            "source": "homepage",
            "depth_estimate": 0,
        }

    # ── Collect depth-1 links ──────────────────────────────────────────
    # Navigation links first (highest signal), then all body links
    nav_entries: list[tuple[str, str]] = []  # (url, link_text)
    body_entries: list[tuple[str, str]] = []

    nav_selectors = [
        "nav", "header", '[role="navigation"]', '[role="banner"]',
        ".navbar", ".main-nav", ".primary-nav", ".site-nav", "#main-nav",
    ]
    nav_els = set()
    for sel in nav_selectors:
        for el in soup.select(sel):
            nav_els.add(id(el))

    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        if not href or href.startswith("#"):
            continue
        full = urljoin(home_url, href)
        if not _is_same_domain(full, domains) or _should_skip(full):
            continue
        link_text = a.get_text(strip=True)[:80]
        # Check if this anchor is inside a nav element
        in_nav = any(id(p) in nav_els for p in a.parents)
        if in_nav:
            nav_entries.append((full, link_text))
        else:
            body_entries.append((full, link_text))

    # Deduplicate, nav links first
    seen: set[str] = set()
    combined: list[tuple[str, str]] = []
    for url, text in nav_entries + body_entries:
        n = _normalize(url)
        if n not in seen:
            seen.add(n)
            combined.append((url, text))
        if len(combined) >= 250:
            break

    # Add depth-1 entries with link text as title hint
    depth1_to_fetch: list[str] = []
    for url, link_text in combined:
        norm = _normalize(url)
        if norm not in results:
            p = urlparse(url)
            results[norm] = {
                "url": url,
                # Use link text as a title placeholder until we can fetch the real title
                "title": link_text if link_text and len(link_text) > 2 else "",
                "path": p.path or "/",
                "domain": p.hostname or "",
                "source": "homepage",
                "depth_estimate": 1,
            }
            depth1_to_fetch.append(url)

    # ── Fetch titles + depth-2 links for depth-1 pages ────────────────
    async def _fetch_depth1(u: str) -> None:
        html2 = await _fetch(client, u)
        if not html2:
            return
        soup2 = BeautifulSoup(html2, "lxml")
        real_title = _extract_title_from_html(html2)
        norm = _normalize(u)
        if norm in results and real_title:
            results[norm]["title"] = real_title

        # Collect depth-2 links — no title fetching at this level
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
                link_text2 = a.get_text(strip=True)[:80]
                results[n2] = {
                    "url": full,
                    "title": link_text2 if link_text2 and len(link_text2) > 2 else "",
                    "path": p2.path or "/",
                    "domain": p2.hostname or "",
                    "source": "homepage",
                    "depth_estimate": 2,
                }

    # Run in batches of 8 to avoid hammering the server
    for i in range(0, len(depth1_to_fetch), 8):
        batch = depth1_to_fetch[i: i + 8]
        await asyncio.gather(*[_fetch_depth1(u) for u in batch])


async def discover_site_urls(
    domains: list[str],
    max_urls: int = 500,
) -> list[dict]:
    """
    Discover all URLs for a university site.
    Returns list of dicts with url, title, path, domain, source, depth_estimate.

    Sort order: depth 0 first, then admission-related pages, then alphabetical by path.
    """
    results: dict[str, dict] = {}

    async with httpx.AsyncClient(
        timeout=15,
        follow_redirects=True,
        verify=False,
    ) as client:
        for domain in domains:
            # 1. Try robots.txt for sitemap pointers
            robots_text = await _fetch(client, f"https://{domain}/robots.txt")
            sitemap_urls: list[str] = []
            if robots_text:
                for line in robots_text.splitlines():
                    if line.lower().startswith("sitemap:"):
                        sm_url = line.split(":", 1)[1].strip()
                        if sm_url:
                            sitemap_urls.append(sm_url)

            # 2. Common sitemap locations
            sitemap_candidates = [
                f"https://{domain}/sitemap.xml",
                f"https://{domain}/sitemap_index.xml",
                f"https://{domain}/sitemap-index.xml",
                f"https://{domain}/wp-sitemap.xml",
            ]
            for sm_url in sitemap_urls + sitemap_candidates:
                await _parse_sitemap(client, sm_url, domains, results)
                if len(results) >= max_urls:
                    break

            # 3. Homepage link discovery (always run — gives nav structure)
            await _discover_from_homepage(client, domain, domains, results)

    items = list(results.values())

    # Sort: depth 0 → admission-related first → alphabetical by path
    def _sort_key(item: dict) -> tuple:
        depth = item["depth_estimate"]
        is_admission = 0 if _is_admission_related(item["url"], item.get("title", "")) else 1
        return (depth, is_admission, item["path"])

    items.sort(key=_sort_key)
    return items[:max_urls]
