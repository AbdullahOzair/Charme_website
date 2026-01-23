from django.contrib import admin
from .models import Cart, CartItem, Coupon


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = ('price_at_addition', 'total_price')


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'total_items', 'subtotal', 'created_at', 'updated_at')
    list_filter = ('created_at',)
    search_fields = ('user__email', 'session_id')
    inlines = [CartItemInline]
    readonly_fields = ('id', 'total_items', 'subtotal')


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('cart', 'product', 'quantity', 'price_at_addition', 'total_price', 'is_available')
    list_filter = ('created_at',)
    search_fields = ('cart__user__email', 'product__name')


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ('code', 'discount_type', 'discount_value', 'is_active', 'is_valid', 'times_used', 'valid_until')
    list_filter = ('discount_type', 'is_active', 'valid_from', 'valid_until')
    search_fields = ('code', 'description')
    readonly_fields = ('times_used',)
