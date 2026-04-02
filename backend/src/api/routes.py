"""
FastAPI routes for the UniAudit API.
"""

import logging
from typing import Any, Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, BackgroundTasks, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from src.analyzer.analyzer import PageAnalyzer
from src.analyzer.metrics import MetricsCalculator
from src.config import settings
from src.crawler.crawler import UniversityCrawler
from src.crawler.targeted_crawler import TargetedCrawler
from src.crawler import cloudflare_crawler as cf_crawler
from src.crawler.discoverer import discover_site_urls
from src.generator.guide_generator import generate_guide
from pydantic import BaseModel

from src.models.university import (
    UniversityCreate,
    serialize_page,
    serialize_university,
    university_doc,
)


class OutreachRequest(BaseModel):
    contact_name: str
    contact_title: str = "Head of Admissions"
    tone: str = "professional"  # professional | friendly | consultative


class CrawlConfigUpdate(BaseModel):
    crawl_mode: Optional[str] = None         # "auto" | "cloudflare" | "manual"
    manual_urls: Optional[list[str]] = None
    user_excluded_urls: Optional[list[str]] = None
    max_depth: Optional[int] = None
    max_pages: Optional[int] = None
    excluded_patterns: Optional[list[str]] = None
    focus_patterns: Optional[list[str]] = None


class ManualPagesRequest(BaseModel):
    urls: list[str]

logger = logging.getLogger("uni_audit.api")
router = APIRouter(prefix="/api")

# A reference to the DB will be set at startup from main.py
_db: Optional[AsyncIOMotorDatabase] = None


def set_db(db: AsyncIOMotorDatabase) -> None:
    global _db
    _db = db


def get_db() -> AsyncIOMotorDatabase:
    if _db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    return _db


def _validate_object_id(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail=f"Invalid ID: {id_str}")


# ------------------------------------------------------------------
# Background task runners
# ------------------------------------------------------------------


async def _run_crawl(university_id: str) -> None:
    """Background task: crawl a university — dispatches based on crawl_mode."""
    db = get_db()
    uni = await db.universities.find_one({"_id": ObjectId(university_id)})
    if not uni:
        logger.error("University %s not found for crawl", university_id)
        return

    config = uni.get("crawl_config", {})
    crawl_mode = config.get("crawl_mode", "auto")

    try:
        if crawl_mode == "manual":
            manual_urls = config.get("manual_urls", [])
            if not manual_urls:
                logger.error("Manual mode but no manual_urls set for %s", university_id)
                await db.universities.update_one(
                    {"_id": ObjectId(university_id)},
                    {"$set": {"status": "failed"}},
                )
                return
            crawler = TargetedCrawler(
                db=db,
                university_id=university_id,
                domains=uni["domains"],
                urls=manual_urls,
            )
            count = await crawler.crawl()
            logger.info("Manual crawl finished for %s: %d pages", university_id, count)

        elif crawl_mode == "cloudflare":
            if not cf_crawler.is_configured():
                logger.error("Cloudflare mode requested but CF credentials not set for %s", university_id)
                await db.universities.update_one(
                    {"_id": ObjectId(university_id)},
                    {"$set": {"status": "failed"}},
                )
                return
            domain = uni["domains"][0]
            count = await cf_crawler.crawl_site(
                db=db,
                university_id=university_id,
                domains=uni["domains"],
                start_url=f"https://{domain}",
                max_pages=config.get("max_pages", settings.CRAWLER_MAX_PAGES),
            )
            logger.info("Cloudflare crawl finished for %s: %d pages", university_id, count)

        else:  # "auto" — original Playwright BFS
            crawler = UniversityCrawler(
                db=db,
                university_id=university_id,
                domains=uni["domains"],
                max_depth=config.get("max_depth", settings.CRAWLER_MAX_DEPTH),
                max_pages=config.get("max_pages", settings.CRAWLER_MAX_PAGES),
                excluded_patterns=config.get("excluded_patterns", []),
                focus_patterns=config.get("focus_patterns", []),
                request_delay=settings.CRAWLER_REQUEST_DELAY,
            )
            count = await crawler.crawl()
            logger.info("Auto crawl finished for %s: %d pages", university_id, count)

    except Exception as exc:
        logger.exception("Crawl failed for %s: %s", university_id, exc)
        await db.universities.update_one(
            {"_id": ObjectId(university_id)},
            {"$set": {"status": "failed"}},
        )


