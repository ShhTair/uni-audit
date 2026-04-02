"""
Targeted crawler for manual mode.

Instead of BFS discovery, crawls a user-specified list of URLs.
Uses httpx (no Playwright) for speed, converts HTML → Markdown via html2text,
and stores markdown_content alongside raw_text in MongoDB.
"""

import asyncio
import logging
import time
from datetime import datetime, timezone
from urllib.parse import urlparse

import html2text
import httpx
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from src.crawler.content_extractor import ContentExtractor
from src.models.tags import LINK_LOCATION_WEIGHTS

logger = logging.getLogger("uni_audit.targeted_crawler")

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}

_H2T = html2text.HTML2Text()
_H2T.ignore_links = False
_H2T.ignore_images = True
_H2T.ignore_emphasis = False
_H2T.body_width = 0  # no wrapping
_H2T.unicode_snob = True
_H2T.skip_internal_links = False


def _html_to_markdown(html: str) -> str:
    try:
        return _H2T.handle(html).strip()
    except Exception:
        return ""


def _calc_navigation_difficulty(depth: int, link_location: str) -> float:
    location_weight = LINK_LOCATION_WEIGHTS.get(link_location, 0.3)
    depth_factor = min(depth / 10.0, 1.0)
    return round(min(0.4 * location_weight + 0.6 * depth_factor, 1.0), 3)


class TargetedCrawler:
    """
    Crawls a specific list of URLs using httpx (no browser).
    Ideal for manual mode where the user has hand-picked pages.
    Each page is stored with both raw_text and markdown_content.
    """

    def __init__(
        self,
        db: AsyncIOMotorDatabase,
        university_id: str,
        domains: list[str],
        urls: list[str],
        concurrency: int = 5,
        request_delay: float = 0.5,
    ):
        self.db = db
        self.university_id = ObjectId(university_id)
        self.domains = domains
        self.urls = list(dict.fromkeys(urls))  # deduplicate while preserving order
        self.concurrency = concurrency
        self.request_delay = request_delay
        self._pages_crawled = 0

    async def crawl(self) -> int:
        logger.info(
            "Starting targeted crawl for %s — %d URLs",
            self.university_id,
            len(self.urls),
        )

        await self.db.universities.update_one(
            {"_id": self.university_id},
            {"$set": {"status": "crawling", "updated_at": datetime.now(timezone.utc)}},
        )

        sem = asyncio.Semaphore(self.concurrency)

        async with httpx.AsyncClient(
            headers=_HEADERS,
            timeout=20,
            follow_redirects=True,
            verify=False,
        ) as client:
            tasks = [self._crawl_url(client, sem, url, idx) for idx, url in enumerate(self.urls)]
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
            "Targeted crawl complete for %s: %d pages",
            self.university_id,
            self._pages_crawled,
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
        logger.info("Targeted crawl: %s", url)
        start = time.monotonic()

        try:
            resp = await client.get(url)
            if resp.status_code >= 400:
                logger.warning("HTTP %d for %s", resp.status_code, url)
                return

            html = resp.text
            final_url = str(resp.url)
            load_time_ms = int((time.monotonic() - start) * 1000)

            extractor = ContentExtractor(html, final_url, self.domains)
            content = extractor.extract()

            markdown_content = _html_to_markdown(html)

            parsed = urlparse(final_url)

            # Depth: try to infer from URL path (manual pages are typically depth 1-3)
            depth = min(len(parsed.path.strip("/").split("/")), 5) if parsed.path.strip("/") else 0

            issue_tags: list[str] = []
            if content.image_text_detected:
                issue_tags.append("image_instead_of_text")
            if not content.meta_description:
                issue_tags.append("no_meta_description")
            if not content.heading_structure:
                issue_tags.append("missing_headings")
            if content.word_count < 30:
                issue_tags.append("dead_end_page")

            page_doc = {
                "university_id": self.university_id,
                "url": final_url,
                "domain": parsed.hostname or "",
                "path": parsed.path or "/",
                "title": content.title,
                "ai_title": "",
                "status": "crawled",
                "depth": depth,
                "parent_url": None,
                "discovery_path": [final_url],
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
                    "word_count": content.word_count,
                    "image_count": content.image_count,
                    "link_count": content.link_count,
                    "external_link_count": content.external_link_count,
                    "broken_links": [],
                    "load_time_ms": load_time_ms,
                    "has_dynamic_content": content.has_dynamic_content,
                    "dynamic_elements": content.dynamic_elements,
                    "readability_score": content.readability_score,
                    "mobile_friendly": None,
                    "last_modified": content.last_modified,
                    "language": content.language,
                    "has_structured_data": content.has_structured_data,
                    "meta_description": content.meta_description,
                    "heading_structure": [
                        {"level": h.level, "text": h.text}
                        for h in content.heading_structure
                    ],
                },
                "outgoing_links": [
                    {
                        "url": lnk.url,
                        "text": lnk.text,
                        "location": lnk.location,
                        "is_internal": lnk.is_internal,
                    }
                    for lnk in content.links
                ],
                "incoming_links_count": 0,
                "raw_text": content.main_text[:500_000],
                "markdown_content": markdown_content[:1_000_000],
                "crawled_at": datetime.now(timezone.utc),
                "analyzed_at": None,
            }

            await self.db.pages.insert_one(page_doc)
            self._pages_crawled += 1

        except Exception as exc:
            logger.error("Error crawling %s: %s", url, exc)
