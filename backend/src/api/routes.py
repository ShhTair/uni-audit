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
from src.models.university import (
    CrawlConfig,
    UniversityCreate,
    UniversityResponse,
    UniversitySummary,
    serialize_page,
    serialize_university,
    university_doc,
)

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
    """Background task: crawl a university."""
    db = get_db()
    uni = await db.universities.find_one({"_id": ObjectId(university_id)})
    if not uni:
        logger.error("University %s not found for crawl", university_id)
        return
    config = uni.get("crawl_config", {})
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
    try:
        count = await crawler.crawl()
        logger.info("Crawl finished for %s: %d pages", university_id, count)
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
