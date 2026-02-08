import io

from pydub import AudioSegment

from app.storage import upload_audio

SILENCE_SAME_SPEAKER_MS = 400
SILENCE_SPEAKER_CHANGE_MS = 600


def stitch_audio(segments: list[dict], output_filename: str) -> tuple[str, float, list[dict]]:
    """Stitch TTS audio segments into a single MP3.

    Args:
        segments: list of {"speaker": str, "audio": bytes}
        output_filename: filename (without extension) for the output

    Returns:
        (cloud_url, duration_seconds, timestamps)
        where cloud_url is the public HTTPS URL of the uploaded audio file
        and timestamps is a list of {"index": int, "start_seconds": float}
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

    # Export to in-memory buffer
    buffer = io.BytesIO()
    combined.export(buffer, format="mp3", bitrate="128k")
    audio_data = buffer.getvalue()

    # Upload to cloud storage
    cloud_url = upload_audio(audio_data, output_filename)

    duration_seconds = len(combined) / 1000.0
    return cloud_url, duration_seconds, timestamps
