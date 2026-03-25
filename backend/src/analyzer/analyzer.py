"""
AI-powered page analysis using Azure OpenAI.
Classifies pages, identifies content/issue/quality tags,
generates summaries and improvement suggestions.
Supports full and quick scan modes, competitor comparison,
and detailed prompt engineering for international student perspectives.
"""

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Any, Optional

import httpx
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from src.analyzer.benchmarks import (
    BENCHMARK_DATA,
    COMPLETE_ADMISSION_CHECKLIST,
    COUNTRY_QUALIFICATIONS,
    PRIORITY_SENDING_COUNTRIES,
    SCORE_CATEGORY_KEYS,
)
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

# -----------------------------------------------------------------------
# Comprehensive system prompt with detailed prompt engineering
# -----------------------------------------------------------------------

_COUNTRY_QUALIFICATIONS_TEXT = "\n".join(
    f"  - {country}: {', '.join(quals)}"
    for country, quals in COUNTRY_QUALIFICATIONS.items()
)

_PRIORITY_COUNTRIES_TEXT = ", ".join(PRIORITY_SENDING_COUNTRIES)

_ESSENTIAL_CHECKLIST_TEXT = ", ".join(COMPLETE_ADMISSION_CHECKLIST["essential"])
_IMPORTANT_CHECKLIST_TEXT = ", ".join(COMPLETE_ADMISSION_CHECKLIST["important"])

SYSTEM_PROMPT = f"""You are an expert university website auditor AI specializing in admission page analysis. Your job is to analyze a university admission-related web page and provide structured feedback that helps universities improve their online presence for prospective students.

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

## Detailed Analysis Guidelines

### 1. Page Classification
- Classify the page into the MOST specific appropriate category.
- If a page covers multiple categories, choose the primary one and note others in the summary.

### 2. Content Identification
- Tag ALL types of information present on the page using content_tags.
- Be thorough: even brief mentions of a topic (e.g., a single line about scholarships) should be tagged.
- A complete admission site should cover these essential topics: {_ESSENTIAL_CHECKLIST_TEXT}
- Important but often missing: {_IMPORTANT_CHECKLIST_TEXT}

### 3. Issue Detection - Be Thorough
Look for these specific problems:
- **Outdated information**: Dates from previous years, references to past events as upcoming, old application cycles.
- **Vague requirements**: "Good academic standing" without specifying GPA. "Competitive scores" without ranges. "Relevant experience" without examples.
- **Missing critical info**: Application page without deadlines. Tuition page without actual dollar amounts. Requirements without document specifications.
- **Accessibility barriers**: Information locked in PDFs only. Images of text instead of real text. Content behind login walls.
- **Navigation problems**: Key info buried 4+ clicks deep. Circular links. Dead-end pages with no next steps.
- **Confusing terminology**: Internal university jargon without explanation. Acronyms not defined. Different terms for the same thing across pages.

### 4. Quality Recognition
- Identify genuinely positive aspects: clear step-by-step processes, helpful calculators, comparison tables, visual timelines.
- Note if content is well-organized with proper headings and scannable format.

### 5. Improvement Suggestions - Prioritize by Impact
For each improvement:
- **Critical**: Issues that could cause an applicant to abandon the process or make errors (missing deadlines, unclear requirements, broken application links).
- **Warning**: Issues that create confusion or friction but don't block the process.
- **Suggestion**: Nice-to-have improvements for better user experience.

### 6. Multiple Student Profile Evaluation
Consider how well this page serves EACH of these student types:
- **International undergraduate** (first-time freshman from another country)
- **Domestic undergraduate** (local student applying for the first time)
- **Transfer student** (moving from another university)
- **Graduate student** (applying for master's or PhD)
- **Non-traditional student** (working adults, returning students)

If the page fails to address one of these major groups, note it as a critical or warning issue.

### 7. International Student Perspective - CRITICAL
This is the most important dimension. Evaluate from the perspective of students in major sending countries:
Priority countries: {_PRIORITY_COUNTRIES_TEXT}

For each country mentioned (or conspicuously absent), consider:
- Can a student from India figure out if their 12th standard marks (CBSE/ICSE/State Board) are accepted?
- Can a Chinese student determine if their Gaokao score qualifies them?
- Can a Kazakh student find out if their UNT/ENT scores are recognized?
- Can a Nigerian student determine WAEC/NECO equivalencies?
- Can a Vietnamese student figure out if their National High School Exam is sufficient?

Known qualifications by country:
{_COUNTRY_QUALIFICATIONS_TEXT}

### 8. Country Coverage Assessment
- If the page mentions country-specific requirements, populate country_specific_info.
- Note which major sending countries are NOT covered - this is a significant gap.

## Examples of Good vs Bad Pages

### GOOD admission page characteristics:
- Clear step-by-step application process with numbered steps
- Specific deadlines with dates (not just "Fall deadline")
- Exact score requirements (e.g., "IELTS 6.5 with no band below 6.0")
- Country-specific credential equivalencies
- Estimated costs with currency converter or multiple currencies
- Next steps after acceptance (visa, housing, enrollment deposit)
- FAQ section addressing common questions
- Multiple contact methods (email, phone, chat, WhatsApp)

### BAD admission page characteristics:
- "Contact us for more information" instead of listing requirements
- PDF-only application forms with no online option
- Requirements page that says "see department website" for each program
- No mention of international credential evaluation
- Deadlines shown in academic jargon ("Priority Action Date" without explaining what it means)
- Single generic email for all inquiries
- No information about cost in any form

Be thorough but concise. Only assign tags that genuinely apply. Focus improvements on changes that would measurably help prospective students find and understand information."""


