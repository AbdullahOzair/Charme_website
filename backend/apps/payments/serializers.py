"""
Payment serializers for multiple gateways.
"""

from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    """Full payment details."""
    order_id = serializers.IntegerField(source='order.id', read_only=True)
    method_display = serializers.CharField(source='get_method_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'order_id', 'method', 'method_display',
            'transaction_id', 'amount', 'currency',
            'status', 'status_display', 'customer_phone',
            'reference_number', 'verified_at', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = fields


class InitiatePaymentSerializer(serializers.Serializer):
    """Initiate payment request."""
    order_id = serializers.IntegerField()
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)


class CODPaymentSerializer(serializers.Serializer):
    """Cash on Delivery payment request."""
    order_id = serializers.IntegerField()
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    notes = serializers.CharField(max_length=500, required=False, allow_blank=True)


class ManualVerificationSerializer(serializers.Serializer):
    """Manual payment verification (admin)."""
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    reference_number = serializers.CharField(max_length=100, required=False, allow_blank=True)
    notes = serializers.CharField(max_length=500, required=False, allow_blank=True)

