"""
Pydantic models for University and Page documents.
"""

from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from pydantic import BaseModel, Field


class PyObjectId(str):
    """Custom type for MongoDB ObjectId serialization."""

    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v: object) -> str:
        if isinstance(v, ObjectId):
            return str(v)
        if isinstance(v, str) and ObjectId.is_valid(v):
            return v
        raise ValueError("Invalid ObjectId")


# ---------------------------------------------------------------------------
# Nested models
# ---------------------------------------------------------------------------


class CrawlConfig(BaseModel):
    max_depth: int = 5
    max_pages: int = 300
    excluded_patterns: list[str] = []
    focus_patterns: list[str] = []
    # Crawl mode: "auto" (Playwright BFS), "cloudflare" (CF API), "manual" (specific URLs only)
    crawl_mode: str = "auto"
    # For manual mode: list of URLs to crawl
    manual_urls: list[str] = []
    # URLs explicitly excluded by user (discovered but deselected)
    user_excluded_urls: list[str] = []


class CategoryScores(BaseModel):
    content_quality: float = 0.0
    navigation: float = 0.0
    completeness: float = 0.0
    accessibility: float = 0.0
    seo: float = 0.0
    freshness: float = 0.0


class UniversitySummary(BaseModel):
    total_pages_crawled: int = 0
    total_pages_analyzed: int = 0
    overall_score: float = 0.0
    category_scores: CategoryScores = CategoryScores()
    critical_issues_count: int = 0
    warnings_count: int = 0
    suggestions_count: int = 0
    top_issues: list[str] = []


class HeadingItem(BaseModel):
    level: int
    text: str


class PageMetrics(BaseModel):
    word_count: int = 0
    image_count: int = 0
    link_count: int = 0
    external_link_count: int = 0
    broken_links: list[str] = []
    load_time_ms: Optional[int] = None
    has_dynamic_content: bool = False
    dynamic_elements: list[str] = []
    readability_score: float = 0.0
    mobile_friendly: Optional[bool] = None
    last_modified: Optional[str] = None
    language: str = "en"
    has_structured_data: bool = False
    meta_description: Optional[str] = None
    heading_structure: list[HeadingItem] = []


class OutgoingLink(BaseModel):
    url: str
    text: str
    location: str = "main_content"
    is_internal: bool = True


class AIImprovement(BaseModel):
    type: str  # "critical" | "warning" | "suggestion"
    category: str
    description: str
    impact: str


# ---------------------------------------------------------------------------
# Top-level document models
# ---------------------------------------------------------------------------


class UniversityCreate(BaseModel):
    name: str
    domains: list[str]
    country: str = ""
    logo_url: Optional[str] = None
    crawl_config: CrawlConfig = CrawlConfig()


class UniversityUpdate(BaseModel):
    name: Optional[str] = None
    domains: Optional[list[str]] = None
    country: Optional[str] = None
    logo_url: Optional[str] = None
    crawl_config: Optional[CrawlConfig] = None


class DiscoveredUrl(BaseModel):
    """A URL found during site discovery (pre-crawl)."""
    url: str
    title: str = ""
    path: str = ""
    domain: str = ""
    source: str = "sitemap"  # "sitemap" | "homepage" | "manual"
    depth_estimate: int = 0


class UniversityInDB(BaseModel):
    id: str = Field(alias="_id")
    name: str
    slug: str
    domains: list[str]
    country: str = ""
    logo_url: Optional[str] = None
    status: str = "pending"
    created_at: datetime
    updated_at: datetime
    crawl_config: CrawlConfig = CrawlConfig()
    summary: UniversitySummary = UniversitySummary()
    discovered_urls: list[DiscoveredUrl] = []

    model_config = {"populate_by_name": True}


class UniversityResponse(BaseModel):
    id: str
    name: str
    slug: str
    domains: list[str]
    country: str
    logo_url: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime
    crawl_config: CrawlConfig
    summary: UniversitySummary
    discovered_urls: list[DiscoveredUrl] = []


class PageInDB(BaseModel):
    id: str = Field(alias="_id")
    university_id: str
    url: str
    domain: str
    path: str
    title: str = ""
    ai_title: str = ""
    status: str = "crawled"

    depth: int = 0
    parent_url: Optional[str] = None
    discovery_path: list[str] = []
    link_location: str = "main_content"
    navigation_difficulty: float = 0.0

    page_category: str = "other"
    page_subcategory: Optional[str] = None

    content_tags: list[str] = []
    issue_tags: list[str] = []
    quality_tags: list[str] = []

    ai_summary: str = ""
    ai_improvements: list[AIImprovement] = []

    metrics: PageMetrics = PageMetrics()
    outgoing_links: list[OutgoingLink] = []
    incoming_links_count: int = 0

    crawled_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    analyzed_at: Optional[datetime] = None

    model_config = {"populate_by_name": True}


class PageResponse(BaseModel):
    id: str
    university_id: str
    url: str
    domain: str
    path: str
    title: str
    ai_title: str
    status: str
    depth: int
    parent_url: Optional[str]
    discovery_path: list[str]
    link_location: str
    navigation_difficulty: float
    page_category: str
    page_subcategory: Optional[str]
    content_tags: list[str]
    issue_tags: list[str]
    quality_tags: list[str]
    ai_summary: str
    ai_improvements: list[AIImprovement]
    metrics: PageMetrics
    outgoing_links: list[OutgoingLink]
    incoming_links_count: int
    crawled_at: datetime
    analyzed_at: Optional[datetime]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def slug_from_name(name: str) -> str:
    """Generate a URL-friendly slug from a university name."""
    import re

    slug = name.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    return slug.strip("-")


def university_doc(data: UniversityCreate) -> dict:
    """Build a MongoDB document from a creation request."""
    now = datetime.now(timezone.utc)
    return {
        "name": data.name,
        "slug": slug_from_name(data.name),
        "domains": data.domains,
        "country": data.country,
        "logo_url": data.logo_url,
        "status": "pending",
        "created_at": now,
        "updated_at": now,
        "crawl_config": data.crawl_config.model_dump(),
        "summary": UniversitySummary().model_dump(),
    }


def serialize_university(doc: dict) -> dict:
    """Convert a MongoDB university document to a serializable dict."""
    doc["id"] = str(doc.pop("_id"))
    if "crawl_config" not in doc:
        doc["crawl_config"] = CrawlConfig().model_dump()
    if "summary" not in doc:
        doc["summary"] = UniversitySummary().model_dump()
    if "discovered_urls" not in doc:
        doc["discovered_urls"] = []
    return doc


def serialize_page(doc: dict) -> dict:
    """Convert a MongoDB page document to a serializable dict."""
    doc["id"] = str(doc.pop("_id"))
    doc["university_id"] = str(doc["university_id"])
    if "metrics" not in doc:
        doc["metrics"] = PageMetrics().model_dump()
    if "ai_improvements" not in doc:
        doc["ai_improvements"] = []
    if "outgoing_links" not in doc:
        doc["outgoing_links"] = []
    return doc
