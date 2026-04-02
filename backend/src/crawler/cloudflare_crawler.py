"""
Cloudflare Browser Rendering crawler.

Uses Cloudflare's Browser Rendering API to:
- Render pages with full JS execution (like a real browser)
- Return clean Markdown content

Endpoints used:
  Single page:  POST /client/v4/accounts/{id}/browser-rendering/content
  Full site:    POST /client/v4/accounts/{id}/browser-rendering/crawl

Requires CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in settings.
Falls back gracefully if credentials are not set.

Docs: https://developers.cloudflare.com/browser-rendering/
"""

import logging
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import urlparse

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
import httpx

from src.config import settings
from src.crawler.content_extractor import ContentExtractor

logger = logging.getLogger("uni_audit.cf_crawler")

CF_BASE = "https://api.cloudflare.com/client/v4/accounts"


def is_configured() -> bool:
    """Return True if Cloudflare credentials are available."""
    return bool(settings.CLOUDFLARE_ACCOUNT_ID and settings.CLOUDFLARE_API_TOKEN)


def _cf_headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.CLOUDFLARE_API_TOKEN}",
        "Content-Type": "application/json",
    }


async def fetch_page_markdown(url: str) -> Optional[str]:
    """
    Fetch a single page via Cloudflare Browser Rendering.
    Returns the page as Markdown, or None on failure.
    """
    if not is_configured():
        logger.warning("Cloudflare credentials not configured — skipping CF fetch")
        return None

    endpoint = f"{CF_BASE}/{settings.CLOUDFLARE_ACCOUNT_ID}/browser-rendering/content"

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                endpoint,
                headers=_cf_headers(),
                json={
                    "url": url,
                    "screenshotOptions": {"omitBackground": False},
                    "rejectResourceTypes": ["image", "media", "font"],
                    "waitUntil": "networkidle0",
                },
            )
            if resp.status_code != 200:
                logger.warning("CF API returned %d for %s: %s", resp.status_code, url, resp.text[:200])
                return None

            data = resp.json()
            # CF returns { result: { markdown: "...", html: "..." } }
            result = data.get("result", {})
            return result.get("markdown") or result.get("content") or None

    except Exception as exc:
        logger.error("Cloudflare fetch failed for %s: %s", url, exc)
        return None


async def crawl_site(
    db: AsyncIOMotorDatabase,
    university_id: str,
    domains: list[str],
    start_url: str,
    max_pages: int = 100,
) -> int:
    """
    Use Cloudflare's /crawl endpoint to crawl an entire site.
    Stores pages in MongoDB with markdown_content.
    Returns number of pages stored.
    """
    if not is_configured():
        raise RuntimeError("Cloudflare credentials not configured")

    uni_oid = ObjectId(university_id)
    endpoint = f"{CF_BASE}/{settings.CLOUDFLARE_ACCOUNT_ID}/browser-rendering/crawl"

    await db.universities.update_one(
        {"_id": uni_oid},
        {"$set": {"status": "crawling", "updated_at": datetime.now(timezone.utc)}},
    )

    pages_stored = 0

    try:
        async with httpx.AsyncClient(timeout=300) as client:
            resp = await client.post(
                endpoint,
                headers=_cf_headers(),
                json={
                    "url": start_url,
                    "maxPages": max_pages,
                    "outputFormat": "markdown",
                    "rejectResourceTypes": ["image", "media", "font"],
                    "waitUntil": "networkidle0",
                    # Stay on same domains
                    "allowedDomains": domains,
                },
            )

            if resp.status_code != 200:
                logger.error("CF crawl API returned %d: %s", resp.status_code, resp.text[:500])
                await db.universities.update_one(
                    {"_id": uni_oid},
                    {"$set": {"status": "failed", "updated_at": datetime.now(timezone.utc)}},
                )
                return 0

            data = resp.json()
            pages = data.get("result", {}).get("pages", [])

            for page_data in pages:
                page_url = page_data.get("url", "")
                markdown = page_data.get("markdown") or page_data.get("content", "")
                html = page_data.get("html", "")

                if not page_url:
                    continue

                parsed = urlparse(page_url)

                # Extract structured content from HTML if available
                content = None
                if html:
                    extractor = ContentExtractor(html, page_url, domains)
                    content = extractor.extract()

                depth = min(len(parsed.path.strip("/").split("/")), 5) if parsed.path.strip("/") else 0

                page_doc = {
                    "university_id": uni_oid,
                    "url": page_url,
                    "domain": parsed.hostname or "",
                    "path": parsed.path or "/",
                    "title": (content.title if content else "") or page_data.get("title", ""),
                    "ai_title": "",
                    "status": "crawled",
                    "depth": depth,
                    "parent_url": None,
                    "discovery_path": [page_url],
                    "link_location": "cloudflare",
                    "navigation_difficulty": depth / 10.0,
                    "page_category": "other",
                    "page_subcategory": None,
                    "content_tags": [],
                    "issue_tags": [],
                    "quality_tags": [],
                    "ai_summary": "",
                    "ai_improvements": [],
                    "metrics": {
                        "word_count": content.word_count if content else len(markdown.split()),
                        "image_count": content.image_count if content else 0,
                        "link_count": content.link_count if content else 0,
                        "external_link_count": content.external_link_count if content else 0,
                        "broken_links": [],
                        "load_time_ms": None,
                        "has_dynamic_content": False,
                        "dynamic_elements": [],
                        "readability_score": content.readability_score if content else 50.0,
                        "mobile_friendly": None,
                        "last_modified": content.last_modified if content else None,
                        "language": content.language if content else "en",
                        "has_structured_data": content.has_structured_data if content else False,
                        "meta_description": content.meta_description if content else None,
                        "heading_structure": (
                            [{"level": h.level, "text": h.text} for h in content.heading_structure]
                            if content else []
                        ),
                    },
                    "outgoing_links": [],
                    "incoming_links_count": 0,
                    "raw_text": (content.main_text[:500_000] if content else markdown[:500_000]),
                    "markdown_content": markdown[:1_000_000],
                    "crawled_at": datetime.now(timezone.utc),
                    "analyzed_at": None,
                }

                await db.pages.insert_one(page_doc)
                pages_stored += 1

    except Exception as exc:
        logger.exception("Cloudflare crawl failed: %s", exc)
        await db.universities.update_one(
            {"_id": uni_oid},
            {"$set": {"status": "failed", "updated_at": datetime.now(timezone.utc)}},
        )
        return pages_stored

    await db.universities.update_one(
        {"_id": uni_oid},
        {
            "$set": {
                "status": "pending",
                "updated_at": datetime.now(timezone.utc),
                "summary.total_pages_crawled": pages_stored,
            }
        },
    )

    logger.info("CF crawl complete for %s: %d pages", university_id, pages_stored)
    return pages_stored