# -----------------------------------------------------------------------
# Quick scan system prompt (lighter analysis)
# -----------------------------------------------------------------------

QUICK_SCAN_SYSTEM_PROMPT = f"""You are a university website auditor performing a QUICK preliminary assessment. Analyze the page rapidly and identify only the most significant findings.

You must call the `analyze_page` function with your findings.

## Available Tags
### Content Tags: {', '.join(ALL_CONTENT_TAGS[:30])}...
### Issue Tags: {', '.join(ALL_ISSUE_TAGS[:20])}...
### Quality Tags: {', '.join(ALL_QUALITY_TAGS[:15])}...
### Page Categories: {', '.join(PAGE_CATEGORIES)}

## Quick Scan Focus:
1. Classify the page category.
2. Identify the TOP 3-5 content tags (most prominent content only).
3. Identify the TOP 3 issues (most critical only).
4. Note 1-2 quality markers if obvious.
5. Write a 1-sentence summary.
6. List only critical improvements (max 3).
7. Briefly note international student perspective gaps.

Keep it fast and focused. Only flag what's most important."""


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

    # ------------------------------------------------------------------
    # Full analysis
    # ------------------------------------------------------------------

    async def analyze_all(self) -> int:
        """Analyze all crawled pages for this university. Returns count of pages analyzed."""
        await self.db.universities.update_one(
            {"_id": self.university_id},
            {"$set": {"status": "analyzing", "updated_at": datetime.now(timezone.utc)}},
        )

        # Fetch pages that need analysis, prioritize admission-related
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

        tasks = [self._analyze_page(page_doc, quick=False) for page_doc in all_pages]
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

    # ------------------------------------------------------------------
    # Quick scan analysis (depth 0-1 only, lighter prompts)
    # ------------------------------------------------------------------

    async def analyze_quick(self) -> int:
        """Quick scan: analyze only top-level pages (depth 0-1).
        Returns count of pages analyzed. Much cheaper on API calls.
        """
        await self.db.universities.update_one(
            {"_id": self.university_id},
            {"$set": {"status": "analyzing_quick", "updated_at": datetime.now(timezone.utc)}},
        )

        pages: list[dict] = []
        async for page_doc in self.db.pages.find(
            {
                "university_id": self.university_id,
                "status": "crawled",
                "depth": {"$lte": 1},
            }
        ):
            pages.append(page_doc)

        self._total_count = len(pages)
        logger.info("Quick scan: analyzing %d top-level pages for %s", self._total_count, self.university_id)

        tasks = [self._analyze_page(page_doc, quick=True) for page_doc in pages]
        await asyncio.gather(*tasks)

        await self.db.universities.update_one(
            {"_id": self.university_id},
            {
                "$set": {
                    "status": "quick_scan_completed",
                    "updated_at": datetime.now(timezone.utc),
                    "summary.total_pages_analyzed": self._analyzed_count,
                }
            },
        )

        logger.info("Quick scan complete: %d/%d pages for %s", self._analyzed_count, self._total_count, self.university_id)
        return self._analyzed_count

    # ------------------------------------------------------------------
    # Competitor comparison / insights
    # ------------------------------------------------------------------

    async def generate_competitor_insights(self, university_id: Optional[str] = None) -> dict[str, Any]:
        """Compare a university's scores against benchmark data and all analyzed universities.

        Returns insights including percentile ranking, benchmark comparison,
        and natural-language sales-ready insights.
        """
        uid = ObjectId(university_id) if university_id else self.university_id

        uni_doc = await self.db.universities.find_one({"_id": uid})
        if not uni_doc:
            return {"error": "University not found"}

        summary = uni_doc.get("summary", {})
        category_scores = summary.get("category_scores", {})

        uni_scores = {
            "overall_score": summary.get("overall_score", 0),
            "content_quality": category_scores.get("content_quality", 0),
            "navigation": category_scores.get("navigation", 0),
            "completeness": category_scores.get("completeness", 0),
            "accessibility": category_scores.get("accessibility", 0),
            "seo": category_scores.get("seo", 0),
            "freshness": category_scores.get("freshness", 0),
        }

        # 1. Compare against static benchmarks
        benchmark_comparison = {}
        for tier_name, tier_data in BENCHMARK_DATA.items():
            tier_comparison: dict[str, Any] = {}
            for key in SCORE_CATEGORY_KEYS:
                uni_val = uni_scores.get(key, 0)
                bench_val = tier_data.get(key, 0)
                diff = round(uni_val - bench_val, 1)
                tier_comparison[key] = {
                    "university": uni_val,
                    "benchmark": bench_val,
                    "difference": diff,
                    "status": "above" if diff > 0 else ("at" if diff == 0 else "below"),
                }
            benchmark_comparison[tier_name] = tier_comparison

        # 2. Compare against all analyzed universities in the database (percentile)
        all_scores: dict[str, list[float]] = {k: [] for k in SCORE_CATEGORY_KEYS}
        async for other_uni in self.db.universities.find(
            {"status": {"$in": ["completed", "quick_scan_completed"]}},
            {"summary": 1},
        ):
            other_summary = other_uni.get("summary", {})
            other_cat = other_summary.get("category_scores", {})
            all_scores["overall_score"].append(other_summary.get("overall_score", 0))
            for key in SCORE_CATEGORY_KEYS:
                if key != "overall_score":
                    all_scores[key].append(other_cat.get(key, 0))

        percentile_ranks: dict[str, float] = {}
        for key in SCORE_CATEGORY_KEYS:
            scores_list = all_scores[key]
            if len(scores_list) < 2:
                percentile_ranks[key] = 50.0  # Not enough data
                continue
            uni_val = uni_scores.get(key, 0)
            below_count = sum(1 for s in scores_list if s < uni_val)
            percentile_ranks[key] = round((below_count / len(scores_list)) * 100, 1)

        # 3. Generate natural-language sales insights
        insights: list[str] = []
        uni_name = uni_doc.get("name", "This university")

        for key in SCORE_CATEGORY_KEYS:
            uni_val = uni_scores.get(key, 0)
            # Compare against regional average
            regional = BENCHMARK_DATA["regional_average"].get(key, 50)
            top_200 = BENCHMARK_DATA["top_200_global"].get(key, 65)

            label = key.replace("_", " ").title()

            if uni_val < regional:
                diff = round(regional - uni_val, 1)
                insights.append(
                    f"{uni_name}'s admission pages score {diff} points lower than "
                    f"the regional average in {label} ({uni_val} vs {regional})."
                )
            elif uni_val < top_200:
                diff = round(top_200 - uni_val, 1)
                insights.append(
                    f"{uni_name} is {diff} points below top-200 global universities "
                    f"in {label} ({uni_val} vs {top_200})."
                )
            else:
                insights.append(
                    f"{uni_name} performs above top-200 benchmarks in {label} ({uni_val})."
                )

        # 4. Checklist gap analysis
        all_content_tags: set[str] = set()
        async for page in self.db.pages.find(
            {"university_id": uid, "status": "analyzed"},
            {"content_tags": 1},
        ):
            all_content_tags.update(page.get("content_tags", []))

        essential_missing = [
            t for t in COMPLETE_ADMISSION_CHECKLIST["essential"]
            if t not in all_content_tags
        ]
        important_missing = [
            t for t in COMPLETE_ADMISSION_CHECKLIST["important"]
            if t not in all_content_tags
        ]

        if essential_missing:
            insights.append(
                f"CRITICAL GAP: {uni_name} is missing {len(essential_missing)} essential "
                f"admission content items: {', '.join(essential_missing[:5])}."
            )

        # 5. Estimated applicant dropout risk based on issues
        critical_count = summary.get("critical_issues_count", 0)
        total_analyzed = summary.get("total_pages_analyzed", 1)
        if critical_count > 0:
            risk_pct = min(round(critical_count / max(total_analyzed, 1) * 100, 1), 60)
            insights.append(
                f"Estimated {risk_pct}% of prospective applicants may encounter "
                f"friction due to {critical_count} critical issues found across {total_analyzed} pages."
            )

        return {
            "university_id": str(uid),
            "university_name": uni_name,
            "scores": uni_scores,
            "benchmark_comparison": benchmark_comparison,
            "percentile_ranks": percentile_ranks,
            "total_universities_compared": len(all_scores.get("overall_score", [])),
            "insights": insights,
            "checklist_gaps": {
                "essential_missing": essential_missing,
                "important_missing": important_missing,
                "essential_coverage": round(
                    (len(COMPLETE_ADMISSION_CHECKLIST["essential"]) - len(essential_missing))
                    / max(len(COMPLETE_ADMISSION_CHECKLIST["essential"]), 1)
                    * 100,
                    1,
                ),
                "important_coverage": round(
                    (len(COMPLETE_ADMISSION_CHECKLIST["important"]) - len(important_missing))
                    / max(len(COMPLETE_ADMISSION_CHECKLIST["important"]), 1)
                    * 100,
                    1,
                ),
            },
        }

    # ------------------------------------------------------------------
    # Internal: analyze a single page
    # ------------------------------------------------------------------

    async def _analyze_page(self, page_doc: dict, quick: bool = False) -> None:
        """Analyze a single page with rate limiting."""
        async with self._semaphore:
            page_id = page_doc["_id"]
            url = page_doc.get("url", "")
            try:
                raw_text = page_doc.get("raw_text", "")
                # Truncate: shorter for quick scan
                max_text = 3000 if quick else 8000
                if len(raw_text) > max_text:
                    raw_text = raw_text[:max_text] + "\n...[truncated]..."

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

                system_prompt = QUICK_SCAN_SYSTEM_PROMPT if quick else SYSTEM_PROMPT
                max_tokens = 1500 if quick else settings.ANALYZER_MAX_TOKENS

                result = await self._call_openai(user_message, system_prompt, max_tokens)
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

                update: dict[str, Any] = {
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

                # Store country-specific info if present
                country_info = result.get("country_specific_info")
                if country_info:
                    update["country_specific_info"] = country_info

                await self.db.pages.update_one(
                    {"_id": page_id},
                    {"$set": update},
                )
                self._analyzed_count += 1
                mode_label = "quick" if quick else "full"
                logger.info(
                    "Analyzed [%d/%d] (%s) %s -> %s",
                    self._analyzed_count,
                    self._total_count,
                    mode_label,
                    url,
                    result.get("page_category", "?"),
                )

            except Exception as exc:
                logger.error("Error analyzing %s: %s", url, exc)
                await self.db.pages.update_one(
                    {"_id": page_id},
                    {"$set": {"status": "error"}},
                )

    # ------------------------------------------------------------------
    # Azure OpenAI call with exponential backoff retry
    # ------------------------------------------------------------------

    async def _call_openai(
        self,
        user_message: str,
        system_prompt: str = SYSTEM_PROMPT,
        max_tokens: int | None = None,
    ) -> Optional[dict[str, Any]]:
        """Call Azure OpenAI with function calling and exponential backoff retry."""
        url = f"{self._api_base}/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "api-key": self._api_key,
        }
        params = {"api-version": self._api_version}
        body = {
            "model": self._model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            "tools": [ANALYZE_TOOL],
            "tool_choice": {"type": "function", "function": {"name": "analyze_page"}},
            "max_completion_tokens": max_tokens or settings.ANALYZER_MAX_TOKENS,
        }

        max_retries = 5
        base_delay = 1.0  # seconds

        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=90) as client:
                    resp = await client.post(url, headers=headers, params=params, json=body)

                    if resp.status_code == 429:
                        retry_after = int(resp.headers.get("retry-after", base_delay * (2 ** attempt)))
                        logger.warning(
                            "Rate limited (attempt %d/%d), waiting %ds",
                            attempt + 1, max_retries, retry_after,
                        )
                        await asyncio.sleep(retry_after)
                        continue

                    if resp.status_code >= 500:
                        # Server error - retry with backoff
                        delay = base_delay * (2 ** attempt)
                        logger.warning(
                            "Server error %d (attempt %d/%d), retrying in %.1fs",
                            resp.status_code, attempt + 1, max_retries, delay,
                        )
                        await asyncio.sleep(delay)
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
                delay = base_delay * (2 ** attempt)
                logger.error(
                    "OpenAI API error (attempt %d/%d): %s - retrying in %.1fs",
                    attempt + 1, max_retries, exc, delay,
                )
                if attempt < max_retries - 1:
                    await asyncio.sleep(delay)
            except httpx.TimeoutException:
                delay = base_delay * (2 ** attempt)
                logger.warning(
                    "OpenAI request timeout (attempt %d/%d) - retrying in %.1fs",
                    attempt + 1, max_retries, delay,
                )
                if attempt < max_retries - 1:
                    await asyncio.sleep(delay)
            except Exception as exc:
                delay = base_delay * (2 ** attempt)
                logger.error(
                    "OpenAI call failed (attempt %d/%d): %s - retrying in %.1fs",
                    attempt + 1, max_retries, exc, delay,
                )
                if attempt < max_retries - 1:
                    await asyncio.sleep(delay)

        logger.error("All %d retry attempts exhausted for OpenAI call", max_retries)
        return None
