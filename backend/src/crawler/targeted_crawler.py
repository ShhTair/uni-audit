"""
Targeted crawler for manual mode.

Fetches a user-specified list of URLs. Two rendering backends:

1. Cloudflare Browser Rendering (when CF credentials are set)
   - Full JS execution via headless Chrome in CF's infrastructure
   - Bypasses bot protection, renders React/Vue apps correctly
   - Returns clean Markdown directly from CF

2. Plain httpx (fallback when CF not available)
   - Fast, lightweight
   - HTML cleaned with html_cleaner before converting to Markdown
   - Good enough for static/server-rendered pages

Both backends store raw_text + markdown_content in MongoDB.
"""

import asyncio
import logging
import time
from datetime import datetime, timezone
from urllib.parse import urlparse

import httpx
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from src.config import settings
from src.crawler.content_extractor import ContentExtractor
from src.crawler.html_cleaner import html_to_clean_markdown, estimate_content_quality
from src.models.tags import LINK_LOCATION_WEIGHTS

logger = logging.getLogger("uni_audit.targeted_crawler")

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

CF_BASE = "https://api.cloudflare.com/client/v4/accounts"


def _cf_headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.cf_token}",
        "Content-Type": "application/json",
    }


def _calc_navigation_difficulty(depth: int, link_location: str) -> float:
    location_weight = LINK_LOCATION_WEIGHTS.get(link_location, 0.3)
    depth_factor = min(depth / 10.0, 1.0)
    return round(min(0.4 * location_weight + 0.6 * depth_factor, 1.0), 3)


async def _fetch_via_cf(client: httpx.AsyncClient, url: str) -> tuple[str, str]:
    """
    Fetch page via Cloudflare Browser Rendering /content endpoint.
    Returns (html, markdown). Both may be empty on failure.
    """
    endpoint = f"{CF_BASE}/{settings.CLOUDFLARE_ACCOUNT_ID}/browser-rendering/content"
    try:
        resp = await client.post(
            endpoint,
            headers=_cf_headers(),
            json={
                "url": url,
                "rejectResourceTypes": ["image", "media", "font", "stylesheet"],
                "waitUntil": "networkidle0",
                "gotoOptions": {"timeout": 25000},
                # Ask CF to return markdown
                "screenshotOptions": None,
                "addScriptTag": [],
                "addStyleTag": [],
            },
            timeout=40,
        )
        if resp.status_code != 200:
            logger.warning("CF /content returned %d for %s", resp.status_code, url)
            return "", ""

        data = resp.json()
        if not data.get("success"):
            errors = data.get("errors", [])
            logger.warning("CF /content error for %s: %s", url, errors)
            return "", ""

        result = data.get("result", {})
        html = result.get("html", "")
        # CF may return markdown directly, or we generate it from HTML
        md = result.get("markdown", "")
        if not md and html:
            md = html_to_clean_markdown(html, base_url=url)
        return html, md

    except Exception as exc:
        logger.warning("CF fetch failed for %s: %s", url, exc)
        return "", ""


async def _fetch_via_httpx(client: httpx.AsyncClient, url: str) -> tuple[str, str]:
    """
    Fetch page via plain httpx. Returns (html, markdown).
    """
    try:
        resp = await client.get(url, headers=_HEADERS, timeout=20, follow_redirects=True)
        if resp.status_code >= 400:
            logger.warning("HTTP %d for %s", resp.status_code, url)
            return "", ""
        html = resp.text
        md = html_to_clean_markdown(html, base_url=url)
        return html, md
    except Exception as exc:
        logger.warning("httpx fetch failed for %s: %s", url, exc)
        return "", ""


