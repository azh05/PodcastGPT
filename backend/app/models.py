from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, Field


class EpisodeStatus(str, Enum):
    pending = "pending"
    researching = "researching"
    scriptwriting = "scriptwriting"
    generating_audio = "generating_audio"
    stitching = "stitching"
    completed = "completed"
    failed = "failed"


class ToneStyle(str, Enum):
    conversational = "conversational"
    professional = "professional"
    humorous = "humorous"
    dramatic = "dramatic"
    educational = "educational"
    casual = "casual"


class GenerateRequest(BaseModel):
    topic: str = Field(..., min_length=3, max_length=200)
    tone: ToneStyle = Field(default=ToneStyle.conversational, description="The tone and style of the podcast")


class DialogueLine(BaseModel):
    speaker: str
    text: str
    citation_query: str | None = None


class Citation(BaseModel):
    """A resolved citation tied to a specific moment in the podcast audio."""
    timestamp_seconds: float
    speaker: str
    text_snippet: str
    query: str
    title: str
    authors: list[str] = []
    published_date: str | None = None
    thumbnail_url: str | None = None
    source_url: str | None = None
    source_name: str = "Open Library"


class EpisodeResponse(BaseModel):
    id: str
    topic: str
    tone: str
    status: EpisodeStatus
    created_at: datetime
    research_notes: str | None = None
    script: list[DialogueLine] | None = None
    citations: list[Citation] | None = None
    audio_url: str | None = None
    duration_seconds: float | None = None
    error: str | None = None


class EpisodeListItem(BaseModel):
    id: str
    topic: str
    tone: str
    status: EpisodeStatus
    created_at: datetime
    audio_url: str | None = None
    duration_seconds: float | None = None


def doc_to_episode_response(doc: dict) -> EpisodeResponse:
    return EpisodeResponse(
        id=str(doc["_id"]),
        topic=doc["topic"],
        tone=doc.get("tone", "conversational"),
        status=doc["status"],
        created_at=doc["created_at"],
        research_notes=doc.get("research_notes"),
        script=[DialogueLine(**line) for line in doc["script"]] if doc.get("script") else None,
        citations=[Citation(**c) for c in doc["citations"]] if doc.get("citations") else None,
        audio_url=doc.get("audio_url"),
        duration_seconds=doc.get("duration_seconds"),
        error=doc.get("error"),
    )


def doc_to_episode_list_item(doc: dict) -> EpisodeListItem:
    return EpisodeListItem(
        id=str(doc["_id"]),
        topic=doc["topic"],
        tone=doc.get("tone", "conversational"),
        status=doc["status"],
        created_at=doc["created_at"],
        audio_url=doc.get("audio_url"),
        duration_seconds=doc.get("duration_seconds"),
    )
