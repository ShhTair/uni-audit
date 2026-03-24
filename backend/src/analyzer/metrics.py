"""
Aggregate metrics calculator for a university.
Computes scores across all analyzed pages.
"""

import logging
from collections import Counter, defaultdict
from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from src.models.tags import (
    ALL_CONTENT_TAGS,
    CONTENT_TAG_GROUPS,
    EXPECTED_TAGS_BY_CATEGORY,
    ISSUE_TAGS_ACCESSIBILITY,
    ISSUE_TAGS_CONTENT,
    ISSUE_TAGS_NAVIGATION,
    ISSUE_TAGS_TECHNICAL,
    ISSUE_TAGS_UX,
)

logger = logging.getLogger("uni_audit.metrics")


class MetricsCalculator:
    """Calculate metrics from analyzed pages."""

    def __init__(self, db: AsyncIOMotorDatabase, university_id: str):
        self.db = db
        self.university_id = ObjectId(university_id)

    async def calculate(self) -> dict[str, Any]:
        """Calculate all metrics and update university summary. Returns full metrics dict."""
        pages = []
        async for doc in self.db.pages.find({"university_id": self.university_id}):
            pages.append(doc)

        if not pages:
            return {"error": "No pages found"}

        analyzed = [p for p in pages if p.get("status") == "analyzed"]
        total_crawled = len(pages)
        total_analyzed = len(analyzed)

        # ---------------------------------------------------------------
        # Collect tags across all pages
        # ---------------------------------------------------------------
        all_content_tags: set[str] = set()
        all_issue_tags: list[str] = []
        all_quality_tags: list[str] = []
        all_improvements: list[dict] = []
        category_counts: Counter = Counter()

        for p in analyzed:
            all_content_tags.update(p.get("content_tags", []))
            all_issue_tags.extend(p.get("issue_tags", []))
            all_quality_tags.extend(p.get("quality_tags", []))
            all_improvements.extend(p.get("ai_improvements", []))
            cat = p.get("page_category", "other")
            category_counts[cat] += 1

        issue_counter = Counter(all_issue_tags)
        quality_counter = Counter(all_quality_tags)

        critical_count = sum(1 for imp in all_improvements if imp.get("type") == "critical")
        warning_count = sum(1 for imp in all_improvements if imp.get("type") == "warning")
        suggestion_count = sum(1 for imp in all_improvements if imp.get("type") == "suggestion")

        # ---------------------------------------------------------------
        # 1. Content Quality Score (0-100)
        # ---------------------------------------------------------------
        content_quality = self._content_quality_score(analyzed, issue_counter, quality_counter)

        # ---------------------------------------------------------------
        # 2. Navigation Score (0-100)
        # ---------------------------------------------------------------
        navigation = self._navigation_score(analyzed)

        # ---------------------------------------------------------------
        # 3. Completeness Score (0-100)
        # ---------------------------------------------------------------
        completeness = self._completeness_score(all_content_tags, analyzed)

        # ---------------------------------------------------------------
        # 4. Accessibility Score (0-100)
        # ---------------------------------------------------------------
        accessibility = self._accessibility_score(analyzed, issue_counter)

        # ---------------------------------------------------------------
        # 5. SEO Score (0-100)
        # ---------------------------------------------------------------
        seo = self._seo_score(analyzed)

        # ---------------------------------------------------------------
        # 6. Freshness Score (0-100)
        # ---------------------------------------------------------------
        freshness = self._freshness_score(analyzed, issue_counter)

        # ---------------------------------------------------------------
        # Overall Score (weighted composite)
        # ---------------------------------------------------------------
        overall = (
            content_quality * 0.25
            + navigation * 0.15
            + completeness * 0.25
            + accessibility * 0.10
            + seo * 0.10
            + freshness * 0.15
        )

        # ---------------------------------------------------------------
        # Additional metrics
        # ---------------------------------------------------------------
        confusion_rate = self._confusion_rate(analyzed)
        info_depth = self._information_depth(analyzed)
        dead_end_ratio = self._dead_end_ratio(analyzed, issue_counter)
        intl_readiness = self._international_readiness_score(all_content_tags, analyzed)
        avg_load_time = self._avg_load_time(pages)
        broken_links_count = sum(
            len(p.get("metrics", {}).get("broken_links", []))
            for p in pages
        ) + issue_counter.get("broken_link", 0)

        # Country coverage
        country_coverage = self._country_coverage(analyzed)

        # Per-category completeness
        category_completeness = self._category_completeness(analyzed, all_content_tags)

        # Top issues (most frequent)
        top_issue_tags = issue_counter.most_common(5)
        top_issues = [f"{tag} ({count} pages)" for tag, count in top_issue_tags]

        # Top improvements
        improvement_descriptions = []
        critical_improvements = [imp for imp in all_improvements if imp.get("type") == "critical"]
        for imp in critical_improvements[:5]:
            desc = imp.get("description", "")
            if desc and desc not in improvement_descriptions:
                improvement_descriptions.append(desc)

        if len(improvement_descriptions) < 5:
            warning_improvements = [imp for imp in all_improvements if imp.get("type") == "warning"]
            for imp in warning_improvements[:10]:
                desc = imp.get("description", "")
                if desc and desc not in improvement_descriptions:
                    improvement_descriptions.append(desc)
                    if len(improvement_descriptions) >= 5:
                        break

        top_issues_combined = improvement_descriptions[:5] if improvement_descriptions else top_issues

        # ---------------------------------------------------------------
        # Build result
        # ---------------------------------------------------------------
        summary = {
            "total_pages_crawled": total_crawled,
            "total_pages_analyzed": total_analyzed,
            "overall_score": round(overall, 1),
            "category_scores": {
                "content_quality": round(content_quality, 1),
                "navigation": round(navigation, 1),
                "completeness": round(completeness, 1),
                "accessibility": round(accessibility, 1),
                "seo": round(seo, 1),
                "freshness": round(freshness, 1),
            },
            "critical_issues_count": critical_count,
            "warnings_count": warning_count,
            "suggestions_count": suggestion_count,
            "top_issues": top_issues_combined,
        }

        # Update the university document
        await self.db.universities.update_one(
            {"_id": self.university_id},
            {
                "$set": {
                    "summary": summary,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )

        # Extended metrics for API response
        metrics = {
            **summary,
            "confusion_rate": round(confusion_rate, 1),
            "information_depth": round(info_depth, 2),
            "dead_end_ratio": round(dead_end_ratio, 1),
            "international_readiness_score": round(intl_readiness, 1),
            "avg_page_load_time_ms": round(avg_load_time, 0) if avg_load_time else None,
            "broken_links_count": broken_links_count,
            "country_coverage": country_coverage,
            "category_completeness": category_completeness,
            "page_category_distribution": dict(category_counts),
            "issue_tag_distribution": dict(issue_counter.most_common(20)),
            "quality_tag_distribution": dict(quality_counter.most_common(20)),
            "content_tag_coverage": {
                "found": len(all_content_tags),
                "total": len(ALL_CONTENT_TAGS),
                "percentage": round(len(all_content_tags) / max(len(ALL_CONTENT_TAGS), 1) * 100, 1),
            },
        }

        return metrics

    # -------------------------------------------------------------------
    # Score calculations
    # -------------------------------------------------------------------

    def _content_quality_score(
        self,
        pages: list[dict],
        issue_counter: Counter,
        quality_counter: Counter,
    ) -> float:
        if not pages:
            return 0.0
        total_quality = sum(quality_counter.values())
        total_issues = sum(
            issue_counter[tag]
            for tag in ISSUE_TAGS_CONTENT
            if tag in issue_counter
        )
        total_ux_issues = sum(
            issue_counter[tag]
            for tag in ISSUE_TAGS_UX
            if tag in issue_counter
        )
        n = len(pages)
        quality_ratio = total_quality / max(n, 1)
        issue_ratio = (total_issues + total_ux_issues) / max(n, 1)
        score = 60 + quality_ratio * 15 - issue_ratio * 20
        return max(0.0, min(100.0, score))

    def _navigation_score(self, pages: list[dict]) -> float:
        if not pages:
            return 0.0
        depths = [p.get("depth", 0) for p in pages]
        nav_difficulties = [p.get("navigation_difficulty", 0.5) for p in pages]
        avg_depth = sum(depths) / len(depths)
        avg_nav_diff = sum(nav_difficulties) / len(nav_difficulties)
        deep_pages = sum(1 for d in depths if d > 3)
        deep_ratio = deep_pages / len(pages)
        # Lower depth, lower nav difficulty, fewer deep pages = better
        score = 100 - avg_depth * 8 - avg_nav_diff * 30 - deep_ratio * 20
        return max(0.0, min(100.0, score))

    def _completeness_score(self, found_tags: set[str], pages: list[dict]) -> float:
        essential_tags = set()
        for group_tags in EXPECTED_TAGS_BY_CATEGORY.values():
            essential_tags.update(group_tags)
        if not essential_tags:
            return 50.0
        covered = found_tags.intersection(essential_tags)
        ratio = len(covered) / len(essential_tags)
        return round(ratio * 100, 1)

    def _accessibility_score(self, pages: list[dict], issue_counter: Counter) -> float:
        if not pages:
            return 0.0
        total_a11y_issues = sum(
            issue_counter[tag]
            for tag in ISSUE_TAGS_ACCESSIBILITY
            if tag in issue_counter
        )
        issue_ratio = total_a11y_issues / max(len(pages), 1)
        score = 100 - issue_ratio * 30
        return max(0.0, min(100.0, score))

    def _seo_score(self, pages: list[dict]) -> float:
        if not pages:
            return 0.0
        has_meta = sum(1 for p in pages if p.get("metrics", {}).get("meta_description"))
        has_headings = sum(1 for p in pages if p.get("metrics", {}).get("heading_structure"))
        has_structured = sum(1 for p in pages if p.get("metrics", {}).get("has_structured_data"))
        n = len(pages)
        meta_ratio = has_meta / n
        heading_ratio = has_headings / n
        struct_ratio = has_structured / n
        score = meta_ratio * 40 + heading_ratio * 40 + struct_ratio * 20
        return round(score, 1)

    def _freshness_score(self, pages: list[dict], issue_counter: Counter) -> float:
        if not pages:
            return 0.0
        outdated_count = issue_counter.get("outdated_information", 0) + issue_counter.get("stale_dates", 0) + issue_counter.get("wrong_year", 0)
        has_last_modified = sum(
            1 for p in pages if p.get("metrics", {}).get("last_modified")
        )
        n = len(pages)
        outdated_penalty = min(outdated_count / max(n, 1) * 50, 40)
        modified_bonus = (has_last_modified / max(n, 1)) * 30
        score = 70 - outdated_penalty + modified_bonus
        return max(0.0, min(100.0, score))

    def _confusion_rate(self, pages: list[dict]) -> float:
        if not pages:
            return 0.0
        confusing_tags = {"vague_requirements", "contradictory_information", "confusing_terminology", "jargon_heavy", "ambiguous_instructions"}
        confused_pages = sum(
            1 for p in pages
            if confusing_tags.intersection(set(p.get("issue_tags", [])))
        )
        return (confused_pages / len(pages)) * 100

    def _information_depth(self, pages: list[dict]) -> float:
        if not pages:
            return 0.0
        # Average depth of pages with significant content tags
        key_pages = [
            p for p in pages
            if len(p.get("content_tags", [])) >= 2
        ]
        if not key_pages:
            return 0.0
        return sum(p.get("depth", 0) for p in key_pages) / len(key_pages)

    def _dead_end_ratio(self, pages: list[dict], issue_counter: Counter) -> float:
        if not pages:
            return 0.0
        dead_ends = sum(
            1 for p in pages
            if "dead_end_page" in p.get("issue_tags", [])
            or p.get("metrics", {}).get("word_count", 0) < 30
        )
        return (dead_ends / len(pages)) * 100

    def _international_readiness_score(self, found_tags: set[str], pages: list[dict]) -> float:
        intl_essential = {
            "visa_information",
            "i20_process",
            "international_admission",
            "credential_evaluation",
            "country_specific_requirements",
            "language_proficiency",
            "toefl_requirements",
            "ielts_requirements",
            "international_student_services",
            "international_scholarships",
        }
        covered = found_tags.intersection(intl_essential)
        tag_score = (len(covered) / len(intl_essential)) * 100

        # Check if there are dedicated international pages
        intl_pages = [
            p for p in pages
            if p.get("page_category") == "international"
        ]
        page_bonus = min(len(intl_pages) * 5, 20)

        return min(100.0, tag_score * 0.8 + page_bonus)

    def _avg_load_time(self, pages: list[dict]) -> float | None:
        times = [
            p.get("metrics", {}).get("load_time_ms")
            for p in pages
            if p.get("metrics", {}).get("load_time_ms") is not None
        ]
        if not times:
            return None
        return sum(times) / len(times)

    def _country_coverage(self, pages: list[dict]) -> dict[str, Any]:
        countries_mentioned: set[str] = set()
        for p in pages:
            for imp in p.get("ai_improvements", []):
                # country info might be in improvements or content
                pass
            if "country_specific_requirements" in p.get("content_tags", []):
                countries_mentioned.add("general")
            # Check raw text for common country mentions
            text = p.get("raw_text", "").lower() if "raw_text" in p else ""
            country_keywords = {
                "china": "China",
                "india": "India",
                "nigeria": "Nigeria",
                "korea": "South Korea",
                "japan": "Japan",
                "brazil": "Brazil",
                "vietnam": "Vietnam",
                "mexico": "Mexico",
                "turkey": "Turkey",
                "saudi": "Saudi Arabia",
                "pakistan": "Pakistan",
                "bangladesh": "Bangladesh",
                "uk": "United Kingdom",
                "canada": "Canada",
                "germany": "Germany",
                "france": "France",
            }
            for keyword, country_name in country_keywords.items():
                if keyword in text:
                    countries_mentioned.add(country_name)

        return {
            "countries_found": sorted(countries_mentioned),
            "count": len(countries_mentioned),
        }

    def _category_completeness(self, pages: list[dict], all_found_tags: set[str]) -> dict[str, Any]:
        result = {}
        for category, expected in EXPECTED_TAGS_BY_CATEGORY.items():
            found = [t for t in expected if t in all_found_tags]
            missing = [t for t in expected if t not in all_found_tags]
            result[category] = {
                "score": round(len(found) / max(len(expected), 1) * 100, 1),
                "found": found,
                "missing": missing,
            }
        return result