async def _run_analysis(university_id: str) -> None:
    """Background task: analyze all crawled pages."""
    db = get_db()
    analyzer = PageAnalyzer(db=db, university_id=university_id)
    try:
        count = await analyzer.analyze_all()
        logger.info("Analysis finished for %s: %d pages", university_id, count)

        # Auto-calculate metrics
        calc = MetricsCalculator(db=db, university_id=university_id)
        await calc.calculate()
        logger.info("Metrics calculated for %s", university_id)
    except Exception as exc:
        logger.exception("Analysis failed for %s: %s", university_id, exc)
        await db.universities.update_one(
            {"_id": ObjectId(university_id)},
            {"$set": {"status": "failed"}},
        )


# ------------------------------------------------------------------
# University CRUD
# ------------------------------------------------------------------


@router.post("/universities", status_code=201)
async def create_university(data: UniversityCreate) -> dict[str, Any]:
    db = get_db()
    doc = university_doc(data)
    result = await db.universities.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_university(doc)


@router.get("/universities")
async def list_universities() -> list[dict[str, Any]]:
    db = get_db()
    universities = []
    async for doc in db.universities.find().sort("created_at", -1):
        universities.append(serialize_university(doc))
    return universities


@router.get("/universities/{university_id}")
async def get_university(university_id: str) -> dict[str, Any]:
    db = get_db()
    oid = _validate_object_id(university_id)
    doc = await db.universities.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="University not found")
    return serialize_university(doc)


@router.delete("/universities/{university_id}")
async def delete_university(university_id: str) -> dict[str, str]:
    db = get_db()
    oid = _validate_object_id(university_id)
    result = await db.universities.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="University not found")
    # Delete all associated pages
    await db.pages.delete_many({"university_id": oid})
    return {"status": "deleted"}


# ------------------------------------------------------------------
# Crawl / Analyze
# ------------------------------------------------------------------


@router.post("/universities/{university_id}/crawl")
async def start_crawl(university_id: str, background_tasks: BackgroundTasks) -> dict[str, str]:
    db = get_db()
    oid = _validate_object_id(university_id)
    uni = await db.universities.find_one({"_id": oid})
    if not uni:
        raise HTTPException(status_code=404, detail="University not found")
    if uni.get("status") == "crawling":
        raise HTTPException(status_code=409, detail="Crawl already in progress")

    # Clear previous pages
    await db.pages.delete_many({"university_id": oid})
    await db.universities.update_one({"_id": oid}, {"$set": {"status": "crawling"}})

    background_tasks.add_task(_run_crawl, university_id)
    return {"status": "crawl_started", "university_id": university_id}


@router.post("/universities/{university_id}/analyze")
async def start_analysis(university_id: str, background_tasks: BackgroundTasks) -> dict[str, str]:
    db = get_db()
    oid = _validate_object_id(university_id)
    uni = await db.universities.find_one({"_id": oid})
    if not uni:
        raise HTTPException(status_code=404, detail="University not found")
    if uni.get("status") == "analyzing":
        raise HTTPException(status_code=409, detail="Analysis already in progress")

    page_count = await db.pages.count_documents({"university_id": oid})
    if page_count == 0:
        raise HTTPException(status_code=400, detail="No crawled pages. Run crawl first.")

    await db.universities.update_one({"_id": oid}, {"$set": {"status": "analyzing"}})
    background_tasks.add_task(_run_analysis, university_id)
    return {"status": "analysis_started", "university_id": university_id}


@router.get("/universities/{university_id}/status")
async def get_status(university_id: str) -> dict[str, Any]:
    db = get_db()
    oid = _validate_object_id(university_id)
    uni = await db.universities.find_one({"_id": oid}, {"status": 1, "summary": 1})
    if not uni:
        raise HTTPException(status_code=404, detail="University not found")

    total_pages = await db.pages.count_documents({"university_id": oid})
    analyzed_pages = await db.pages.count_documents({"university_id": oid, "status": "analyzed"})
    error_pages = await db.pages.count_documents({"university_id": oid, "status": "error"})

    return {
        "status": uni.get("status", "pending"),
        "total_pages": total_pages,
        "analyzed_pages": analyzed_pages,
        "error_pages": error_pages,
        "summary": uni.get("summary", {}),
    }


