"""
University website crawler using async Playwright.
BFS crawling with depth tracking, link-location detection,
smart pruning, robots.txt respect, and rate limiting.
"""

import asyncio
import logging
import re
import time
from collections import deque
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser

import httpx
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from playwright.async_api import Page, async_playwright

from src.crawler.content_extractor import ContentExtractor
from src.models.tags import LINK_LOCATION_WEIGHTS

logger = logging.getLogger("uni_audit.crawler")

DEFAULT_EXCLUDE_PATTERNS = [
    r"/news/",
    r"/blog/",
    r"/events/",
    r"/alumni/",
    r"/athletics/",
    r"/sports/",
    r"/calendar/",
    r"/directory/",
    r"/faculty-staff/",
    r"/jobs/",
    r"/login",
    r"/portal",
    r"/my\.",
    r"/email",
    r"\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar)$",
    r"/search\?",
    r"/tag/",
    r"/category/",
]

RESCUE_PATTERNS = [
    r"admission",
    r"apply",
    r"requirement",
    r"scholarship",
    r"tuition",
    r"financial.aid",
    r"international.student",
    r"program",
    r"major",
    r"degree",
    r"deadline",
]

# Focus patterns give priority in BFS queue
DEFAULT_FOCUS_PATTERNS = [
    r"admission",
    r"apply",
    r"scholarship",
    r"financial",
    r"tuition",
    r"international",
    r"program",
    r"major",
    r"undergrad",
    r"graduate",
]


@staticmethod
def _compile_patterns(patterns: list[str]) -> list[re.Pattern]:
    compiled = []
    for p in patterns:
        try:
            compiled.append(re.compile(p, re.IGNORECASE))
        except re.error:
            logger.warning("Invalid regex pattern: %s", p)
    return compiled


def _calc_navigation_difficulty(depth: int, link_location: str) -> float:
    """Calculate navigation difficulty score 0-1."""
    location_weight = LINK_LOCATION_WEIGHTS.get(link_location, 0.3)
    depth_factor = min(depth / 10.0, 1.0)
    score = 0.4 * location_weight + 0.6 * depth_factor
    return round(min(score, 1.0), 3)


class _QueueItem:
    __slots__ = ("url", "depth", "parent_url", "discovery_path", "link_location", "is_focus")

    def __init__(
        self,
        url: str,
        depth: int,
        parent_url: Optional[str],
        discovery_path: list[str],
        link_location: str,
        is_focus: bool = False,
    ):
        self.url = url
        self.depth = depth
        self.parent_url = parent_url
        self.discovery_path = discovery_path
        self.link_location = link_location
        self.is_focus = is_focus


