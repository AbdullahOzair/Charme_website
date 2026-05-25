# backend/apps/accessories/admin.py
from django.contrib import admin
from django.utils.html import format_html
from .models import Material, ColorPalette, Bead, Chain, Charm


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'price_modifier', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('name',)


@admin.register(ColorPalette)
class ColorPaletteAdmin(admin.ModelAdmin):
    list_display = ('name', 'hex_code', 'colored_preview', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'hex_code')
    ordering = ('name',)

    def colored_preview(self, obj):
        return format_html(
            '<span style="display:inline-block;width:24px;height:24px;'
            'background-color:{};border-radius:4px;border:1px solid #ccc;'
            'vertical-align:middle;" title="{}"></span>',
            obj.hex_code,
            obj.hex_code,
        )
    colored_preview.short_description = 'Color'


@admin.register(Bead)
class BeadAdmin(admin.ModelAdmin):
    list_display = ('name', 'material', 'color', 'size_mm', 'shape', 'price', 'stock', 'is_active', 'thumbnail_preview')
    list_filter = ('material', 'color', 'shape', 'is_active')
    search_fields = ('name',)
    readonly_fields = ('thumbnail_preview',)
    ordering = ('name',)

    def thumbnail_preview(self, obj):
        if obj.thumbnail:
            return format_html(
                '<img src="{}" style="max-height:60px;max-width:60px;'
                'border-radius:4px;object-fit:cover;" />',
                obj.thumbnail.url,
            )
        return format_html('<span style="color:#999;">No image</span>')
    thumbnail_preview.short_description = 'Thumbnail'


@admin.register(Chain)
class ChainAdmin(admin.ModelAdmin):
    list_display = ('name', 'material', 'color', 'thickness_mm', 'price', 'stock', 'is_active')
    list_filter = ('material', 'color', 'is_active')
    search_fields = ('name',)
    ordering = ('name',)


@admin.register(Charm)
class CharmAdmin(admin.ModelAdmin):
    list_display = ('name', 'material', 'color', 'price', 'stock', 'is_active')
    list_filter = ('material', 'color', 'is_active')
    search_fields = ('name',)
    ordering = ('name',)