# ------------------------------------------------------------------
# Pages
# ------------------------------------------------------------------


@router.get("/universities/{university_id}/pages")
async def get_pages(
    university_id: str,
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    issue_tags: Optional[str] = Query(None, description="Comma-separated issue tags"),
    content_tags: Optional[str] = Query(None, description="Comma-separated content tags"),
    quality_tags: Optional[str] = Query(None, description="Comma-separated quality tags"),
    min_depth: Optional[int] = Query(None),
    max_depth: Optional[int] = Query(None),
    sort_by: str = Query("depth"),
    order: str = Query("asc"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
) -> dict[str, Any]:
    db = get_db()
    oid = _validate_object_id(university_id)

    query: dict[str, Any] = {"university_id": oid}
    if category:
        query["page_category"] = category
    if status:
        query["status"] = status
    if issue_tags:
        tags = [t.strip() for t in issue_tags.split(",")]
        query["issue_tags"] = {"$in": tags}
    if content_tags:
        tags = [t.strip() for t in content_tags.split(",")]
        query["content_tags"] = {"$in": tags}
    if quality_tags:
        tags = [t.strip() for t in quality_tags.split(",")]
        query["quality_tags"] = {"$in": tags}
    if min_depth is not None:
        query.setdefault("depth", {})["$gte"] = min_depth
    if max_depth is not None:
        query.setdefault("depth", {})["$lte"] = max_depth

    sort_dir = 1 if order == "asc" else -1
    # Don't return raw_text in list view
    projection = {"raw_text": 0}

    total = await db.pages.count_documents(query)
    cursor = db.pages.find(query, projection).sort(sort_by, sort_dir).skip(skip).limit(limit)
    pages = []
    async for doc in cursor:
        pages.append(serialize_page(doc))

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "pages": pages,
    }


