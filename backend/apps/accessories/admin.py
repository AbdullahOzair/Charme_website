# backend/apps/accessories/admin.py
import logging

from django import forms
from django.contrib import admin, messages
from django.shortcuts import get_object_or_404, redirect
from django.urls import path, reverse
from django.utils.html import format_html, format_html_join

from .models import Bead, Chain, Charm, CharmVariant, ColorPalette, Material

logger = logging.getLogger(__name__)


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display  = ('name', 'slug', 'price_modifier', 'is_active')
    list_filter   = ('is_active',)
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('name',)


@admin.register(ColorPalette)
class ColorPaletteAdmin(admin.ModelAdmin):
    list_display  = ('name', 'hex_code', 'colored_preview', 'is_active')
    list_filter   = ('is_active',)
    search_fields = ('name', 'hex_code')
    ordering      = ('name',)

    def colored_preview(self, obj):
        return format_html(
            '<span style="display:inline-block;width:24px;height:24px;'
            'background-color:{};border-radius:4px;border:1px solid #ccc;'
            'vertical-align:middle;" title="{}"></span>',
            obj.hex_code, obj.hex_code,
        )
    colored_preview.short_description = 'Color'


@admin.register(Bead)
class BeadAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'bead_material_type', 'transparency', 'shape',
        'color', 'size_mm', 'price', 'stock', 'is_active', 'thumbnail_preview',
    )
    list_filter   = ('bead_material_type', 'transparency', 'shape', 'is_multi_shade', 'is_active', 'material')
    search_fields = ('name',)
    ordering      = ('name',)
    readonly_fields  = ('thumbnail_preview', 'texture_preview', 'shade_preview', 'ai_analyze_button')
    actions = ['bulk_analyze_with_ai']

    class Media:
        # Toggles the "Multi-shade options" fields based on the checkbox.
        js = ('admin/js/bead_multishade.js',)

    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'price', 'stock', 'size_mm', 'is_active'),
        }),
        ('3D Appearance', {
            'fields': ('shape', 'bead_material_type', 'transparency', 'color', 'material'),
            'description': 'Manual look for a plain/solid bead. For a multicolor bead, tick '
                           '“Multi-shade” below instead.',
        }),
        ('Multi-shade options', {
            'fields': ('is_multi_shade', 'use_real_photo', 'texture_style',
                       'shade_colors', 'shade_preview'),
            'description': 'For multicolor beads (natural stone, marble, millefiori). '
                           'Tick “Is multi shade” to enable — the bead then shows its real '
                           'photo in the 3D viewer.',
        }),
        ('Media', {
            'fields': ('image', 'thumbnail_preview', 'texture', 'texture_preview', 'model_file'),
        }),
        ('AI Image Analysis', {
            'fields': ('ai_analyze_button',),
            'description': (
                'Auto-detects color, shape, material type, transparency and multi-shade '
                'colors from the bead photo using Google Gemini Vision AI. Upload an image '
                'and save first.'
            ),
        }),
    )

    # ── Readonly renderers ────────────────────────────────────────────────────

    def thumbnail_preview(self, obj):
        src = obj.thumbnail or obj.image
        if src:
            return format_html(
                '<img src="{}" style="max-height:70px;max-width:70px;'
                'border-radius:4px;object-fit:cover;" />',
                src.url,
            )
        return format_html('<span style="color:#999;">No image</span>')
    thumbnail_preview.short_description = 'Preview'

    def texture_preview(self, obj):
        if obj.texture:
            return format_html(
                '<img src="{}" style="max-height:120px;max-width:120px;'
                'border-radius:6px;object-fit:cover;border:1px solid #ddd;" />',
                obj.texture.url,
            )
        return format_html(
            '<span style="color:#999;">No texture. Upload a pattern photo here for '
            'millefiori, crackle glass, etc. — used as MatCap in the 3D viewer.</span>'
        )
    texture_preview.short_description = '3D Pattern Texture Preview'

    def shade_preview(self, obj):
        colors = obj.shade_colors if isinstance(obj.shade_colors, list) else []
        colors = [c for c in colors if isinstance(c, str) and c.startswith('#')]
        if not colors:
            return format_html('<span style="color:#999;">No shade colors set.</span>')
        swatches = format_html_join(
            '', '<span style="display:inline-block;width:26px;height:26px;'
                'background:{};border:1px solid #ccc;border-radius:4px;margin-right:4px;'
                'vertical-align:middle;" title="{}"></span>',
            ((c, c) for c in colors),
        )
        return format_html('{}', swatches)
    shade_preview.short_description = 'Shade colors'

    def ai_analyze_button(self, obj):
        if not obj.pk or not obj.image:
            return format_html(
                '<span style="color:#999;">Upload an image and save the bead first.</span>'
            )
        url = reverse('admin:accessories_bead_analyze_ai', args=[obj.pk])
        return format_html(
            '<a href="{}" class="button default" style="padding:6px 20px;font-size:13px;">'
            '🤖 Analyze with Gemini AI</a>'
            '<p style="color:#555;margin-top:6px;font-size:11px;">'
            'Detects: color &bull; shape &bull; material type &bull; transparency</p>',
            url,
        )
    ai_analyze_button.short_description = 'AI Analysis'

    # ── Custom URLs ──────────────────────────────────────────────────────────

    def get_urls(self):
        urls = super().get_urls()
        return [
            path(
                '<int:pk>/analyze-ai/',
                self.admin_site.admin_view(self._analyze_ai_view),
                name='accessories_bead_analyze_ai',
            ),
        ] + urls

    def _analyze_ai_view(self, request, pk):
        bead = get_object_or_404(Bead, pk=pk)
        self._run_ai_analysis(request, bead, silent=False)
        return redirect(f'../../{pk}/change/')

    # ── Bulk action ──────────────────────────────────────────────────────────

    @admin.action(description='🤖 Analyze images with Gemini AI (auto-fill properties)')
    def bulk_analyze_with_ai(self, request, queryset):
        ok = fail = skip = 0
        for bead in queryset:
            if not bead.image:
                skip += 1
                continue
            if self._run_ai_analysis(request, bead, silent=True):
                ok += 1
            else:
                fail += 1
        level = messages.SUCCESS if fail == 0 else messages.WARNING
        self.message_user(
            request,
            f'AI analysis — updated: {ok}, failed: {fail}, skipped (no image): {skip}.',
            level,
        )

    # ── Core analysis ────────────────────────────────────────────────────────

    @staticmethod
    def _get_or_create_color(hex_upper, name):
        """
        Return a ColorPalette for this hex, creating one if needed.

        Keyed on hex_code, but ColorPalette.name is UNIQUE — so when a colour
        with the same *name* but a different hex already exists, we give the new
        row a de-duplicated name instead of crashing with an IntegrityError.
        """
        existing = ColorPalette.objects.filter(hex_code=hex_upper).first()
        if existing:
            return existing

        base = (name or hex_upper)[:90]
        candidate = base
        suffix = 2
        while ColorPalette.objects.filter(name=candidate).exists():
            candidate = f'{base} ({suffix})'
            suffix += 1
        return ColorPalette.objects.create(
            hex_code=hex_upper, name=candidate, is_active=True,
        )

    def _run_ai_analysis(self, request, bead, *, silent):
        from .ai_utils import analyze_bead_image

        try:
            # Pass the ImageField directly — ai_utils reads via Django storage,
            # which avoids all Windows path and missing-file issues.
            result = analyze_bead_image(bead.image)
        except Exception as exc:
            if not silent:
                self.message_user(request, f'Analysis error: {exc}', messages.ERROR)
            return False

        if not result:
            if not silent:
                self.message_user(
                    request,
                    'Gemini returned no result. Possible causes: '
                    '(1) Rate limit hit — wait a few seconds and retry. '
                    '(2) GEMINI_API_KEY missing or invalid. '
                    '(3) google-genai not installed (pip install google-genai). '
                    'Check the Django server console for details.',
                    messages.WARNING,
                )
            return False

        changes      = []
        update_fields = []

        # Color
        hex_raw = (result.get('hex_color') or '').strip()
        if hex_raw:
            if not hex_raw.startswith('#'):
                hex_raw = '#' + hex_raw
            if len(hex_raw) == 7:
                cname = (result.get('color_name') or hex_raw)[:100]
                color = self._get_or_create_color(hex_raw.upper(), cname)
                if bead.color_id != color.pk:
                    bead.color = color
                    update_fields.append('color')
                    changes.append(f'color → {color.name}')

        # Shape
        shape = (result.get('shape') or '').lower()
        if shape in {c[0] for c in Bead.SHAPE_CHOICES} and bead.shape != shape:
            bead.shape = shape
            update_fields.append('shape')
            changes.append(f'shape → {shape}')

        # Material type
        mtype = (result.get('bead_material_type') or '').lower()
        if mtype in {c[0] for c in Bead.MTYPE_CHOICES} and bead.bead_material_type != mtype:
            bead.bead_material_type = mtype
            update_fields.append('bead_material_type')
            changes.append(f'type → {mtype}')

        # Transparency
        trans = (result.get('transparency') or '').lower()
        if trans in {c[0] for c in Bead.TRANS_CHOICES} and bead.transparency != trans:
            bead.transparency = trans
            update_fields.append('transparency')
            changes.append(f'transparency → {trans}')

        # Multi-shade detection
        multi = bool(result.get('is_multi_shade')) or bool(result.get('has_pattern'))
        shades = result.get('shade_colors') or []
        shades = [
            (s if s.startswith('#') else '#' + s).upper()
            for s in shades if isinstance(s, str) and len(s.lstrip('#')) == 6
        ]
        if len(shades) >= 2:
            multi = True

        if multi and not bead.is_multi_shade:
            bead.is_multi_shade = True
            bead.use_real_photo = True
            update_fields.extend(['is_multi_shade', 'use_real_photo'])
            changes.append('multi-shade → on')

        if multi and shades and bead.shade_colors != shades:
            bead.shade_colors = shades
            update_fields.append('shade_colors')
            changes.append(f'shades → {len(shades)} colors')

        # Texture style (map AI pattern_type/texture_style onto our choices)
        tstyle = (result.get('texture_style') or result.get('pattern_type') or '').lower()
        tstyle_map = {'floral': 'millefiori', 'stripe': 'swirl', 'geometric': 'marble'}
        tstyle = tstyle_map.get(tstyle, tstyle)
        if (multi and tstyle in {c[0] for c in Bead.TSTYLE_CHOICES}
                and tstyle != 'none' and bead.texture_style != tstyle):
            bead.texture_style = tstyle
            update_fields.append('texture_style')
            changes.append(f'style → {tstyle}')

        if update_fields:
            bead.save(update_fields=update_fields)

        ai_summary = (
            f"AI detected: {result.get('bead_material_type','?')} / "
            f"{result.get('transparency','?')} / "
            f"pattern={result.get('has_pattern','?')} ({result.get('pattern_type','?')})"
        )
        if not silent:
            if changes:
                self.message_user(
                    request,
                    f'"{bead.name}" updated — {", ".join(changes)}. {ai_summary}',
                    messages.SUCCESS,
                )
            else:
                self.message_user(request, f'No changes needed. {ai_summary}', messages.INFO)

        return True


