# backend/apps/configurator/image_analyzer.py
"""
Pure-PIL image analysis for bead color and style detection.
No numpy required — uses bucket-based color quantization.
"""
import io
import colorsys
from PIL import Image


def _hex_to_rgb(hex_color: str) -> tuple:
    h = hex_color.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def _color_distance_sq(rgb1: tuple, rgb2: tuple) -> float:
    return sum((a - b) ** 2 for a, b in zip(rgb1, rgb2))


def extract_dominant_colors(img: Image.Image, num_colors: int = 5) -> list:
    """
    Return list of (count, (r, g, b)) tuples for the top N dominant colors.
    Near-white background pixels are excluded so the bead color dominates.
    Uses a bucket approach (32-step quantization) — no numpy needed.
    """
    rgb = img.convert('RGB').resize((150, 150), Image.LANCZOS)
    pixels = list(rgb.getdata())

    # Skip near-white pixels (background)
    filtered = [(r, g, b) for r, g, b in pixels if not (r > 220 and g > 220 and b > 220)]
    if not filtered:
        filtered = pixels  # image is all-white, fall back to full set

    STEP = 32
    buckets: dict = {}
    for r, g, b in filtered:
        key = (r // STEP, g // STEP, b // STEP)
        buckets[key] = buckets.get(key, 0) + 1

    sorted_buckets = sorted(buckets.items(), key=lambda x: x[1], reverse=True)

    results = []
    for (rb, gb, bb), count in sorted_buckets[:num_colors]:
        r = min(255, rb * STEP + STEP // 2)
        g = min(255, gb * STEP + STEP // 2)
        b = min(255, bb * STEP + STEP // 2)
        results.append((count, (r, g, b)))

    return results


def detect_bead_style(img: Image.Image) -> str:
    """
    Heuristic: crystal/faceted beads have bright specular highlights
    → high brightness variance across the image.
    Returns 'faceted' or 'round'.
    """
    rgb = img.convert('RGB').resize((100, 100), Image.LANCZOS)
    pixels = list(rgb.getdata())

    brightnesses = []
    for r, g, b in pixels:
        _, _, v = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
        brightnesses.append(v)

    n = len(brightnesses)
    mean_v = sum(brightnesses) / n
    variance = sum((v - mean_v) ** 2 for v in brightnesses) / n
    std_dev = variance ** 0.5

    # Count bright highlight pixels (highlights typical of faceted/crystal surfaces)
    highlights = sum(1 for v in brightnesses if v > 0.88)
    highlight_ratio = highlights / n

    if std_dev > 0.22 or highlight_ratio > 0.04:
        return 'faceted'
    return 'round'


def match_colors_to_palette(dominant_colors: list, palette_entries) -> list:
    """
    For each dominant color, find the nearest ColorPalette entry by
    squared Euclidean distance in RGB space.
    Returns a list of matched ColorPalette IDs (deduplicated, primary first).
    """
    matched_ids = []
    seen = set()

    for _, rgb in dominant_colors:
        best_id = None
        best_dist = float('inf')
        for cp in palette_entries:
            if not cp.hex_code:
                continue
            cp_rgb = _hex_to_rgb(cp.hex_code)
            dist = _color_distance_sq(rgb, cp_rgb)
            if dist < best_dist:
                best_dist = dist
                best_id = cp.id

        if best_id is not None and best_id not in seen:
            seen.add(best_id)
            matched_ids.append(best_id)

    return matched_ids


def score_beads(all_beads, matched_color_ids: list, detected_style: str) -> list:
    """
    Score each bead: +3 for primary color match, +2 for secondary, +1 for tertiary,
    +2 if shape matches detected style.
    Returns sorted list of (score, bead) descending.
    """
    scored = []
    color_rank = {cid: i for i, cid in enumerate(matched_color_ids)}

    for bead in all_beads:
        score = 0
        if bead.color_id in color_rank:
            score += max(1, 3 - color_rank[bead.color_id])
        if bead.shape == detected_style:
            score += 2
        scored.append((score, bead))

    scored.sort(key=lambda x: x[0], reverse=True)
    return scored
