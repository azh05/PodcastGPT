import io
import os

from pydub import AudioSegment

from app.config import settings

SILENCE_SAME_SPEAKER_MS = 400
SILENCE_SPEAKER_CHANGE_MS = 600


def stitch_audio(segments: list[dict], output_filename: str) -> tuple[str, float, list[dict]]:
    """Stitch TTS audio segments into a single MP3.

    Args:
        segments: list of {"speaker": str, "audio": bytes}
        output_filename: filename (without extension) for the output

    Returns:
        (file_path, duration_seconds, timestamps)
        where timestamps is a list of {"index": int, "start_seconds": float}
    """
    combined = AudioSegment.empty()
    prev_speaker = None
    timestamps: list[dict] = []

    for i, seg in enumerate(segments):
        chunk = AudioSegment.from_mp3(io.BytesIO(seg["audio"]))

        if prev_speaker is not None:
            if seg["speaker"] == prev_speaker:
                combined += AudioSegment.silent(duration=SILENCE_SAME_SPEAKER_MS)
            else:
                combined += AudioSegment.silent(duration=SILENCE_SPEAKER_CHANGE_MS)

        timestamps.append({"index": i, "start_seconds": len(combined) / 1000.0})
        combined += chunk
        prev_speaker = seg["speaker"]

    os.makedirs(settings.audio_dir, exist_ok=True)
    file_path = os.path.join(settings.audio_dir, f"{output_filename}.mp3")
    combined.export(file_path, format="mp3", bitrate="128k")

    duration_seconds = len(combined) / 1000.0
    return file_path, duration_seconds, timestamps
