"""Google Cloud Storage integration for audio file uploads."""

from google.cloud import storage

from app.config import settings


def upload_audio(audio_data: bytes, filename: str) -> str:
    """Upload MP3 audio data to Google Cloud Storage.

    Args:
        audio_data: The audio file bytes to upload
        filename: The filename (without extension) for the audio file

    Returns:
        The public HTTPS URL of the uploaded file
    """
    bucket_name = settings.gcs_bucket_name
    if not bucket_name:
        raise ValueError("GCS_BUCKET_NAME environment variable not configured")

    # Initialize GCS client
    client = storage.Client()
    bucket = client.bucket(bucket_name)

    # Upload to audio/ prefix in the bucket
    blob_name = f"audio/{filename}.mp3"
    blob = bucket.blob(blob_name)

    # Upload the audio data
    blob.upload_from_string(audio_data, content_type="audio/mpeg")

    # Make the blob publicly accessible
    blob.make_public()

    # Return the public URL
    return blob.public_url