@admin.register(Chain)
class ChainAdmin(admin.ModelAdmin):
    list_display  = ('name', 'material', 'color', 'thickness_mm', 'price', 'stock', 'is_active')
    list_filter   = ('material', 'color', 'is_active')
    search_fields = ('name',)
    ordering      = ('name',)


class CharmVariantInline(admin.TabularInline):
    """Add color options to a charm — same shape, just a different color + image."""
    model = CharmVariant
    extra = 1
    fields = ('sort_order', 'color_name', 'color_hex', 'image', 'variant_preview', 'is_default')
    readonly_fields = ('variant_preview',)

    def variant_preview(self, obj):
        if obj and obj.image:
            return format_html(
                '<img src="{}" style="max-height:44px;max-width:44px;object-fit:contain;'
                'border:1px solid #ddd;border-radius:4px;" />',
                obj.image.url,
            )
        return format_html('<span style="color:#999;">—</span>')
    variant_preview.short_description = 'Preview'

    def formfield_for_dbfield(self, db_field, request, **kwargs):
        field = super().formfield_for_dbfield(db_field, request, **kwargs)
        # Native color picker → always a valid #RRGGBB value.
        if db_field.name == 'color_hex':
            field.widget = forms.TextInput(
                attrs={'type': 'color', 'style': 'width:46px;height:32px;padding:0;border:none;'}
            )
        return field


