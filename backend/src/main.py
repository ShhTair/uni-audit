"""
UniAudit Backend - FastAPI application entry point.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

from src.api.routes import router, set_db
from src.config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("uni_audit")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage MongoDB connection lifecycle."""
    logger.info("Connecting to MongoDB...")
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DATABASE_NAME]

    # Verify connection
    try:
        await client.admin.command("ping")
        logger.info("MongoDB connected successfully (database: %s)", settings.DATABASE_NAME)
    except Exception as exc:
        logger.error("MongoDB connection failed: %s", exc)
        raise

    # Create indexes
    await db.universities.create_index("slug", unique=True)
    await db.pages.create_index([("university_id", 1), ("url", 1)], unique=True)
    await db.pages.create_index([("university_id", 1), ("page_category", 1)])
    await db.pages.create_index([("university_id", 1), ("depth", 1)])
    await db.pages.create_index([("university_id", 1), ("status", 1)])
    await db.pages.create_index([("university_id", 1), ("issue_tags", 1)])
    await db.pages.create_index([("university_id", 1), ("content_tags", 1)])
    logger.info("MongoDB indexes ensured")

    # Share DB reference with routes
    set_db(db)
    app.state.db = db
    app.state.mongo_client = client

    yield

    # Shutdown
    logger.info("Closing MongoDB connection...")
    client.close()


app = FastAPI(
    title="UniAudit API",
    description="University admission website crawler and AI analyzer",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "uni-audit-backend"}
