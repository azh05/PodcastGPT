from contextlib import asynccontextmanager
from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import BackgroundTasks, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app import db as database
from app.db import close_db, connect_db
from app.episode_pipeline import generate_episode
from app.models import (
    EpisodeListItem,
    EpisodeResponse,
    GenerateRequest,
    doc_to_episode_list_item,
    doc_to_episode_response,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(title="PodcastGPT", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/episodes", response_model=EpisodeResponse, status_code=201)
async def create_episode(req: GenerateRequest, background_tasks: BackgroundTasks):
    doc = {
        "topic": req.topic,
        "tone": req.tone.value,
        "status": "pending",
        "created_at": datetime.now(timezone.utc),
        "cover_image_url": None,
        "research_notes": None,
        "script": None,
        "citations": None,
        "audio_filename": None,
        "audio_url": None,
        "duration_seconds": None,
        "error": None,
    }
    result = await database.db["episodes"].insert_one(doc)
    doc["_id"] = result.inserted_id

    background_tasks.add_task(generate_episode, doc["_id"])
    return doc_to_episode_response(doc)


@app.get("/episodes/{episode_id}", response_model=EpisodeResponse)
async def get_episode(episode_id: str):
    try:
        oid = ObjectId(episode_id)
    except (InvalidId, Exception):
        raise HTTPException(status_code=400, detail="Invalid episode ID format")

    doc = await database.db["episodes"].find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Episode not found")

    return doc_to_episode_response(doc)


@app.post("/episodes/{episode_id}/regenerate", response_model=EpisodeResponse)
async def regenerate_episode(episode_id: str, background_tasks: BackgroundTasks):
    try:
        oid = ObjectId(episode_id)
    except (InvalidId, Exception):
        raise HTTPException(status_code=400, detail="Invalid episode ID format")

    doc = await database.db["episodes"].find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Episode not found")

    # Reset the episode to pending and clear all generated data
    reset = {
        "status": "pending",
        "cover_image_url": None,
        "research_notes": None,
        "script": None,
        "citations": None,
        "audio_filename": None,
        "audio_url": None,
        "duration_seconds": None,
        "error": None,
    }
    await database.db["episodes"].update_one({"_id": oid}, {"$set": reset})
    doc.update(reset)

    background_tasks.add_task(generate_episode, oid)
    return doc_to_episode_response(doc)


@app.get("/episodes", response_model=list[EpisodeListItem])
async def list_episodes(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    search: str = Query(default=""),
):
    query = {}
    if search.strip():
        query["topic"] = {"$regex": search.strip(), "$options": "i"}
    cursor = (
        database.db["episodes"].find(query).sort("created_at", -1).skip(offset).limit(limit)
    )
    docs = await cursor.to_list(length=limit)
    return [doc_to_episode_list_item(doc) for doc in docs]
