from django.contrib import admin
from django.utils.html import format_html
from .models import ContactMessage, StoreSettings


@admin.register(StoreSettings)
class StoreSettingsAdmin(admin.ModelAdmin):
    """Admin for store-wide settings."""
    list_display = ['__str__', 'shipping_cost', 'free_shipping_threshold', 'tax_rate', 'updated_at']
    
    fieldsets = (
        ('Shipping Settings', {
            'fields': ('shipping_cost', 'free_shipping_threshold', 'express_shipping_cost'),
            'description': 'Configure shipping costs. Orders above free shipping threshold get free standard shipping.'
        }),
        ('Tax Settings', {
            'fields': ('tax_rate',),
            'description': 'Tax rate applied to orders (set to 0 for no tax).'
        }),
    )
    
    def has_add_permission(self, request):
        # Only allow one instance
        return not StoreSettings.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'subject', 'status_badge', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['name', 'email', 'subject', 'message']
    readonly_fields = ['name', 'email', 'subject', 'message', 'created_at', 'updated_at']
    list_per_page = 25
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Message Information', {
            'fields': ('name', 'email', 'subject', 'message', 'created_at')
        }),
        ('Status & Notes', {
            'fields': ('status', 'admin_notes', 'updated_at')
        }),
    )
    
    def status_badge(self, obj):
        colors = {
            'new': '#ef4444',  # red
            'read': '#f59e0b',  # amber
            'replied': '#10b981',  # green
            'archived': '#6b7280',  # gray
        }
        color = colors.get(obj.status, '#6b7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px; font-size: 11px; font-weight: 600;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    actions = ['mark_as_read', 'mark_as_replied', 'mark_as_archived']
    
    def mark_as_read(self, request, queryset):
        updated = queryset.update(status='read')
        self.message_user(request, f'{updated} message(s) marked as read.')
    mark_as_read.short_description = 'Mark selected as Read'
    
    def mark_as_replied(self, request, queryset):
        updated = queryset.update(status='replied')
        self.message_user(request, f'{updated} message(s) marked as replied.')
    mark_as_replied.short_description = 'Mark selected as Replied'
    
    def mark_as_archived(self, request, queryset):
        updated = queryset.update(status='archived')
        self.message_user(request, f'{updated} message(s) archived.')
    mark_as_archived.short_description = 'Archive selected messages'
