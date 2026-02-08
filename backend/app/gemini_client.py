import json
import logging

from google import genai
from google.genai import types

from app.config import settings

logger = logging.getLogger(__name__)

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.google_api_key)
    return _client


RESEARCH_SYSTEM_PROMPT = (
    "You are a podcast researcher. Given a topic, find key facts, anecdotes, "
    "timeline of events, notable figures, surprising details, and controversies. "
    "Organize your findings clearly with headers. Be thorough but concise."
)

TONE_STYLES = {
    "conversational": "Keep it friendly and casual. Use natural speech patterns, occasional filler words, and make it feel like friends chatting.",
    "professional": "Maintain a polished, authoritative tone. Use clear, precise language. Keep reactions measured and informative.",
    "humorous": "Make it fun and entertaining! Include witty observations, playful banter, jokes, and lighthearted commentary. Don't be afraid to be silly.",
    "dramatic": "Build tension and intrigue. Use vivid descriptive language, dramatic pauses, and emotional reactions. Make it feel cinematic.",
    "educational": "Focus on clear explanations and learning. Break down complex concepts, use analogies, and ensure the audience understands key points.",
    "casual": "Keep it super relaxed and laid-back. Use slang, informal expressions, and make it feel like an easy-going conversation.",
}

SCRIPT_SYSTEM_PROMPT_BASE = """\
You are a podcast script writer. Write a dialogue between two hosts:
- HOST_A: The main narrator. Enthusiastic, knowledgeable, drives the story forward.
- HOST_B: The curious co-host. Asks great questions, reacts with surprise, adds engagement.

Rules:
- Write 15-25 exchanges total (aiming for a 3-5 minute episode).
- Make it feel natural with reactions and follow-up questions.
- HOST_A explains and storytells; HOST_B asks follow-ups and makes relatable comparisons.
- Start with a hook, build through the middle, end with a memorable takeaway.

CITATIONS (important):
When the dialogue mentions a specific document, book, letter, speech, painting,
artwork, scientific paper, or primary source, add a "citation_query" field to that
JSON object with a concise, search-friendly query string that could be used to find
that source (e.g. "Van Gogh letters to Theo", "Origin of Species Charles Darwin").
Only include citation_query when referencing a real, specific, verifiable source.
Do NOT add citation_query for general statements or opinions.

Return ONLY a JSON array of objects. Each object MUST have "speaker" and "text".
Optionally include "citation_query" when a specific source is referenced.
Example: [{"speaker": "host_a", "text": "Welcome back..."}, {"speaker": "host_a", "text": "In his diary, Columbus wrote...", "citation_query": "Christopher Columbus diary journal"}]
"""


ALLOWED_CATEGORIES = {
    "technology", "science", "history", "politics", "health",
    "business", "entertainment", "sports", "education", "culture",
    "philosophy", "art", "other",
}

CATEGORIZE_SYSTEM_PROMPT = (
    "You are a topic classifier. Given a podcast topic, classify it into exactly one "
    "of the following categories: technology, science, history, politics, health, "
    "business, entertainment, sports, education, culture, philosophy, art, other.\n\n"
    'Return a JSON object with a single key "category" and the chosen value.\n'
    'Example: {"category": "technology"}'
)


async def categorize_topic(topic: str) -> str:
    """Classify a topic into one of the predefined categories. Never raises."""
    try:
        response = await _get_client().aio.models.generate_content(
            model="gemini-2.0-flash",
            contents=f"Classify this podcast topic: {topic}",
            config=types.GenerateContentConfig(
                system_instruction=CATEGORIZE_SYSTEM_PROMPT,
                temperature=0.0,
                response_mime_type="application/json",
            ),
        )
        result = json.loads(response.text)
        category = result.get("category", "other").lower().strip()
        if category not in ALLOWED_CATEGORIES:
            return "other"
        return category
    except Exception as exc:
        logger.warning("categorize_topic failed for %r: %s", topic, exc)
        return "other"


async def research_topic(topic: str) -> str:
    response = await _get_client().aio.models.generate_content(
        model="gemini-3-pro-preview",
        contents=f"Research this topic for a podcast episode: {topic}",
        config=types.GenerateContentConfig(
            system_instruction=RESEARCH_SYSTEM_PROMPT,
            temperature=0.3,
            tools=[types.Tool(google_search=types.GoogleSearch())],
        ),
    )
    return response.text


async def generate_script(topic: str, research: str, tone: str = "conversational") -> list[dict]:
    tone_instruction = TONE_STYLES.get(tone, TONE_STYLES["conversational"])
    system_prompt = f"{SCRIPT_SYSTEM_PROMPT_BASE}\n\nTONE GUIDANCE: {tone_instruction}"
    
    prompt = (
        f"Topic: {topic}\n\n"
        f"Research notes:\n{research}\n\n"
        "Now write the podcast script as a JSON array."
    )
    response = await _get_client().aio.models.generate_content(
        model="gemini-3-pro-preview",
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=0.7,
            response_mime_type="application/json",
        ),
    )
    try:
        script = json.loads(response.text)
    except (json.JSONDecodeError, TypeError) as exc:
        raise ValueError(f"Gemini returned invalid JSON: {exc}") from exc

    if not isinstance(script, list) or not all(
        isinstance(line, dict) and "speaker" in line and "text" in line
        for line in script
    ):
        raise ValueError("Gemini returned unexpected script format")

    return script
