import asyncio
import traceback

from bson import ObjectId

from app import db as database
from app.gemini_client import research_topic, generate_script
from app.tts_client import synthesize_line
from app.audio_stitcher import stitch_audio
from app.citations_client import resolve_citation


async def update_status(episode_id: ObjectId, status: str, extra: dict | None = None) -> None:
    update = {"$set": {"status": status}}
    if extra:
        update["$set"].update(extra)
    await database.db["episodes"].update_one({"_id": episode_id}, update)


async def generate_episode(episode_id: ObjectId) -> None:
    try:
        doc = await database.db["episodes"].find_one({"_id": episode_id})
        if not doc:
            return

        topic = doc["topic"]
        tone = doc.get("tone", "conversational")

        # Step 1: Research
        await update_status(episode_id, "researching")
        research = await research_topic(topic)
        await update_status(episode_id, "researching", {"research_notes": research})

        # Step 2: Script generation
        await update_status(episode_id, "scriptwriting")
        script = await generate_script(topic, research, tone)
        await update_status(episode_id, "scriptwriting", {"script": script})

        # Step 3: TTS for each line
        await update_status(episode_id, "generating_audio")
        segments = []
        for line in script:
            audio_bytes = await asyncio.to_thread(
                synthesize_line, line["speaker"], line["text"]
            )
            segments.append({"speaker": line["speaker"], "audio": audio_bytes})

        # Step 4: Stitch audio
        await update_status(episode_id, "stitching")
        filename = str(episode_id)
        cloud_url, duration, timestamps = await asyncio.to_thread(stitch_audio, segments, filename)
        audio_url = cloud_url

        # Step 5: Resolve citations
        citation_indices = []  # track which script line each task corresponds to
        for i, line in enumerate(script):
            if line.get("citation_query"):
                citation_indices.append(i)

        citations = []
        if citation_indices:
            # Resolve sequentially with a small delay to avoid 429 rate limits
            results = []
            for idx in citation_indices:
                result = await resolve_citation(script[idx]["citation_query"])
                results.append(result)
                await asyncio.sleep(0.5)  # throttle requests
            ts_map = {t["index"]: t["start_seconds"] for t in timestamps}
            for idx, result in zip(citation_indices, results):
                if result is None:
                    continue
                line = script[idx]
                citations.append({
                    "timestamp_seconds": ts_map.get(idx, 0.0),
                    "speaker": line["speaker"],
                    "text_snippet": line["text"][:120],
                    "query": line["citation_query"],
                    "title": result["title"],
                    "authors": result.get("authors", []),
                    "published_date": result.get("published_date"),
                    "thumbnail_url": result.get("thumbnail_url"),
                    "source_url": result.get("source_url"),
                    "source_name": result.get("source_name", "Google Books"),
                })

        # Step 6: Mark completed
        await update_status(episode_id, "completed", {
            "audio_filename": f"{filename}.mp3",
            "audio_url": audio_url,
            "duration_seconds": duration,
            "citations": citations if citations else None,
        })

    except Exception as exc:
        error_msg = f"{type(exc).__name__}: {exc}\n{traceback.format_exc()}"
        try:
            await update_status(episode_id, "failed", {"error": error_msg})
        except Exception:
            print(f"Failed to update episode {episode_id} status to failed: {exc}")
