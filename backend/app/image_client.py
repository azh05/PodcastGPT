"""Fetch a cover image for a podcast topic.

Sources tried in order:
1. Google Custom Search (if GOOGLE_CSE_CX is configured) – best coverage
2. Wikipedia API (free, no key) – fallback
"""

import httpx

from app.config import settings

WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php"
GOOGLE_CSE_API = "https://www.googleapis.com/customsearch/v1"
TIMEOUT = 10.0
HEADERS = {"User-Agent": "PodcastGPT/1.0 (podcast cover image lookup; contact@example.com)"}


async def _google_cse_image(topic: str) -> str | None:
    """Search Google Custom Search for an image related to the topic."""
    if not settings.google_cse_cx or not settings.google_api_key:
        return None

    params = {
        "q": topic,
        "cx": settings.google_cse_cx,
        "key": settings.google_api_key,
        "searchType": "image",
        "num": 1,
        "imgSize": "large",
        "safe": "active",
    }
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.get(GOOGLE_CSE_API, params=params)
            resp.raise_for_status()
            data = resp.json()

        items = data.get("items", [])
        if items:
            return items[0].get("link")
    except Exception as exc:
        print(f"[image] Google CSE image search failed for '{topic}': {exc}")

    return None


async def _wikipedia_image(topic: str) -> str | None:
    """Search Wikipedia for the topic and return a thumbnail URL."""
    params = {
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrsearch": topic,
        "gsrlimit": 5,
        "prop": "pageimages",
        "piprop": "thumbnail",
        "pithumbsize": 500,
    }
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT, headers=HEADERS) as client:
            resp = await client.get(WIKIPEDIA_API, params=params)
            resp.raise_for_status()
            data = resp.json()

        pages = data.get("query", {}).get("pages", {})
        for page in pages.values():
            thumb = page.get("thumbnail", {}).get("source")
            if thumb:
                return thumb
    except Exception as exc:
        print(f"[image] Wikipedia image lookup failed for '{topic}': {exc}")

    return None


async def fetch_cover_image(topic: str) -> str | None:
    """Try multiple sources and return the first image URL found."""
    # 1. Google Custom Search (best results, needs CSE configured)
    url = await _google_cse_image(topic)
    if url:
        return url

    # 2. Wikipedia fallback (free, no key)
    url = await _wikipedia_image(topic)
    if url:
        return url

    return None