class TargetedCrawler:
    """
    Crawls a specific list of URLs using the best available backend.
    When CF credentials are set, uses Cloudflare Browser Rendering for
    JS-heavy/protected pages. Falls back to plain httpx otherwise.
    """

    def __init__(
        self,
        db: AsyncIOMotorDatabase,
        university_id: str,
        domains: list[str],
        urls: list[str],
        concurrency: int = 4,
        request_delay: float = 0.8,
    ):
        self.db = db
        self.university_id = ObjectId(university_id)
        self.domains = domains
        self.urls = list(dict.fromkeys(urls))  # deduplicate, preserve order
        self.concurrency = concurrency
        self.request_delay = request_delay
        self.use_cf = settings.cf_ready
        self._pages_crawled = 0

    async def crawl(self) -> int:
        logger.info(
            "Targeted crawl for %s — %d URLs — backend: %s",
            self.university_id,
            len(self.urls),
            "cloudflare" if self.use_cf else "httpx",
        )

        await self.db.universities.update_one(
            {"_id": self.university_id},
            {"$set": {"status": "crawling", "updated_at": datetime.now(timezone.utc)}},
        )

        sem = asyncio.Semaphore(self.concurrency)

        # CF needs longer timeouts
        timeout = httpx.Timeout(50.0) if self.use_cf else httpx.Timeout(25.0)

        async with httpx.AsyncClient(timeout=timeout, verify=False) as client:
            tasks = [
                self._crawl_url(client, sem, url, idx)
                for idx, url in enumerate(self.urls)
            ]
            await asyncio.gather(*tasks)

        await self.db.universities.update_one(
            {"_id": self.university_id},
            {
                "$set": {
                    "status": "pending",
                    "updated_at": datetime.now(timezone.utc),
                    "summary.total_pages_crawled": self._pages_crawled,
                }
            },
        )

        logger.info(
            "Targeted crawl done for %s: %d/%d pages",
            self.university_id,
            self._pages_crawled,
            len(self.urls),
        )
        return self._pages_crawled

    async def _crawl_url(
        self,
        client: httpx.AsyncClient,
        sem: asyncio.Semaphore,
        url: str,
        idx: int,
    ) -> None:
        async with sem:
            if idx > 0:
                await asyncio.sleep(self.request_delay)
            await self._fetch_and_store(client, url)

    async def _fetch_and_store(self, client: httpx.AsyncClient, url: str) -> None:
        logger.info("[targeted/%s] %s", "cf" if self.use_cf else "httpx", url)
        start = time.monotonic()

        # Fetch via best backend
        if self.use_cf:
            html, markdown = await _fetch_via_cf(client, url)
            # If CF failed (e.g. timeout), fall back to httpx
            if not html and not markdown:
                logger.info("CF failed for %s, falling back to httpx", url)
                html, markdown = await _fetch_via_httpx(client, url)
        else:
            html, markdown = await _fetch_via_httpx(client, url)

        if not html and not markdown:
            logger.warning("No content retrieved for %s", url)
            return

        load_time_ms = int((time.monotonic() - start) * 1000)

        # Structured content extraction from HTML (BS4)
        content = None
        if html:
            try:
                extractor = ContentExtractor(html, url, self.domains)
                content = extractor.extract()
            except Exception as exc:
                logger.warning("ContentExtractor failed for %s: %s", url, exc)

        parsed = urlparse(url)
        depth = min(len(parsed.path.strip("/").split("/")), 5) if parsed.path.strip("/") else 0

        issue_tags: list[str] = []
        if content:
            if content.image_text_detected:
                issue_tags.append("image_instead_of_text")
            if not content.meta_description:
                issue_tags.append("no_meta_description")
            if not content.heading_structure:
                issue_tags.append("missing_headings")
            if content.word_count < 30:
                issue_tags.append("dead_end_page")

        md_quality = estimate_content_quality(markdown)

        page_doc = {
            "university_id": self.university_id,
            "url": url,
            "domain": parsed.hostname or "",
            "path": parsed.path or "/",
            "title": (content.title if content else "") or parsed.path,
            "ai_title": "",
            "status": "crawled",
            "depth": depth,
            "parent_url": None,
            "discovery_path": [url],
            "link_location": "manual",
            "navigation_difficulty": _calc_navigation_difficulty(depth, "main_content"),
            "page_category": "other",
            "page_subcategory": None,
            "content_tags": [],
            "issue_tags": issue_tags,
            "quality_tags": [],
            "ai_summary": "",
            "ai_improvements": [],
            "metrics": {
                "word_count": content.word_count if content else len((markdown or "").split()),
                "image_count": content.image_count if content else 0,
                "link_count": content.link_count if content else 0,
                "external_link_count": content.external_link_count if content else 0,
                "broken_links": [],
                "load_time_ms": load_time_ms,
                "has_dynamic_content": content.has_dynamic_content if content else False,
                "dynamic_elements": content.dynamic_elements if content else [],
                "readability_score": content.readability_score if content else 0.0,
                "mobile_friendly": None,
                "last_modified": content.last_modified if content else None,
                "language": content.language if content else "en",
                "has_structured_data": content.has_structured_data if content else False,
                "meta_description": content.meta_description if content else None,
                "heading_structure": (
                    [{"level": h.level, "text": h.text} for h in content.heading_structure]
                    if content else []
                ),
                "markdown_quality_score": md_quality,
                "crawl_backend": "cloudflare" if self.use_cf else "httpx",
            },
            "outgoing_links": (
                [
                    {"url": lnk.url, "text": lnk.text, "location": lnk.location, "is_internal": lnk.is_internal}
                    for lnk in content.links
                ]
                if content else []
            ),
            "incoming_links_count": 0,
            "raw_text": (content.main_text[:500_000] if content else ""),
            "markdown_content": (markdown or "")[:1_000_000],
            "crawled_at": datetime.now(timezone.utc),
            "analyzed_at": None,
        }

        await self.db.pages.insert_one(page_doc)
        self._pages_crawled += 1
        logger.debug(
            "Stored %s — %d words, MD quality %.2f",
            url,
            page_doc["metrics"]["word_count"],
            md_quality,
        )
