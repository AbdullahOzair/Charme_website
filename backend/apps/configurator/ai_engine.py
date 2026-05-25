# backend/apps/configurator/ai_engine.py
from decimal import Decimal


class JewelryDesignEngine:
    """
    Rule-based jewelry design engine.
    Parses natural-language prompts, scores DB assets against
    theme rules, and returns a complete design config dict.
    """

    # Maps theme name → trigger words that activate it
    THEMES = {
        'luxury':    ['luxury', 'luxurious', 'premium', 'royal', 'rich', 'opulent', 'gold'],
        'minimal':   ['minimal', 'minimalist', 'simple', 'clean', 'understated', 'plain'],
        'elegant':   ['elegant', 'elegance', 'refined', 'graceful', 'sophisticated', 'delicate'],
        'bold':      ['bold', 'statement', 'dramatic', 'striking', 'vivid', 'edgy'],
        'vintage':   ['vintage', 'retro', 'antique', 'classic', 'timeless', 'old'],
        'modern':    ['modern', 'contemporary', 'sleek', 'geometric', 'minimalistic'],
        'crystal':   ['crystal', 'crystalline', 'glass', 'transparent', 'clear', 'sparkle'],
        'floral':    ['floral', 'flower', 'bloom', 'petal', 'botanical', 'nature'],
        'ocean':     ['ocean', 'sea', 'marine', 'aquatic', 'coastal', 'blue', 'wave', 'water'],
        'celestial': ['celestial', 'star', 'moon', 'galaxy', 'cosmic', 'night', 'astral'],
    }

    # Per-theme design rules
    THEME_RULES = {
        'luxury': {
            'material_names': ['gold'],
            'color_names':    ['black', 'midnight', 'white', 'pearl', 'gold'],
            'shape':          'faceted',
            'charm_count':    3,
            'primary_color':  '#1A1A1A',
            'accent_color':   '#D4AF37',
        },
        'minimal': {
            'material_names': ['silver'],
            'color_names':    ['white', 'pearl', 'ivory', 'grey', 'neutral'],
            'shape':          'round',
            'charm_count':    0,
            'primary_color':  '#F5F5F5',
            'accent_color':   '#C0C0C0',
        },
        'elegant': {
            'material_names': ['rose gold', 'rose'],
            'color_names':    ['pearl', 'cream', 'rose', 'pink', 'blush'],
            'shape':          'oval',
            'charm_count':    1,
            'primary_color':  '#F0E6E6',
            'accent_color':   '#B76E79',
        },
        'bold': {
            'material_names': ['gold', 'silver'],
            'color_names':    ['red', 'purple', 'black', 'crimson'],
            'shape':          'cube',
            'charm_count':    2,
            'primary_color':  '#8B0000',
            'accent_color':   '#FFD700',
        },
        'vintage': {
            'material_names': ['gold'],
            'color_names':    ['brown', 'burgundy', 'cream', 'bronze', 'copper'],
            'shape':          'oval',
            'charm_count':    2,
            'primary_color':  '#704214',
            'accent_color':   '#C9A96E',
        },
        'modern': {
            'material_names': ['silver'],
            'color_names':    ['grey', 'white', 'black', 'slate'],
            'shape':          'cube',
            'charm_count':    0,
            'primary_color':  '#808080',
            'accent_color':   '#E0E0E0',
        },
        'crystal': {
            'material_names': ['silver'],
            'color_names':    ['white', 'light', 'clear', 'pearl', 'blue'],
            'shape':          'faceted',
            'charm_count':    1,
            'primary_color':  '#E8F4F8',
            'accent_color':   '#AADDE0',
        },
        'floral': {
            'material_names': ['rose gold', 'gold'],
            'color_names':    ['pink', 'rose', 'lavender', 'peach'],
            'shape':          'round',
            'charm_count':    3,
            'primary_color':  '#FFB6C1',
            'accent_color':   '#E8A4B8',
        },
        'ocean': {
            'material_names': ['silver'],
            'color_names':    ['blue', 'teal', 'turquoise', 'aqua', 'midnight'],
            'shape':          'round',
            'charm_count':    2,
            'primary_color':  '#006994',
            'accent_color':   '#40E0D0',
        },
        'celestial': {
            'material_names': ['silver', 'gold'],
            'color_names':    ['midnight', 'blue', 'black', 'purple', 'indigo'],
            'shape':          'faceted',
            'charm_count':    3,
            'primary_color':  '#191970',
            'accent_color':   '#9370DB',
        },
    }

    DEFAULT_RULE = {
        'material_names': ['silver'],
        'color_names':    [],
        'shape':          'round',
        'charm_count':    1,
        'primary_color':  '#C0C0C0',
        'accent_color':   '#E0E0E0',
    }

    def __init__(self, assets: dict):
        """
        assets = {
            'beads':     QuerySet[Bead],
            'chains':    QuerySet[Chain],
            'charms':    QuerySet[Charm],
            'materials': QuerySet[Material],
            'colors':    QuerySet[ColorPalette],
        }
        """
        self.assets = assets

    # ── Public API ────────────────────────────────────────────────────────────

    def generate(self, prompt: str) -> dict:
        """Parse prompt, select assets, return complete design config."""
        keywords = self._extract_keywords(prompt)
        rule = self._get_rule(keywords)

        bead_data  = self._select_beads(keywords, count=8)
        chain_id   = self._select_chain(keywords)
        charm_ids  = self._select_charms(keywords, rule['charm_count'])
        color_id   = self._find_color_id(keywords, rule)
        material_id = self._find_material_id(keywords, rule)

        color_scheme = self._build_color_scheme(keywords)

        config = {
            'bead_ids':      [b['id'] for b in bead_data],
            'chain_id':      chain_id,
            'charm_ids':     charm_ids,
            'color_id':      color_id,
            'material_id':   material_id,
            'primary_color': color_scheme['primary'],
            'accent_color':  color_scheme['accent'],
            'keywords':      keywords,
        }

        config['total_price'] = self._calculate_price(config)
        config['config_json'] = {
            'prompt':   prompt,
            'keywords': keywords,
            **{k: v for k, v in config.items() if k != 'config_json'},
            'total_price': str(config['total_price']),
        }

        return config

    # ── Keyword extraction ────────────────────────────────────────────────────

    def _extract_keywords(self, prompt: str) -> list:
        """Return list of matched theme names detected in the prompt."""
        prompt_lower = prompt.lower()
        matched = []
        for theme, triggers in self.THEMES.items():
            for word in triggers:
                if word in prompt_lower:
                    matched.append(theme)
                    break
        return matched if matched else ['minimal']

    # ── Asset selection ───────────────────────────────────────────────────────

    def _select_beads(self, keywords: list, count: int = 8) -> list:
        """
        Score each Bead against theme rules.
        Returns [{'id': N, 'position': N}, ...] sorted by score descending.
        """
        beads = self.assets.get('beads', [])
        rule  = self._get_rule(keywords)

        scored = []
        for bead in beads:
            score = 0
            mat_name = (bead.material.name.lower() if bead.material else '')
            col_name = (bead.color.name.lower()    if bead.color    else '')

            if any(m.lower() in mat_name for m in rule['material_names']):
                score += 3
            if rule['color_names'] and any(c.lower() in col_name for c in rule['color_names']):
                score += 2
            if bead.shape == rule.get('shape'):
                score += 1

            scored.append((bead.id, score))

        scored.sort(key=lambda x: x[1], reverse=True)
        top_ids = [item[0] for item in scored[:count]]
        return [{'id': bid, 'position': i} for i, bid in enumerate(top_ids)]

    def _select_chain(self, keywords: list):
        """Return ID of best-matching Chain, or None."""
        chains = self.assets.get('chains', [])
        rule   = self._get_rule(keywords)

        best_id, best_score = None, -1
        for chain in chains:
            score = 0
            mat_name = (chain.material.name.lower() if chain.material else '')
            if any(m.lower() in mat_name for m in rule['material_names']):
                score += 3
            if score > best_score:
                best_score = score
                best_id = chain.id

        if best_id is None:
            first = self._first(chains)
            best_id = first.id if first else None

        return best_id

    def _select_charms(self, keywords: list, count: int) -> list:
        """Return list of up to `count` Charm IDs matching the theme."""
        if count == 0:
            return []
        charms = self.assets.get('charms', [])
        rule   = self._get_rule(keywords)

        scored = []
        for charm in charms:
            score = 0
            mat_name = (charm.material.name.lower() if charm.material else '')
            col_name = (charm.color.name.lower()    if charm.color    else '')

            if any(m.lower() in mat_name for m in rule['material_names']):
                score += 2
            if rule['color_names'] and any(c.lower() in col_name for c in rule['color_names']):
                score += 1

            scored.append((charm.id, score))

        scored.sort(key=lambda x: x[1], reverse=True)
        return [item[0] for item in scored[:count]]

    def _build_color_scheme(self, keywords: list) -> dict:
        """Return {'primary': hex, 'accent': hex} for the dominant theme."""
        rule = self._get_rule(keywords)
        return {'primary': rule['primary_color'], 'accent': rule['accent_color']}

    # ── Price calculation ─────────────────────────────────────────────────────

    def _calculate_price(self, config: dict) -> Decimal:
        """Sum prices of all selected assets."""
        total = Decimal('0.00')

        beads = self.assets.get('beads', [])
        for bid in config.get('bead_ids', []):
            obj = self._get_by_id(beads, bid)
            if obj:
                total += Decimal(str(obj.price))

        chains = self.assets.get('chains', [])
        chain_id = config.get('chain_id')
        if chain_id:
            obj = self._get_by_id(chains, chain_id)
            if obj:
                total += Decimal(str(obj.price))

        charms = self.assets.get('charms', [])
        for cid in config.get('charm_ids', []):
            obj = self._get_by_id(charms, cid)
            if obj:
                total += Decimal(str(obj.price))

        materials = self.assets.get('materials', [])
        material_id = config.get('material_id')
        if material_id:
            obj = self._get_by_id(materials, material_id)
            if obj:
                total += Decimal(str(obj.price_modifier))

        return total

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _get_rule(self, keywords: list) -> dict:
        for kw in keywords:
            if kw in self.THEME_RULES:
                return self.THEME_RULES[kw]
        return self.DEFAULT_RULE

    def _find_material_id(self, keywords: list, rule: dict):
        materials = self.assets.get('materials', [])
        for mat in materials:
            if any(m.lower() in mat.name.lower() for m in rule['material_names']):
                return mat.id
        first = self._first(materials)
        return first.id if first else None

    def _find_color_id(self, keywords: list, rule: dict):
        colors = self.assets.get('colors', [])
        color_names = rule.get('color_names', [])
        for color in colors:
            if any(c.lower() in color.name.lower() for c in color_names):
                return color.id
        first = self._first(colors)
        return first.id if first else None

    @staticmethod
    def _first(queryset):
        """Return first item from a queryset or iterable, or None."""
        try:
            return queryset.first()
        except AttributeError:
            try:
                return next(iter(queryset))
            except StopIteration:
                return None

    @staticmethod
    def _get_by_id(queryset, obj_id):
        """Fetch a single object by PK from a queryset or list."""
        try:
            return queryset.get(id=obj_id)
        except Exception:
            for obj in queryset:
                if obj.id == obj_id:
                    return obj
            return None
