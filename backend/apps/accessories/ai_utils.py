# backend/apps/accessories/ai_utils.py
"""
Google Gemini Vision integration for automatic bead image analysis.

Uses the Gemini REST API directly (no SDK) — avoids gRPC/certificate issues on Windows.

Setup:
  Add GEMINI_API_KEY=<your key> to your .env file.
  Get a free key at https://aistudio.google.com/apikey

Free tier: gemini-2.0-flash-lite — 30 req/min, 1 500 req/day.
Docs: https://ai.google.dev/gemini-api/docs/vision
"""

import base64
import json
import logging
import re

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

_GEMINI_URL = (
    'https://generativelanguage.googleapis.com/v1beta/models'
    '/gemini-flash-lite-latest:generateContent'
)

_ANALYSIS_PROMPT = """
You are a jewelry expert. Analyze this bead photo and return ONLY a valid JSON object
with no extra text, no markdown fences, no explanation.

{
  "color_name":         "<descriptive color, e.g. ruby red, sapphire blue, mint green>",
  "hex_color":          "<#RRGGBB closest solid color of the bead body>",
  "bead_material_type": "<exactly one of: glass | crystal | stone | metal | resin | pearl | wood | ceramic | other>",
  "transparency":       "<exactly one of: transparent | translucent | opaque>",
  "shape":              "<exactly one of: round | oval | cube | faceted>",
  "has_pattern":        <true | false>,
  "pattern_type":       "<millefiori | crackle | swirl | floral | geometric | stripe | none>",
  "surface":            "<glossy | matte | metallic | frosted | textured>"
}

Guidelines:
- cut gemstone / garnet / sapphire → crystal, usually transparent
- plain glass bead → glass, translucent or transparent
- jade / agate / turquoise → stone, translucent or opaque
- silver / gold / brass → metal, opaque
- acrylic / plastic → resin
- nacre / mother-of-pearl → pearl
- millefiori (multicolor flower slices) → has_pattern true, pattern_type millefiori
- crackle glass (internal fracture lines) → has_pattern true, pattern_type crackle
"""


def analyze_bead_image(image_field) -> dict:
    """
    Analyze a Django ImageField (or FileField) with Gemini Vision via REST API.

    Pass the field directly:
        result = analyze_bead_image(bead.image)

    Returns a dict of detected properties, or {} on any failure.
    Always safe to call — never raises.
    """
    api_key = getattr(settings, 'GEMINI_API_KEY', '') or ''
    if not api_key:
        logger.warning('GEMINI_API_KEY not configured — skipping AI analysis')
        return {}

    # ── Read image bytes via Django storage ──────────────────────────────────
    try:
        image_field.open('rb')
        image_bytes = image_field.read()
        image_field.close()
    except Exception as exc:
        logger.warning('Could not read image from storage: %s', exc)
        return {}

    if not image_bytes:
        logger.warning('Image file is empty')
        return {}

    # ── Detect MIME type from file extension ─────────────────────────────────
    name = getattr(image_field, 'name', '') or ''
    ext  = name.rsplit('.', 1)[-1].lower() if '.' in name else ''
    mime = {
        'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
        'png': 'image/png',  'webp': 'image/webp',
    }.get(ext, 'image/jpeg')

    image_b64 = base64.b64encode(image_bytes).decode('utf-8')

    # ── Call Gemini REST API ──────────────────────────────────────────────────
    payload = {
        'contents': [{
            'parts': [
                {'inline_data': {'mime_type': mime, 'data': image_b64}},
                {'text': _ANALYSIS_PROMPT},
            ],
        }],
        'generationConfig': {
            'temperature': 0.1,
            'maxOutputTokens': 512,
        },
    }

    try:
        resp = requests.post(
            _GEMINI_URL,
            params={'key': api_key},
            json=payload,
            timeout=30,
        )
    except requests.RequestException as exc:
        logger.warning('Gemini HTTP request failed: %s', exc)
        return {}

    if resp.status_code == 429:
        logger.warning('Gemini rate limit hit — retry in a few seconds.')
        return {}

    if not resp.ok:
        logger.warning(
            'Gemini API error %s: %s',
            resp.status_code,
            resp.text[:300],
        )
        return {}

    # ── Parse response ────────────────────────────────────────────────────────
    try:
        data = resp.json()
        raw  = data['candidates'][0]['content']['parts'][0]['text']
    except (KeyError, IndexError, ValueError) as exc:
        logger.warning('Unexpected Gemini response structure: %s | %s', exc, resp.text[:300])
        return {}

    raw = re.sub(r'^```[a-z]*\s*', '', raw.strip(), flags=re.MULTILINE)
    raw = re.sub(r'\s*```$',        '', raw,          flags=re.MULTILINE)

    match = re.search(r'\{.*\}', raw, re.DOTALL)
    if not match:
        logger.warning('No JSON in Gemini response: %s', raw[:300])
        return {}

    try:
        result = json.loads(match.group())
    except json.JSONDecodeError as exc:
        logger.warning('JSON parse error: %s | raw: %s', exc, raw[:300])
        return {}

    logger.info('Gemini analysis result: %s', result)
    return result
