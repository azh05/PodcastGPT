"""Google Cloud Storage integration for audio file uploads."""

from google.cloud import storage

from app.config import settings

# Initialize GCS client once at module level for reuse
_storage_client = None


def _get_storage_client() -> storage.Client:
    """Get or create a GCS client singleton."""
    global _storage_client
    if _storage_client is None:
        # Extract project ID from bucket name if it follows the pattern "project-id.appspot.com"
        project_id = (
            settings.gcs_bucket_name.split(".")[0] if settings.gcs_bucket_name else None
        )
        _storage_client = storage.Client(project=project_id)
    return _storage_client


def upload_audio(audio_data: bytes, filename: str) -> str:
    """Upload MP3 audio data to Google Cloud Storage.

    Args:
        audio_data: The audio file bytes to upload
        filename: The filename (without extension) for the audio file

    Returns:
        The public HTTPS URL of the uploaded file

    Raises:
        ValueError: If GCS_BUCKET_NAME is not configured
        Exception: If upload fails due to network, authentication, or quota issues
    """
    bucket_name = settings.gcs_bucket_name
    if not bucket_name:
        raise ValueError("GCS_BUCKET_NAME environment variable not configured")

    try:
        # Get GCS client
        client = _get_storage_client()
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
    except Exception as e:
        raise Exception(
            f"Failed to upload audio to GCS bucket '{bucket_name}': {e}"
        ) from e
