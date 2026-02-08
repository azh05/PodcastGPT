"""Resolve citation queries against Open Library API (free, no key required)."""

import asyncio

import httpx

OPEN_LIBRARY_SEARCH_URL = "https://openlibrary.org/search.json"
TIMEOUT = 15.0
MAX_RETRIES = 3
BASE_DELAY = 1.0  # seconds; doubles each retry


def _build_cover_url(cover_i: int | None) -> str | None:
    """Build an Open Library cover image URL from a cover ID."""
    if not cover_i:
        return None
    return f"https://covers.openlibrary.org/b/id/{cover_i}-M.jpg"


async def resolve_citation(query: str) -> dict | None:
    """Look up a citation query via Open Library and return structured metadata.

    Retries with exponential backoff on 429 / 5xx responses.
    Returns a dict with keys: title, authors, published_date, thumbnail_url,
    source_url, source_name.  Returns None if nothing relevant was found.
    """
    params = {"q": query, "limit": 1, "fields": "title,author_name,first_publish_year,cover_i,key"}

    for attempt in range(MAX_RETRIES):
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT) as client:
                resp = await client.get(OPEN_LIBRARY_SEARCH_URL, params=params)

                if resp.status_code == 429 or resp.status_code >= 500:
                    delay = BASE_DELAY * (2 ** attempt)
                    print(f"[citations] {resp.status_code} for '{query}', retrying in {delay}s (attempt {attempt + 1}/{MAX_RETRIES})")
                    await asyncio.sleep(delay)
                    continue

                resp.raise_for_status()
                data = resp.json()
        except (httpx.HTTPError, Exception) as exc:
            print(f"[citations] Open Library lookup failed for '{query}': {exc}")
            return None
        else:
            break
    else:
        print(f"[citations] Exhausted retries for '{query}'")
        return None

    docs = data.get("docs", [])
    if not docs:
        return None

    doc = docs[0]
    work_key = doc.get("key", "")  # e.g. "/works/OL12345W"

    return {
        "title": doc.get("title", "Unknown"),
        "authors": doc.get("author_name", []),
        "published_date": str(doc["first_publish_year"]) if doc.get("first_publish_year") else None,
        "thumbnail_url": _build_cover_url(doc.get("cover_i")),
        "source_url": f"https://openlibrary.org{work_key}" if work_key else None,
        "source_name": "Open Library",
    }