class UniversityCrawler:
    """
    Crawls university websites with Playwright for dynamic content support.
    Tracks depth, link locations, and navigation paths.
    """

    def __init__(
        self,
        db: AsyncIOMotorDatabase,
        university_id: str,
        domains: list[str],
        max_depth: int = 5,
        max_pages: int = 300,
        excluded_patterns: Optional[list[str]] = None,
        focus_patterns: Optional[list[str]] = None,
        request_delay: float = 1.5,
    ):
        self.db = db
        self.university_id = ObjectId(university_id)
        self.domains = domains
        self.max_depth = max_depth
        self.max_pages = max_pages
        self.request_delay = request_delay

        exclude_raw = DEFAULT_EXCLUDE_PATTERNS + (excluded_patterns or [])
        self._exclude_re = _compile_patterns(exclude_raw)
        self._rescue_re = _compile_patterns(RESCUE_PATTERNS)
        focus_raw = DEFAULT_FOCUS_PATTERNS + (focus_patterns or [])
        self._focus_re = _compile_patterns(focus_raw)

        self._visited: set[str] = set()
        self._pages_crawled: int = 0
        self._robots_cache: dict[str, RobotFileParser] = {}

    # ------------------------------------------------------------------
    # Robots.txt
    # ------------------------------------------------------------------

    async def _load_robots(self, domain: str) -> RobotFileParser:
        if domain in self._robots_cache:
            return self._robots_cache[domain]
        rp = RobotFileParser()
        robots_url = f"https://{domain}/robots.txt"
        try:
            async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
                resp = await client.get(robots_url)
                if resp.status_code == 200:
                    rp.parse(resp.text.splitlines())
                else:
                    rp.allow_all = True
        except Exception:
            rp.allow_all = True
        self._robots_cache[domain] = rp
        return rp

    async def _is_allowed(self, url: str) -> bool:
        parsed = urlparse(url)
        domain = parsed.hostname or ""
        rp = await self._load_robots(domain)
        try:
            return rp.can_fetch("*", url)
        except Exception:
            return True

    # ------------------------------------------------------------------
    # URL filtering
    # ------------------------------------------------------------------

    def _normalize_url(self, url: str) -> str:
        parsed = urlparse(url)
        path = parsed.path.rstrip("/") or "/"
        return f"{parsed.scheme}://{parsed.hostname}{path}"

    def _is_same_university(self, url: str) -> bool:
        parsed = urlparse(url)
        host = parsed.hostname or ""
        for domain in self.domains:
            if host == domain or host.endswith("." + domain):
                return True
        return False

    def _should_exclude(self, url: str) -> bool:
        lower = url.lower()
        for pattern in self._exclude_re:
            if pattern.search(lower):
                # Check rescue patterns
                for rescue in self._rescue_re:
                    if rescue.search(lower):
                        return False
                return True
        return False

    def _is_focus_url(self, url: str) -> bool:
        lower = url.lower()
        return any(p.search(lower) for p in self._focus_re)

    # ------------------------------------------------------------------
    # Page interaction helpers
    # ------------------------------------------------------------------

    async def _wait_for_page(self, page: Page) -> None:
        """Wait for page to be fully loaded including dynamic content."""
        try:
            await page.wait_for_load_state("networkidle", timeout=15000)
        except Exception:
            try:
                await page.wait_for_load_state("domcontentloaded", timeout=10000)
            except Exception:
                pass

    async def _expand_dynamic_content(self, page: Page) -> None:
        """Try to expand accordions, load-more buttons, etc."""
        expand_selectors = [
            'button:has-text("Load More")',
            'button:has-text("Show More")',
            'button:has-text("Read More")',
            'button:has-text("View All")',
            'a:has-text("Load More")',
            'a:has-text("Show More")',
            '[data-toggle="collapse"]',
            ".accordion-header",
            ".expandable-trigger",
            'button[aria-expanded="false"]',
        ]
        for selector in expand_selectors:
            try:
                elements = await page.query_selector_all(selector)
                for el in elements[:5]:  # limit to first 5
                    try:
                        await el.click(timeout=2000)
                        await asyncio.sleep(0.5)
                    except Exception:
                        continue
            except Exception:
                continue

    # ------------------------------------------------------------------
    # Main crawl
    # ------------------------------------------------------------------

    async def crawl(self) -> int:
        """
        Start BFS crawl from each domain's homepage.
        Returns the number of pages crawled.
        """
        logger.info("Starting crawl for university %s, domains: %s", self.university_id, self.domains)

        # Update status
        await self.db.universities.update_one(
            {"_id": self.university_id},
            {"$set": {"status": "crawling", "updated_at": datetime.now(timezone.utc)}},
        )

        # Build initial queue
        queue: deque[_QueueItem] = deque()
        for domain in self.domains:
            home_url = f"https://{domain}"
            norm = self._normalize_url(home_url)
            if norm not in self._visited:
                self._visited.add(norm)
                queue.append(
                    _QueueItem(
                        url=home_url,
                        depth=0,
                        parent_url=None,
                        discovery_path=[home_url],
                        link_location="header",
                        is_focus=True,
                    )
                )

        async with async_playwright() as pw:
            browser = await pw.chromium.launch(headless=True)
            try:
                context = await browser.new_context(
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    viewport={"width": 1920, "height": 1080},
                    ignore_https_errors=True,
                )
                page = await context.new_page()

                while queue and self._pages_crawled < self.max_pages:
                    # Prioritize focus URLs
                    item = None
                    for i, q_item in enumerate(queue):
                        if q_item.is_focus:
                            item = q_item
                            del queue[i]
                            break
                    if item is None:
                        item = queue.popleft()

                    if item.depth > self.max_depth:
                        continue

                    if not await self._is_allowed(item.url):
                        logger.debug("Blocked by robots.txt: %s", item.url)
                        continue

                    # Crawl the page
                    new_links = await self._crawl_page(page, item)

                    # Enqueue discovered links
                    for link_url, link_location in new_links:
                        norm = self._normalize_url(link_url)
                        if norm in self._visited:
                            continue
                        if not self._is_same_university(link_url):
                            continue
                        if self._should_exclude(link_url):
                            continue
                        self._visited.add(norm)
                        is_focus = self._is_focus_url(link_url)
                        child = _QueueItem(
                            url=link_url,
                            depth=item.depth + 1,
                            parent_url=item.url,
                            discovery_path=item.discovery_path + [link_url],
                            link_location=link_location,
                            is_focus=is_focus,
                        )
                        if is_focus:
                            queue.appendleft(child)
                        else:
                            queue.append(child)

                    # Rate limiting
                    await asyncio.sleep(self.request_delay)

                await context.close()
            finally:
                await browser.close()

        # Update incoming_links_count for all pages
        await self._update_incoming_links()

        # Update university status
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

        logger.info("Crawl complete for %s: %d pages", self.university_id, self._pages_crawled)
        return self._pages_crawled

    async def _crawl_page(self, page: Page, item: _QueueItem) -> list[tuple[str, str]]:
        """Crawl a single page and store results. Returns list of (url, location) tuples."""
        logger.info("Crawling [depth=%d] %s", item.depth, item.url)
        start_time = time.monotonic()
        new_links: list[tuple[str, str]] = []

        try:
            response = await page.goto(item.url, wait_until="domcontentloaded", timeout=30000)
            if response is None:
                return new_links
            status_code = response.status
            if status_code >= 400:
                logger.warning("HTTP %d for %s", status_code, item.url)
                return new_links

            await self._wait_for_page(page)
            await self._expand_dynamic_content(page)

            load_time_ms = int((time.monotonic() - start_time) * 1000)

            html = await page.content()
            final_url = page.url

            # Extract content
            extractor = ContentExtractor(html, final_url, self.domains)
            content = extractor.extract()

            nav_difficulty = _calc_navigation_difficulty(item.depth, item.link_location)

            parsed = urlparse(final_url)

            # Build page document
            page_doc = {
                "university_id": self.university_id,
                "url": final_url,
                "domain": parsed.hostname or "",
                "path": parsed.path or "/",
                "title": content.title,
                "ai_title": "",
                "status": "crawled",
                "depth": item.depth,
                "parent_url": item.parent_url,
                "discovery_path": item.discovery_path,
                "link_location": item.link_location,
                "navigation_difficulty": nav_difficulty,
                "page_category": "other",
                "page_subcategory": None,
                "content_tags": [],
                "issue_tags": [],
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
                        {"level": h.level, "text": h.text} for h in content.heading_structure
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
                "raw_text": content.main_text[:500000],  # cap at 500k chars
                "crawled_at": datetime.now(timezone.utc),
                "analyzed_at": None,
            }

            # Detect basic issues during crawl
            issue_tags = []
            if content.image_text_detected:
                issue_tags.append("image_instead_of_text")
            if not content.meta_description:
                issue_tags.append("no_meta_description")
            if not content.heading_structure:
                issue_tags.append("missing_headings")
            if content.word_count < 30:
                issue_tags.append("dead_end_page")
            page_doc["issue_tags"] = issue_tags

            await self.db.pages.insert_one(page_doc)
            self._pages_crawled += 1

            # Collect internal links for further crawling
            for lnk in content.links:
                if lnk.is_internal:
                    new_links.append((lnk.url, lnk.location))

        except Exception as exc:
            logger.error("Error crawling %s: %s", item.url, exc)

        return new_links

    async def _update_incoming_links(self) -> None:
        """Update incoming_links_count for each page based on outgoing_links of other pages."""
        pipeline = [
            {"$match": {"university_id": self.university_id}},
            {"$unwind": "$outgoing_links"},
            {"$match": {"outgoing_links.is_internal": True}},
            {"$group": {"_id": "$outgoing_links.url", "count": {"$sum": 1}}},
        ]
        try:
            async for doc in self.db.pages.aggregate(pipeline):
                target_url = doc["_id"]
                count = doc["count"]
                await self.db.pages.update_many(
                    {"university_id": self.university_id, "url": target_url},
                    {"$set": {"incoming_links_count": count}},
                )
        except Exception as exc:
            logger.error("Error updating incoming links: %s", exc)
