"""
AI-powered page analysis using Azure OpenAI.
Classifies pages, identifies content/issue/quality tags,
generates summaries and improvement suggestions.
"""

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Any, Optional

import httpx
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from src.config import settings
from src.models.tags import (
    ALL_CONTENT_TAGS,
    ALL_ISSUE_TAGS,
    ALL_QUALITY_TAGS,
    PAGE_CATEGORIES,
)

logger = logging.getLogger("uni_audit.analyzer")

ANALYZE_TOOL = {
    "type": "function",
    "function": {
        "name": "analyze_page",
        "description": "Analyze a university web page and return structured findings.",
        "parameters": {
            "type": "object",
            "properties": {
                "ai_title": {
                    "type": "string",
                    "description": "Short title for the page, max 5 words, suitable for a tree-view node label.",
                },
                "page_category": {
                    "type": "string",
                    "enum": PAGE_CATEGORIES,
                    "description": "Primary category of this page.",
                },
                "page_subcategory": {
                    "type": "string",
                    "description": "Optional subcategory for more specific classification.",
                },
                "content_tags": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": f"Tags for information present on the page. Choose from: {', '.join(ALL_CONTENT_TAGS[:40])}... (full list provided in system prompt)",
                },
                "issue_tags": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": f"Tags for problems found on the page. Choose from: {', '.join(ALL_ISSUE_TAGS[:30])}... (full list in system prompt)",
                },
                "quality_tags": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": f"Tags for positive quality markers. Choose from: {', '.join(ALL_QUALITY_TAGS[:20])}...",
                },
                "ai_summary": {
                    "type": "string",
                    "description": "Brief overview of the page content (2-3 sentences).",
                },
                "ai_improvements": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "type": {
                                "type": "string",
                                "enum": ["critical", "warning", "suggestion"],
                            },
                            "category": {"type": "string"},
                            "description": {"type": "string"},
                            "impact": {"type": "string"},
                        },
                        "required": ["type", "category", "description", "impact"],
                    },
                    "description": "List of improvements. Each has type (critical/warning/suggestion), category, description, and impact.",
                },
                "country_specific_info": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "country": {"type": "string"},
                            "qualification": {"type": "string"},
                            "details": {"type": "string"},
                        },
                        "required": ["country", "qualification", "details"],
                    },
                    "description": "Country-specific admission info found on the page.",
                },
            },
            "required": [
                "ai_title",
                "page_category",
                "content_tags",
                "issue_tags",
                "quality_tags",
                "ai_summary",
                "ai_improvements",
            ],
        },
    },
}

SYSTEM_PROMPT = f"""You are a university website auditor AI. Your job is to analyze a university admission-related web page and provide structured feedback.

You must call the `analyze_page` function with your findings.

## Available Tags

### Content Tags (what information is present):
{', '.join(ALL_CONTENT_TAGS)}

### Issue Tags (problems found):
{', '.join(ALL_ISSUE_TAGS)}

### Quality Tags (positive markers):
{', '.join(ALL_QUALITY_TAGS)}

### Page Categories:
{', '.join(PAGE_CATEGORIES)}

## Analysis Guidelines:
1. **Classify** the page into the most appropriate category.
2. **Identify content** - tag all types of information present on the page using content_tags.
3. **Find issues** - look for problems like outdated info, broken links, vague requirements, accessibility issues, poor navigation.
4. **Note quality** - identify positive aspects like clear structure, visual aids, interactive elements.
5. **Generate improvements** - provide actionable suggestions, prioritized by impact.
6. **International perspective** - specifically evaluate how well the page serves international students. Check for country-specific requirements, credential evaluation info, visa details.
7. **Country coverage** - note which countries' qualifications or requirements are explicitly mentioned.

Be thorough but concise. Only assign tags that genuinely apply. For improvements, focus on high-impact changes that would help prospective students find and understand information."""


