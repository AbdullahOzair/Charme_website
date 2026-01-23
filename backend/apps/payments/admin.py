"""
Payment admin for multiple gateways.
"""

from django.contrib import admin
from django.utils import timezone
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = [
        'transaction_id', 'method', 'order', 'amount',
        'status', 'customer_phone', 'created_at'
    ]
    list_filter = ['status', 'method', 'created_at']
    search_fields = ['transaction_id', 'reference_number', 'customer_phone', 'order__id']
    readonly_fields = ['transaction_id', 'created_at', 'updated_at', 'verified_at', 'verified_by']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Payment Info', {
            'fields': ('order', 'method', 'transaction_id', 'amount', 'currency', 'status')
        }),
        ('Customer Info', {
            'fields': ('customer_phone', 'reference_number')
        }),
        ('Gateway Response', {
            'fields': ('gateway_response', 'redirect_url', 'error_message'),
            'classes': ('collapse',)
        }),
        ('Verification', {
            'fields': ('verified_by', 'verified_at', 'notes')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['approve_payments', 'reject_payments']
    
    @admin.action(description='Approve selected payments')
    def approve_payments(self, request, queryset):
        for payment in queryset.filter(status__in=[Payment.Status.PENDING, Payment.Status.PROCESSING]):
            payment.status = Payment.Status.SUCCEEDED
            payment.verified_by = request.user
            payment.verified_at = timezone.now()
            payment.save()
            payment.order.status = 'paid'
            payment.order.save()
        self.message_user(request, f'{queryset.count()} payments approved.')
    
    @admin.action(description='Reject selected payments')
    def reject_payments(self, request, queryset):
        for payment in queryset.filter(status__in=[Payment.Status.PENDING, Payment.Status.PROCESSING]):
            payment.status = Payment.Status.FAILED
            payment.error_message = 'Rejected by admin'
            payment.verified_by = request.user
            payment.verified_at = timezone.now()
            payment.save()
        self.message_user(request, f'{queryset.count()} payments rejected.')

