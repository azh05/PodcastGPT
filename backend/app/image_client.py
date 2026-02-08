"""Fetch a cover image for a podcast topic using Wikipedia's API (free, no key)."""

import httpx

WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php"
TIMEOUT = 10.0
HEADERS = {"User-Agent": "PodcastGPT/1.0 (podcast cover image lookup)"}


async def fetch_cover_image(topic: str) -> str | None:
    """Search Wikipedia for the topic and return a thumbnail URL, or None."""
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
        # Pick the first page that has a thumbnail
        for page in pages.values():
            thumb = page.get("thumbnail", {}).get("source")
            if thumb:
                return thumb
    except Exception as exc:
        print(f"[image] Wikipedia image lookup failed for '{topic}': {exc}")

    return None
