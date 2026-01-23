"""
Admin configuration for Products app.
"""

from django.contrib import admin
from django.utils.html import format_html
from .models import Category, Product, ProductImage


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('name',)


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ('image', 'alt_text', 'order', 'image_preview')
    readonly_fields = ('image_preview',)
    
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-height: 100px; max-width: 150px;" />', obj.image.url)
        return "No image"
    image_preview.short_description = 'Preview'


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'price_display', 'discount_badge', 'stock', 'category', 'is_active', 'created_at')
    list_filter = ('is_active', 'is_on_sale', 'category', 'created_at')
    search_fields = ('name', 'description')
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ('created_at', 'updated_at', 'sale_price', 'final_price_display')
    list_editable = ('stock', 'is_active')
    inlines = [ProductImageInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'description', 'category')
        }),
        ('Pricing & Stock', {
            'fields': ('price', 'stock')
        }),
        ('Discount/Sale', {
            'fields': ('is_on_sale', 'discount_percent', 'sale_price', 'final_price_display'),
            'description': 'Set discount percentage and mark as on sale. Sale price is auto-calculated.'
        }),
        ('Main Image', {
            'fields': ('image',),
            'description': 'Upload main product image. Additional images can be added below.'
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def price_display(self, obj):
        """Display price with sale price if applicable."""
        if obj.is_on_sale and obj.sale_price:
            return format_html(
                '<span style="text-decoration: line-through; color: #999;">Rs. {}</span> '
                '<span style="color: #e74c3c; font-weight: bold;">Rs. {}</span>',
                obj.price,
                obj.sale_price
            )
        return f"Rs. {obj.price}"
    price_display.short_description = 'Price'
    
    def discount_badge(self, obj):
        """Display discount badge."""
        if obj.is_on_sale and obj.discount_percent > 0:
            return format_html(
                '<span style="background-color: #e74c3c; color: white; padding: 3px 8px; '
                'border-radius: 3px; font-size: 11px; font-weight: 600;">{}% OFF</span>',
                int(obj.discount_percent)
            )
        return '-'
    discount_badge.short_description = 'Discount'
    
    def final_price_display(self, obj):
        """Display final price in detail view."""
        return f"Rs. {obj.final_price}"
    final_price_display.short_description = 'Final Price'
    
    actions = ['mark_on_sale', 'remove_from_sale', 'apply_10_percent_discount', 'apply_20_percent_discount']
    
    def mark_on_sale(self, request, queryset):
        """Mark selected products as on sale."""
        updated = queryset.update(is_on_sale=True)
        self.message_user(request, f'{updated} product(s) marked as on sale.')
    mark_on_sale.short_description = 'Mark selected as ON SALE'
    
    def remove_from_sale(self, request, queryset):
        """Remove products from sale."""
        updated = queryset.update(is_on_sale=False, discount_percent=0)
        self.message_user(request, f'{updated} product(s) removed from sale.')
    remove_from_sale.short_description = 'Remove from SALE'
    
    def apply_10_percent_discount(self, request, queryset):
        """Apply 10% discount to selected products."""
        for product in queryset:
            product.is_on_sale = True
            product.discount_percent = 10
            product.save()
        self.message_user(request, f'10% discount applied to {queryset.count()} product(s).')
    apply_10_percent_discount.short_description = 'Apply 10%% Discount'
    
    def apply_20_percent_discount(self, request, queryset):
        """Apply 20% discount to selected products."""
        for product in queryset:
            product.is_on_sale = True
            product.discount_percent = 20
            product.save()
        self.message_user(request, f'20% discount applied to {queryset.count()} product(s).')
    apply_20_percent_discount.short_description = 'Apply 20%% Discount'