@admin.register(Charm)
class CharmAdmin(admin.ModelAdmin):
    inlines = [CharmVariantInline]
    list_display  = ('name', 'charm_type', 'size_mm', 'is_movable',
                     'variant_count', 'material', 'color', 'price', 'stock', 'is_active')
    list_filter   = ('charm_type', 'is_movable', 'jump_ring_color', 'material', 'color', 'is_active')
    search_fields = ('name',)
    ordering      = ('name',)
    readonly_fields = ('anchor_picker',)

    class Media:
        js = ('admin/js/charm_anchor.js',)

    def variant_count(self, obj):
        return obj.variants.count()
    variant_count.short_description = 'Colors'

    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'price', 'stock', 'is_active'),
        }),
        ('Bracelet placement', {
            'fields': ('charm_type', 'is_movable', 'size_mm', 'jump_ring_color'),
            'description': 'How the charm attaches to the bracelet and its physical size.',
        }),
        ('Join point', {
            'fields': ('anchor_picker', 'anchor_x', 'anchor_y'),
            'description': 'Click on the charm image to mark where its loop connects to the '
                           'bracelet wire. Leave blank to auto-detect. Save an image first.',
        }),
        ('Appearance', {
            'fields': ('material', 'color'),
        }),
        ('Media', {
            'fields': ('image', 'thumbnail', 'preview_image', 'model_file'),
        }),
    )

    def anchor_picker(self, obj):
        src = obj.image or obj.preview_image or obj.thumbnail if obj and obj.pk else None
        if not src:
            return format_html('<span style="color:#999;">Upload an image and save first.</span>')
        ax = obj.anchor_x if obj.anchor_x is not None else ''
        ay = obj.anchor_y if obj.anchor_y is not None else ''
        return format_html(
            '<div id="charm-anchor-picker" data-ax="{}" data-ay="{}" '
            'style="position:relative;display:inline-block;max-width:260px;'
            'border:1px solid #ddd;border-radius:8px;overflow:hidden;cursor:crosshair;">'
            '<img src="{}" style="display:block;max-width:260px;height:auto;" draggable="false" />'
            '<span id="charm-anchor-marker" style="position:absolute;width:16px;height:16px;'
            'margin:-8px 0 0 -8px;border:2px solid #fff;border-radius:50%;'
            'background:#e11d48;box-shadow:0 0 0 2px #e11d48,0 1px 4px rgba(0,0,0,.5);'
            'display:none;pointer-events:none;"></span>'
            '</div>'
            '<p style="color:#555;font-size:11px;margin-top:6px;">Click the loop/bail on the '
            'charm. The red dot marks the current join point.</p>',
            ax, ay, src.url,
        )
    anchor_picker.short_description = 'Click to set join point'
