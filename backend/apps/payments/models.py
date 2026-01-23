"""
Payment models for multiple payment gateways.
Supports: Stripe, EasyPaisa, JazzCash, Cash on Delivery
"""

from django.db import models
from django.conf import settings
import uuid


class Payment(models.Model):
    """Payment record for orders."""
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PROCESSING = 'processing', 'Processing'
        SUCCEEDED = 'succeeded', 'Succeeded'
        FAILED = 'failed', 'Failed'
        REFUNDED = 'refunded', 'Refunded'
    
    class Method(models.TextChoices):
        STRIPE = 'stripe', 'Stripe (Card)'
        EASYPAISA = 'easypaisa', 'EasyPaisa'
        JAZZCASH = 'jazzcash', 'JazzCash'
        COD = 'cod', 'Cash on Delivery'

    order = models.OneToOneField(
        'orders.Order',
        on_delete=models.CASCADE,
        related_name='payment'
    )
    method = models.CharField(
        max_length=20,
        choices=Method.choices,
        default=Method.COD
    )
    transaction_id = models.CharField(max_length=255, unique=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='PKR')
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    
    # Gateway-specific fields
    gateway_response = models.JSONField(default=dict, blank=True)
    redirect_url = models.URLField(blank=True)
    
    # For manual verification (EasyPaisa/JazzCash)
    customer_phone = models.CharField(max_length=20, blank=True)
    reference_number = models.CharField(max_length=100, blank=True, help_text='Customer-provided transaction reference')
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_payments'
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    
    error_message = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.method} - {self.transaction_id} - {self.status}"
    
    def save(self, *args, **kwargs):
        if not self.transaction_id:
            self.transaction_id = f"TXN-{uuid.uuid4().hex[:12].upper()}"
        super().save(*args, **kwargs)