@router.get("/universities/{university_id}/pages/{page_id}")
async def get_page(university_id: str, page_id: str) -> dict[str, Any]:
    db = get_db()
    _validate_object_id(university_id)
    pid = _validate_object_id(page_id)
    doc = await db.pages.find_one({"_id": pid}, {"raw_text": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Page not found")
    return serialize_page(doc)


# ------------------------------------------------------------------
# Tree / Graph / Metrics
# ------------------------------------------------------------------


@router.get("/universities/{university_id}/tree")
async def get_page_tree(university_id: str) -> list[dict[str, Any]]:
    """Return a tree structure of pages for visualization."""
    db = get_db()
    oid = _validate_object_id(university_id)

    pages = []
    async for doc in db.pages.find(
        {"university_id": oid},
        {
            "url": 1,
            "ai_title": 1,
            "title": 1,
            "depth": 1,
            "parent_url": 1,
            "page_category": 1,
            "issue_tags": 1,
            "quality_tags": 1,
            "navigation_difficulty": 1,
            "status": 1,
        },
    ).sort("depth", 1):
        pages.append(doc)

    url_to_node: dict[str, dict] = {}
    roots: list[dict] = []

    for doc in pages:
        url = doc["url"]
        node = {
            "id": str(doc["_id"]),
            "url": url,
            "label": doc.get("ai_title") or doc.get("title", url)[:40],
            "depth": doc.get("depth", 0),
            "category": doc.get("page_category", "other"),
            "issue_count": len(doc.get("issue_tags", [])),
            "quality_count": len(doc.get("quality_tags", [])),
            "navigation_difficulty": doc.get("navigation_difficulty", 0),
            "status": doc.get("status", "crawled"),
            "children": [],
        }
        url_to_node[url] = node

    for doc in pages:
        url = doc["url"]
        parent_url = doc.get("parent_url")
        node = url_to_node[url]
        if parent_url and parent_url in url_to_node:
            url_to_node[parent_url]["children"].append(node)
        else:
            roots.append(node)

    return roots


@router.get("/universities/{university_id}/graph")
async def get_page_graph(university_id: str) -> dict[str, Any]:
    """Return nodes and edges for graph visualization."""
    db = get_db()
    oid = _validate_object_id(university_id)

    nodes = []
    edges = []
    url_to_id: dict[str, str] = {}

    async for doc in db.pages.find(
        {"university_id": oid},
        {
            "url": 1,
            "ai_title": 1,
            "title": 1,
            "depth": 1,
            "page_category": 1,
            "navigation_difficulty": 1,
            "issue_tags": 1,
            "outgoing_links": 1,
            "incoming_links_count": 1,
        },
    ):
        node_id = str(doc["_id"])
        url = doc["url"]
        url_to_id[url] = node_id
        nodes.append({
            "id": node_id,
            "url": url,
            "label": doc.get("ai_title") or doc.get("title", url)[:40],
            "depth": doc.get("depth", 0),
            "category": doc.get("page_category", "other"),
            "navigation_difficulty": doc.get("navigation_difficulty", 0),
            "issue_count": len(doc.get("issue_tags", [])),
            "incoming_links_count": doc.get("incoming_links_count", 0),
        })

    # Build edges from outgoing_links
    async for doc in db.pages.find(
        {"university_id": oid},
        {"url": 1, "outgoing_links": 1},
    ):
        source_url = doc["url"]
        source_id = url_to_id.get(source_url)
        if not source_id:
            continue
        for link in doc.get("outgoing_links", []):
            if link.get("is_internal"):
                target_url = link["url"]
                target_id = url_to_id.get(target_url)
                if target_id and target_id != source_id:
                    edges.append({
                        "source": source_id,
                        "target": target_id,
                        "location": link.get("location", "main_content"),
                        "text": link.get("text", "")[:80],
                    })

    return {"nodes": nodes, "edges": edges}


@router.get("/universities/{university_id}/metrics")
async def get_metrics(university_id: str) -> dict[str, Any]:
    db = get_db()
    oid = _validate_object_id(university_id)
    uni = await db.universities.find_one({"_id": oid})
    if not uni:
        raise HTTPException(status_code=404, detail="University not found")

    calc = MetricsCalculator(db=db, university_id=university_id)
    metrics = await calc.calculate()
    return metrics


# ------------------------------------------------------------------
# Admission Guide
# ------------------------------------------------------------------


async def _call_openai_text(prompt: str, system: str) -> str:
    """Simple Azure OpenAI call returning plain text content."""
    import httpx
    from src.config import settings
    url = f"{settings.AZURE_OPENAI_ENDPOINT.rstrip('/')}/openai/v1/chat/completions"
    headers = {"Content-Type": "application/json", "api-key": settings.AZURE_OPENAI_API_KEY}
    body = {
        "model": settings.AZURE_OPENAI_MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
        "max_completion_tokens": 1500,
    }
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(url, headers=headers, json=body)
        resp.raise_for_status()
        data = resp.json()
    return data["choices"][0]["message"]["content"]


@router.post("/universities/{university_id}/generate-guide")
async def generate_guide_endpoint(university_id: str) -> dict[str, Any]:
    db = get_db()
    oid = _validate_object_id(university_id)
    uni = await db.universities.find_one({"_id": oid})
    if not uni:
        raise HTTPException(status_code=404, detail="University not found")

    analyzed_count = await db.pages.count_documents({"university_id": oid, "status": "analyzed"})
    if analyzed_count == 0:
        raise HTTPException(
            status_code=400,
            detail="No analyzed pages found. Run crawl and analysis first.",
        )

    try:
        result = await generate_guide(university_id=university_id, db=db)
    except Exception as exc:
        logger.exception("Guide generation failed for %s: %s", university_id, exc)
        raise HTTPException(status_code=500, detail=f"Guide generation failed: {exc}")

    return {
        "university_id": university_id,
        "sections_found": result["sections_found"],
        "sections_missing": result["sections_missing"],
        "completeness_score": result["completeness_score"],
        "word_count": result["word_count"],
        "html": result["html"],
    }


@router.get("/universities/{university_id}/guide")
async def get_guide(university_id: str) -> dict[str, Any]:
    db = get_db()
    _validate_object_id(university_id)

    guide = await db.guides.find_one({"university_id": university_id})
    if not guide:
        raise HTTPException(status_code=404, detail="Guide not found. Generate it first.")

    guide.pop("_id", None)
    # Convert datetime fields for JSON serialization
    if "generated_at" in guide and hasattr(guide["generated_at"], "isoformat"):
        guide["generated_at"] = guide["generated_at"].isoformat()

    return guide


# ------------------------------------------------------------------
# Outreach Email Generation
# ------------------------------------------------------------------


@router.post("/universities/{university_id}/generate-outreach")
async def generate_outreach(university_id: str, req: OutreachRequest) -> dict[str, Any]:
    db = get_db()
    oid = _validate_object_id(university_id)
    uni = await db.universities.find_one({"_id": oid})
    if not uni:
        raise HTTPException(status_code=404, detail="University not found")

    summary = uni.get("summary")
    if not summary:
        raise HTTPException(
            status_code=400,
            detail="No audit data available. Run crawl and analysis first.",
        )

    uni_name = uni["name"]
    overall_score = summary.get("overall_score", 0)
    critical_issues = summary.get("critical_issues", 0)
    warnings = summary.get("warnings", 0)
    total_pages = summary.get("total_pages", 0)
    top_issues = summary.get("top_issues", [])[:3]

    issues_text = "\n".join(
        f"- {issue.get('description', '')} (affects {issue.get('affected_pages', 0)} pages)"
        for issue in top_issues
    ) or "- No specific issues listed"

    system_prompt = (
        "You are an expert digital marketing consultant specialising in higher education. "
        "Write concise, compelling cold outreach emails to university admissions staff. "
        "Be specific with data, empathetic, and focus on student impact. "
        "Never sound like a template — personalise every sentence."
    )

    user_prompt = f"""Write a cold outreach email to {req.contact_name}, {req.contact_title} at {uni_name}.

AUDIT DATA:
- Overall website score: {overall_score}/100
- Critical issues found: {critical_issues}
- Warnings: {warnings}
- Pages analysed: {total_pages}

TOP ISSUES IDENTIFIED:
{issues_text}

TONE: {req.tone}

Write the email in this exact format:
SUBJECT: [subject line]

[email body — 3-4 short paragraphs, max 200 words total]

Rules:
- Reference specific numbers from the audit
- Mention 1-2 concrete issues (not all of them)
- End with a clear, low-friction CTA (15-min call)
- No buzzwords like "synergy", "leverage", "cutting-edge"
- Do NOT include placeholders like [Your Name]"""

    try:
        content = await _call_openai_text(user_prompt, system_prompt)
    except Exception as exc:
        logger.exception("Outreach generation failed for %s: %s", university_id, exc)
        raise HTTPException(status_code=500, detail=f"AI generation failed: {exc}")

    # Parse subject + body
    lines = content.strip().split("\n")
    subject = ""
    body_lines = []
    for i, line in enumerate(lines):
        if line.startswith("SUBJECT:"):
            subject = line.replace("SUBJECT:", "").strip()
        else:
            body_lines.append(line)
    email_body = "\n".join(body_lines).strip()

    return {
        "university_id": university_id,
        "university_name": uni_name,
        "contact_name": req.contact_name,
        "contact_title": req.contact_title,
        "subject": subject,
        "body": email_body,
        "tone": req.tone,
        "audit_score": overall_score,
    }


# ------------------------------------------------------------------
# Site Discovery & Crawl Config
# ------------------------------------------------------------------


@router.post("/universities/{university_id}/discover")
async def discover_urls(university_id: str) -> dict[str, Any]:
    """
    Fast pre-crawl URL discovery via sitemap.xml + homepage links.
    Stores discovered URLs in the university document.
    Returns the discovered URL list so the user can prune before crawling.
    """
    db = get_db()
    oid = _validate_object_id(university_id)
    uni = await db.universities.find_one({"_id": oid})
    if not uni:
        raise HTTPException(status_code=404, detail="University not found")

    # Update status
    await db.universities.update_one(
        {"_id": oid},
        {"$set": {"status": "discovering", "updated_at": __import__("datetime").datetime.now(__import__("datetime").timezone.utc)}},
    )

    try:
        urls = await discover_site_urls(domains=uni["domains"], max_urls=500)
    except Exception as exc:
        logger.exception("Discovery failed for %s: %s", university_id, exc)
        await db.universities.update_one(
            {"_id": oid},
            {"$set": {"status": "pending"}},
        )
        raise HTTPException(status_code=500, detail=f"Discovery failed: {exc}")

    # Store in university document
    await db.universities.update_one(
        {"_id": oid},
        {
            "$set": {
                "discovered_urls": urls,
                "status": "pending",
                "updated_at": __import__("datetime").datetime.now(__import__("datetime").timezone.utc),
            }
        },
    )

    return {
        "university_id": university_id,
        "total_discovered": len(urls),
        "urls": urls,
    }


@router.put("/universities/{university_id}/crawl-config")
async def update_crawl_config(university_id: str, update: CrawlConfigUpdate) -> dict[str, Any]:
    """
    Update crawl configuration — crawl mode, manual URLs, excluded URLs, etc.
    Call this after /discover to set which pages to include/exclude before crawling.
    """
    db = get_db()
    oid = _validate_object_id(university_id)
    uni = await db.universities.find_one({"_id": oid})
    if not uni:
        raise HTTPException(status_code=404, detail="University not found")

    
    patch: dict[str, Any] = {}

    if update.crawl_mode is not None:
        if update.crawl_mode not in ("auto", "cloudflare", "manual"):
            raise HTTPException(status_code=400, detail="crawl_mode must be auto | cloudflare | manual")
        patch["crawl_config.crawl_mode"] = update.crawl_mode

    if update.manual_urls is not None:
        patch["crawl_config.manual_urls"] = update.manual_urls

    if update.user_excluded_urls is not None:
        patch["crawl_config.user_excluded_urls"] = update.user_excluded_urls

    if update.max_depth is not None:
        patch["crawl_config.max_depth"] = update.max_depth

    if update.max_pages is not None:
        patch["crawl_config.max_pages"] = update.max_pages

    if update.excluded_patterns is not None:
        patch["crawl_config.excluded_patterns"] = update.excluded_patterns

    if update.focus_patterns is not None:
        patch["crawl_config.focus_patterns"] = update.focus_patterns

    if patch:
        patch["updated_at"] = __import__("datetime").datetime.now(__import__("datetime").timezone.utc)
        await db.universities.update_one({"_id": oid}, {"$set": patch})

    # Return updated university
    updated = await db.universities.find_one({"_id": oid})
    return serialize_university(updated)


@router.post("/universities/{university_id}/pages/manual")
async def add_manual_pages(university_id: str, req: ManualPagesRequest) -> dict[str, Any]:
    """
    Immediately fetch and store specific pages provided by the user.
    Uses the targeted crawler (httpx, no browser).
    This is for ad-hoc page addition — not a full crawl.
    """
    db = get_db()
    oid = _validate_object_id(university_id)
    uni = await db.universities.find_one({"_id": oid})
    if not uni:
        raise HTTPException(status_code=404, detail="University not found")

    if not req.urls:
        raise HTTPException(status_code=400, detail="No URLs provided")

    crawler = TargetedCrawler(
        db=db,
        university_id=university_id,
        domains=uni["domains"],
        urls=req.urls,
    )

    try:
        count = await crawler.crawl()
    except Exception as exc:
        logger.exception("Manual page add failed for %s: %s", university_id, exc)
        raise HTTPException(status_code=500, detail=f"Failed to fetch pages: {exc}")

    return {"added": count, "requested": len(req.urls)}


@router.get("/universities/{university_id}/crawl-status")
async def get_crawl_status(university_id: str) -> dict[str, Any]:
    """Detailed crawl progress for polling."""
    db = get_db()
    oid = _validate_object_id(university_id)
    uni = await db.universities.find_one(
        {"_id": oid},
        {"status": 1, "summary": 1, "crawl_config": 1},
    )
    if not uni:
        raise HTTPException(status_code=404, detail="University not found")

    total_pages = await db.pages.count_documents({"university_id": oid})
    analyzed_pages = await db.pages.count_documents({"university_id": oid, "status": "analyzed"})

    config = uni.get("crawl_config", {})
    manual_count = len(config.get("manual_urls", []))

    return {
        "status": uni.get("status", "pending"),
        "crawl_mode": config.get("crawl_mode", "auto"),
        "total_pages_crawled": total_pages,
        "total_pages_analyzed": analyzed_pages,
        "manual_urls_count": manual_count,
        "cf_available": cf_crawler.is_configured(),
        "summary": uni.get("summary", {}),
    }