class PageAnalyzer:
    """Analyzes crawled pages using Azure OpenAI."""

    def __init__(self, db: AsyncIOMotorDatabase, university_id: str):
        self.db = db
        self.university_id = ObjectId(university_id)
        self._semaphore = asyncio.Semaphore(settings.ANALYZER_MAX_CONCURRENCY)
        self._api_base = settings.AZURE_OPENAI_ENDPOINT.rstrip("/")
        self._model = settings.AZURE_OPENAI_MODEL
        self._api_key = settings.AZURE_OPENAI_API_KEY
        self._api_version = settings.AZURE_OPENAI_API_VERSION
        self._analyzed_count = 0
        self._total_count = 0

    async def analyze_all(self) -> int:
        """Analyze all crawled pages for this university. Returns count of pages analyzed."""
        await self.db.universities.update_one(
            {"_id": self.university_id},
            {"$set": {"status": "analyzing", "updated_at": datetime.now(timezone.utc)}},
        )

        # Fetch pages that need analysis, prioritize admission-related
        priority_categories = [
            "admissions",
            "scholarships",
            "financial_aid",
            "tuition_fees",
            "international",
            "majors_programs",
        ]
        priority_regex = "|".join(
            [r"admission", r"apply", r"scholar", r"tuition", r"financial", r"international", r"program", r"major"]
        )

        # Get priority pages first
        priority_pages = []
        other_pages = []

        async for page_doc in self.db.pages.find(
            {"university_id": self.university_id, "status": "crawled"}
        ):
            url_lower = page_doc.get("url", "").lower()
            title_lower = page_doc.get("title", "").lower()
            path_lower = page_doc.get("path", "").lower()
            combined = f"{url_lower} {title_lower} {path_lower}"
            if any(kw in combined for kw in ["admission", "apply", "scholar", "tuition", "financial", "international", "program", "major"]):
                priority_pages.append(page_doc)
            else:
                other_pages.append(page_doc)

        all_pages = priority_pages + other_pages
        self._total_count = len(all_pages)
        logger.info("Analyzing %d pages (%d priority) for university %s", self._total_count, len(priority_pages), self.university_id)

        tasks = [self._analyze_page(page_doc) for page_doc in all_pages]
        await asyncio.gather(*tasks)

        # Update university status
        await self.db.universities.update_one(
            {"_id": self.university_id},
            {
                "$set": {
                    "status": "completed",
                    "updated_at": datetime.now(timezone.utc),
                    "summary.total_pages_analyzed": self._analyzed_count,
                }
            },
        )

        logger.info("Analysis complete: %d/%d pages for %s", self._analyzed_count, self._total_count, self.university_id)
        return self._analyzed_count

    async def _analyze_page(self, page_doc: dict) -> None:
        """Analyze a single page with rate limiting."""
        async with self._semaphore:
            page_id = page_doc["_id"]
            url = page_doc.get("url", "")
            try:
                raw_text = page_doc.get("raw_text", "")
                # Truncate to ~8000 chars to stay within token limits
                if len(raw_text) > 8000:
                    raw_text = raw_text[:8000] + "\n...[truncated]..."

                title = page_doc.get("title", "")
                path = page_doc.get("path", "")
                depth = page_doc.get("depth", 0)
                headings = page_doc.get("metrics", {}).get("heading_structure", [])
                headings_text = "\n".join(
                    f"{'#' * h.get('level', 1)} {h.get('text', '')}" for h in headings[:30]
                )
                word_count = page_doc.get("metrics", {}).get("word_count", 0)
                meta_desc = page_doc.get("metrics", {}).get("meta_description", "")

                user_message = f"""Analyze this university web page:

URL: {url}
Title: {title}
Path: {path}
Depth from homepage: {depth}
Word count: {word_count}
Meta description: {meta_desc or 'None'}

Heading structure:
{headings_text or 'No headings found'}

Page content:
{raw_text}"""

                result = await self._call_openai(user_message)
                if result is None:
                    logger.warning("No AI result for %s", url)
                    await self.db.pages.update_one(
                        {"_id": page_id},
                        {"$set": {"status": "error"}},
                    )
                    return

                # Validate tags against taxonomy
                content_tags = [t for t in result.get("content_tags", []) if t in ALL_CONTENT_TAGS]
                issue_tags_from_ai = [t for t in result.get("issue_tags", []) if t in ALL_ISSUE_TAGS]
                quality_tags = [t for t in result.get("quality_tags", []) if t in ALL_QUALITY_TAGS]

                # Merge with crawler-detected issue tags
                existing_issue_tags = page_doc.get("issue_tags", [])
                merged_issue_tags = list(set(existing_issue_tags + issue_tags_from_ai))

                update = {
                    "status": "analyzed",
                    "ai_title": result.get("ai_title", title[:30]),
                    "page_category": result.get("page_category", "other"),
                    "page_subcategory": result.get("page_subcategory"),
                    "content_tags": content_tags,
                    "issue_tags": merged_issue_tags,
                    "quality_tags": quality_tags,
                    "ai_summary": result.get("ai_summary", ""),
                    "ai_improvements": result.get("ai_improvements", []),
                    "analyzed_at": datetime.now(timezone.utc),
                }

                await self.db.pages.update_one(
                    {"_id": page_id},
                    {"$set": update},
                )
                self._analyzed_count += 1
                logger.info(
                    "Analyzed [%d/%d] %s -> %s",
                    self._analyzed_count,
                    self._total_count,
                    url,
                    result.get("page_category", "?"),
                )

            except Exception as exc:
                logger.error("Error analyzing %s: %s", url, exc)
                await self.db.pages.update_one(
                    {"_id": page_id},
                    {"$set": {"status": "error"}},
                )

    async def _call_openai(self, user_message: str) -> Optional[dict[str, Any]]:
        """Call Azure OpenAI with function calling."""
        url = f"{self._api_base}/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "api-key": self._api_key,
        }
        params = {"api-version": self._api_version}
        body = {
            "model": self._model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            "tools": [ANALYZE_TOOL],
            "tool_choice": {"type": "function", "function": {"name": "analyze_page"}},
            "max_tokens": settings.ANALYZER_MAX_TOKENS,
            "temperature": 0.3,
        }

        retries = 3
        for attempt in range(retries):
            try:
                async with httpx.AsyncClient(timeout=60) as client:
                    resp = await client.post(url, headers=headers, params=params, json=body)
                    if resp.status_code == 429:
                        retry_after = int(resp.headers.get("retry-after", 5))
                        logger.warning("Rate limited, waiting %ds", retry_after)
                        await asyncio.sleep(retry_after)
                        continue
                    resp.raise_for_status()
                    data = resp.json()

                    choices = data.get("choices", [])
                    if not choices:
                        return None

                    message = choices[0].get("message", {})
                    tool_calls = message.get("tool_calls", [])
                    if tool_calls:
                        args_str = tool_calls[0]["function"]["arguments"]
                        return json.loads(args_str)

                    # Fallback: try to parse content as JSON
                    content = message.get("content", "")
                    if content:
                        try:
                            return json.loads(content)
                        except json.JSONDecodeError:
                            logger.warning("Could not parse AI response as JSON")
                    return None

            except httpx.HTTPStatusError as exc:
                logger.error("OpenAI API error (attempt %d): %s", attempt + 1, exc)
                if attempt < retries - 1:
                    await asyncio.sleep(2 ** attempt)
            except Exception as exc:
                logger.error("OpenAI call failed (attempt %d): %s", attempt + 1, exc)
                if attempt < retries - 1:
                    await asyncio.sleep(2 ** attempt)

        return None
