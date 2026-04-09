"""
Cloudflare Browser Rendering crawler.

Two Cloudflare endpoints:

  /content  — render a single URL, return HTML + (optionally) Markdown
  /crawl    — crawl entire site starting from a URL, return array of pages

Both use full headless Chrome in Cloudflare's infrastructure, so:
  - JS-rendered content is fully executed
  - Bot protection is bypassed (CF's own infra)
  - Dynamic React/Vue apps render correctly

Credentials required in .env:
  CLOUDFLARE_ACCOUNT_ID      (your CF account ID)
  CLOUDFLARE_API_TOKEN       (API token with Browser Rendering permission)
  — or —
  CLOUDFLARE_GLOBAL_API_TOKEN  (Workers API token, cfk_... prefix)

Docs: https://developers.cloudflare.com/browser-rendering/
"""

import logging
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import urlparse

import httpx
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from src.config import settings
from src.crawler.content_extractor import ContentExtractor
from src.crawler.html_cleaner import html_to_clean_markdown, estimate_content_quality

logger = logging.getLogger("uni_audit.cf_crawler")

CF_BASE = "https://api.cloudflare.com/client/v4/accounts"

# Default render options applied to every request
_RENDER_OPTIONS = {
    "rejectResourceTypes": ["image", "media", "font", "stylesheet"],
    "waitUntil": "networkidle0",
    "gotoOptions": {"timeout": 25000},
}


def is_configured() -> bool:
    """Return True if Cloudflare credentials are available."""
    return settings.cf_ready


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.cf_token}",
        "Content-Type": "application/json",
    }


def _endpoint(path: str) -> str:
    return f"{CF_BASE}/{settings.CLOUDFLARE_ACCOUNT_ID}/browser-rendering/{path}"


def _parse_cf_response(data: dict, url: str) -> tuple[str, str]:
    """
    Extract html + markdown from a CF API response dict.
    CF response shape:
      { "success": true, "result": { "html": "...", "markdown": "...", ... } }
    or for /crawl:
      { "success": true, "result": [{ "url": "...", "html": "...", ... }] }
    Returns (html, markdown).
    """
    if not data.get("success"):
        errors = data.get("errors", [])
        logger.warning("CF API error for %s: %s", url, errors)
        return "", ""

    result = data.get("result", {})

    # /content returns a dict; /crawl returns a list
    if isinstance(result, list):
        # Find matching URL
        for page in result:
            if page.get("url", "").rstrip("/") == url.rstrip("/"):
                result = page
                break
        else:
            result = result[0] if result else {}

    html = result.get("html", "") or ""
    markdown = result.get("markdown", "") or ""

    # If CF doesn't return markdown directly, generate it from HTML
    if not markdown and html:
        markdown = html_to_clean_markdown(html, base_url=url)

    return html, markdown


# ── Single-page fetch ─────────────────────────────────────────────────────────

async def fetch_page_content(url: str) -> tuple[str, str]:
    """
    Render a single URL via CF Browser Rendering.
    Returns (html, markdown). Both empty on failure.
    """
    if not is_configured():
        logger.warning("CF not configured — cannot fetch %s", url)
        return "", ""

    try:
        async with httpx.AsyncClient(timeout=40) as client:
            resp = await client.post(
                _endpoint("content"),
                headers=_headers(),
                json={"url": url, **_RENDER_OPTIONS},
            )
            if resp.status_code != 200:
                logger.warning("CF /content HTTP %d for %s: %s", resp.status_code, url, resp.text[:300])
                return "", ""

            return _parse_cf_response(resp.json(), url)

    except Exception as exc:
        logger.error("CF /content exception for %s: %s", url, exc)
        return "", ""


# ── Full-site crawl ───────────────────────────────────────────────────────────

async def crawl_site(
    db: AsyncIOMotorDatabase,
    university_id: str,
    domains: list[str],
    start_url: str,
    max_pages: int = 100,
) -> int:
    """
    Use CF /crawl to crawl an entire site.
    Returns number of pages stored in MongoDB.
    """
    if not is_configured():
        raise RuntimeError("Cloudflare credentials not configured (CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN)")

    uni_oid = ObjectId(university_id)

    await db.universities.update_one(
        {"_id": uni_oid},
        {"$set": {"status": "crawling", "updated_at": datetime.now(timezone.utc)}},
    )

    pages_stored = 0

    try:
        async with httpx.AsyncClient(timeout=300) as client:
            logger.info("CF /crawl starting from %s, max_pages=%d", start_url, max_pages)
            resp = await client.post(
                _endpoint("crawl"),
                headers=_headers(),
                json={
                    "url": start_url,
                    "maxPages": max_pages,
                    "allowedDomains": domains,
                    **_RENDER_OPTIONS,
                },
            )

            if resp.status_code != 200:
                logger.error("CF /crawl HTTP %d: %s", resp.status_code, resp.text[:500])
                await _set_failed(db, uni_oid)
                return 0

            data = resp.json()
            if not data.get("success"):
                logger.error("CF /crawl errors: %s", data.get("errors", []))
                await _set_failed(db, uni_oid)
                return 0

            # Result can be a list directly or wrapped in result key
            result = data.get("result", data)
            if isinstance(result, dict):
                pages_list = result.get("pages", [])
            elif isinstance(result, list):
                pages_list = result
            else:
                pages_list = []

            logger.info("CF /crawl returned %d pages", len(pages_list))

            for page_data in pages_list:
                page_url = page_data.get("url", "")
                if not page_url:
                    continue

                html = page_data.get("html", "") or ""
                markdown = page_data.get("markdown", "") or ""

                if not markdown and html:
                    markdown = html_to_clean_markdown(html, base_url=page_url)

                content = None
                if html:
                    try:
                        extractor = ContentExtractor(html, page_url, domains)
                        content = extractor.extract()
                    except Exception:
                        pass

                parsed = urlparse(page_url)
                depth = min(len(parsed.path.strip("/").split("/")), 5) if parsed.path.strip("/") else 0
                md_quality = estimate_content_quality(markdown)

                page_doc = {
                    "university_id": uni_oid,
                    "url": page_url,
                    "domain": parsed.hostname or "",
                    "path": parsed.path or "/",
                    "title": (
                        page_data.get("title")
                        or (content.title if content else "")
                        or parsed.path
                    ),
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
                        "has_dynamic_content": True,  # CF-rendered pages are always dynamic
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
                        "markdown_quality_score": md_quality,
                        "crawl_backend": "cloudflare",
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
                    "markdown_content": markdown[:1_000_000],
                    "crawled_at": datetime.now(timezone.utc),
                    "analyzed_at": None,
                }

                await db.pages.insert_one(page_doc)
                pages_stored += 1

    except Exception as exc:
        logger.exception("CF crawl_site failed: %s", exc)
        await _set_failed(db, uni_oid)
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

    logger.info("CF crawl complete for %s: %d pages stored", university_id, pages_stored)
    return pages_stored


async def _set_failed(db: AsyncIOMotorDatabase, uni_oid: ObjectId) -> None:
    await db.universities.update_one(
        {"_id": uni_oid},
        {"$set": {"status": "failed", "updated_at": datetime.now(timezone.utc)}},
    )
