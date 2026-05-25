# backend/apps/customization/admin.py
import json
from django.contrib import admin
from django.utils.html import format_html
from .models import JewelryCategory, Bracelet, CustomDesign


@admin.register(JewelryCategory)
class JewelryCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'image_preview', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ('image_preview',)
    ordering = ('name',)

    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height:60px;max-width:90px;'
                'border-radius:4px;object-fit:cover;" />',
                obj.image.url,
            )
        return format_html('<span style="color:#999;">No image</span>')
    image_preview.short_description = 'Preview'


@admin.register(Bracelet)
class BraceletAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'base_price', 'min_length', 'max_length', 'is_active')
    list_filter = ('category', 'is_active')
    search_fields = ('name',)
    ordering = ('name',)


@admin.register(CustomDesign)
class CustomDesignAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'total_price', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('user__email', 'name')
    readonly_fields = ('preview_image_display', 'config_json_pretty', 'created_at', 'updated_at')
    ordering = ('-created_at',)

    fieldsets = (
        ('Owner', {
            'fields': ('user', 'name', 'status'),
        }),
        ('Design Data', {
            'fields': ('config_json_pretty', 'total_price'),
        }),
        ('Preview', {
            'fields': ('preview_image', 'preview_image_display'),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    def preview_image_display(self, obj):
        if obj.preview_image:
            return format_html(
                '<img src="{}" style="max-height:200px;max-width:300px;'
                'border-radius:6px;object-fit:contain;" />',
                obj.preview_image.url,
            )
        return format_html('<span style="color:#999;">No preview</span>')
    preview_image_display.short_description = 'Preview Image'

    def config_json_pretty(self, obj):
        try:
            pretty = json.dumps(obj.config_json, indent=2, ensure_ascii=False)
        except (TypeError, ValueError):
            pretty = str(obj.config_json)
        return format_html(
            '<pre style="max-height:300px;overflow:auto;background:#f5f5f5;'
            'padding:10px;border-radius:4px;font-size:12px;">{}</pre>',
            pretty,
        )
    config_json_pretty.short_description = 'Configuration (JSON)'
