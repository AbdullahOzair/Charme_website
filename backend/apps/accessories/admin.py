# backend/apps/accessories/admin.py
import logging

from django.contrib import admin, messages
from django.shortcuts import get_object_or_404, redirect
from django.urls import path, reverse
from django.utils.html import format_html

from .models import Bead, Chain, Charm, ColorPalette, Material

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
    list_filter   = ('bead_material_type', 'transparency', 'shape', 'is_active', 'material')
    search_fields = ('name',)
    ordering      = ('name',)
    readonly_fields  = ('thumbnail_preview', 'texture_preview', 'ai_analyze_button')
    actions = ['bulk_analyze_with_ai']

    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'price', 'stock', 'size_mm', 'is_active'),
        }),
        ('3D Appearance', {
            'fields': ('shape', 'bead_material_type', 'transparency', 'color', 'material'),
            'description': 'These fields control how the bead looks in the 3D configurator viewer.',
        }),
        ('Media', {
            'fields': ('image', 'thumbnail_preview', 'texture', 'texture_preview', 'model_file'),
        }),
        ('AI Image Analysis', {
            'fields': ('ai_analyze_button',),
            'description': (
                'Auto-detects color, shape, material type and transparency from the bead photo '
                'using Google Gemini Vision AI. Upload an image and save first.'
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
                color, _ = ColorPalette.objects.get_or_create(
                    hex_code=hex_raw.upper(),
                    defaults={'name': cname, 'is_active': True},
                )
                if bead.color_id != color.pk:
                    bead.color = color
                    update_fields.append('color')
                    changes.append(f'color → {cname}')

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


@admin.register(Charm)
class CharmAdmin(admin.ModelAdmin):
    list_display  = ('name', 'material', 'color', 'price', 'stock', 'is_active')
    list_filter   = ('material', 'color', 'is_active')
    search_fields = ('name',)
    ordering      = ('name',)
