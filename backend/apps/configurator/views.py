# backend/apps/configurator/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from PIL import Image

from apps.accessories.models import Bead, Chain, Charm, Material, ColorPalette
from apps.accessories.serializers import (
    BeadSerializer,
    ChainSerializer,
    CharmSerializer,
    MaterialSerializer,
    ColorPaletteSerializer,
)
from .ai_engine import JewelryDesignEngine
from .image_analyzer import (
    extract_dominant_colors,
    detect_bead_style,
    match_colors_to_palette,
    score_beads,
)


class GenerateDesignView(APIView):
    """
    POST /api/v1/configurator/generate/
    Body: { "prompt": "...", "category_id": N (optional) }
    Returns a complete AI-generated design config.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        prompt = (request.data.get('prompt') or '').strip()
        if not prompt:
            return Response(
                {'error': 'prompt is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Load all active assets as querysets
        assets = {
            'beads':     Bead.objects.filter(is_active=True).select_related('material', 'color'),
            'chains':    Chain.objects.filter(is_active=True).select_related('material', 'color'),
            'charms':    Charm.objects.filter(is_active=True).select_related('material', 'color'),
            'materials': Material.objects.filter(is_active=True),
            'colors':    ColorPalette.objects.filter(is_active=True),
        }

        # Run the engine
        engine = JewelryDesignEngine(assets)
        config = engine.generate(prompt)

        # Resolve IDs → full serialized objects
        ctx = {'request': request}

        selected_beads = list(
            assets['beads'].filter(id__in=config['bead_ids'])
        )
        # Preserve engine-determined order
        id_order = {bid: i for i, bid in enumerate(config['bead_ids'])}
        selected_beads.sort(key=lambda b: id_order.get(b.id, 999))

        chain_id = config.get('chain_id')
        selected_chain = (
            assets['chains'].filter(id=chain_id).first() if chain_id else None
        )

        selected_charms = list(
            assets['charms'].filter(id__in=config['charm_ids'])
        )

        color_id = config.get('color_id')
        selected_color = (
            assets['colors'].filter(id=color_id).first() if color_id else None
        )

        material_id = config.get('material_id')
        selected_material = (
            assets['materials'].filter(id=material_id).first() if material_id else None
        )

        return Response({
            'beads':       BeadSerializer(selected_beads, many=True, context=ctx).data,
            'chain':       ChainSerializer(selected_chain, context=ctx).data if selected_chain else None,
            'charms':      CharmSerializer(selected_charms, many=True, context=ctx).data,
            'color':       ColorPaletteSerializer(selected_color).data if selected_color else None,
            'material':    MaterialSerializer(selected_material).data if selected_material else None,
            'total_price': float(config['total_price']),
            'config_json': config['config_json'],
        }, status=status.HTTP_200_OK)


class AnalyzeImageView(APIView):
    """
    POST /api/v1/configurator/analyze-image/
    Multipart body: { "image": <file> }

    Analyzes an uploaded bead/bracelet photo using PIL color extraction
    and brightness heuristics, then returns the best-matching beads
    from the database.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        image_file = request.FILES.get('image')
        if not image_file:
            return Response({'error': 'image file is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            img = Image.open(image_file)
        except Exception:
            return Response({'error': 'Could not read image. Please upload a valid JPG or PNG.'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Extract dominant non-background colors
        dominant = extract_dominant_colors(img, num_colors=5)

        # 2. Detect bead style from brightness variance
        detected_style = detect_bead_style(img)

        # 3. Load DB assets
        all_beads  = list(Bead.objects.filter(is_active=True).select_related('material', 'color'))
        all_colors = list(ColorPalette.objects.filter(is_active=True))

        # 4. Match dominant image colors → nearest ColorPalette entries
        matched_color_ids = match_colors_to_palette(dominant, all_colors)

        # 5. Score and rank beads
        scored = score_beads(all_beads, matched_color_ids, detected_style)

        # Take top beads that have at least some match; fall back if none scored
        top_beads = [b for score, b in scored if score > 0][:8]
        if not top_beads:
            # Fallback: return all faceted beads or first 8 active beads
            top_beads = [b for b in all_beads if b.shape == detected_style][:8] or all_beads[:8]

        # Primary matched color
        primary_color_id = matched_color_ids[0] if matched_color_ids else None
        primary_color = next((c for c in all_colors if c.id == primary_color_id), None)

        # Detected hex (center of dominant bucket)
        detected_hex = '#{:02X}{:02X}{:02X}'.format(*dominant[0][1]) if dominant else None

        ctx = {'request': request}
        return Response({
            'beads':          BeadSerializer(top_beads, many=True, context=ctx).data,
            'color':          ColorPaletteSerializer(primary_color).data if primary_color else None,
            'detected_style': detected_style,
            'detected_hex':   detected_hex,
        }, status=status.HTTP_200_OK)
