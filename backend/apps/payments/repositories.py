"""
Repository layer for Payments app.
Handles all database operations for Payment, PaymentLog, and Refund models.
"""

from apps.core.base import BaseRepository
from .models import Payment, PaymentLog, Refund
from typing import Optional, Dict, Any
from django.db.models import QuerySet, Sum
from django.utils import timezone
from decimal import Decimal
import uuid


class PaymentRepository(BaseRepository):
    """Repository for Payment model operations."""
    model = Payment

    def get_by_transaction_id(self, transaction_id: str) -> Optional[Payment]:
        """Get payment by transaction ID."""
        try:
            return self.model.objects.select_related('order').get(
                transaction_id=transaction_id
            )
        except self.model.DoesNotExist:
            return None

    def get_order_payments(self, order) -> QuerySet[Payment]:
        """Get all payments for an order."""
        return self.model.objects.filter(order=order).order_by('-created_at')

    def get_successful_payment(self, order) -> Optional[Payment]:
        """Get successful payment for an order."""
        return self.model.objects.filter(
            order=order,
            status=Payment.PaymentStatus.COMPLETED
        ).first()

    def get_by_stripe_intent(self, payment_intent_id: str) -> Optional[Payment]:
        """Get payment by Stripe payment intent ID."""
        try:
            return self.model.objects.get(stripe_payment_intent_id=payment_intent_id)
        except self.model.DoesNotExist:
            return None

    def get_by_gateway_id(self, gateway_transaction_id: str) -> Optional[Payment]:
        """Get payment by gateway transaction ID."""
        try:
            return self.model.objects.get(gateway_transaction_id=gateway_transaction_id)
        except self.model.DoesNotExist:
            return None

    def update_status(
        self,
        payment: Payment,
        status: str,
        gateway_response: Dict = None,
        error_message: str = ''
    ) -> Payment:
        """Update payment status."""
        payment.status = status
        
        if gateway_response:
            payment.gateway_response = gateway_response
        
        if status == Payment.PaymentStatus.COMPLETED:
            payment.completed_at = timezone.now()
        elif status == Payment.PaymentStatus.FAILED:
            payment.failed_at = timezone.now()
            payment.error_message = error_message
        
        payment.save()
        return payment

    def create_payment(
        self,
        order,
        payment_method: str,
        amount: Decimal,
        **kwargs
    ) -> Payment:
        """Create a new payment record."""
        return self.model.objects.create(
            order=order,
            payment_method=payment_method,
            amount=amount,
            **kwargs
        )

    def get_payments_by_method(
        self,
        payment_method: str,
        status: str = None
    ) -> QuerySet[Payment]:
        """Get payments by payment method."""
        queryset = self.model.objects.filter(payment_method=payment_method)
        if status:
            queryset = queryset.filter(status=status)
        return queryset.order_by('-created_at')

    def get_payment_statistics(self, days: int = 30) -> Dict[str, Any]:
        """Get payment statistics."""
        from datetime import timedelta
        start_date = timezone.now() - timedelta(days=days)
        
        payments = self.model.objects.filter(
            created_at__gte=start_date,
            status=Payment.PaymentStatus.COMPLETED
        )
        
        stats = {
            'total_amount': payments.aggregate(total=Sum('amount'))['total'] or Decimal('0'),
            'total_transactions': payments.count(),
        }
        
        # By payment method
        method_breakdown = {}
        for method in Payment.PaymentMethod.choices:
            method_payments = payments.filter(payment_method=method[0])
            method_breakdown[method[0]] = {
                'count': method_payments.count(),
                'amount': method_payments.aggregate(total=Sum('amount'))['total'] or Decimal('0')
            }
        
        stats['by_method'] = method_breakdown
        return stats


class PaymentLogRepository(BaseRepository):
    """Repository for PaymentLog model operations."""
    model = PaymentLog

    def create_log(
        self,
        payment: Payment,
        action: str,
        request_data: Dict = None,
        response_data: Dict = None,
        is_success: bool = False,
        error_message: str = '',
        ip_address: str = None,
        user_agent: str = ''
    ) -> PaymentLog:
        """Create a payment log entry."""
        return self.model.objects.create(
            payment=payment,
            action=action,
            request_data=request_data or {},
            response_data=response_data or {},
            is_success=is_success,
            error_message=error_message,
            ip_address=ip_address,
            user_agent=user_agent
        )

    def get_payment_logs(self, payment: Payment) -> QuerySet[PaymentLog]:
        """Get all logs for a payment."""
        return self.model.objects.filter(payment=payment).order_by('-created_at')


class RefundRepository(BaseRepository):
    """Repository for Refund model operations."""
    model = Refund

    def create_refund(
        self,
        payment: Payment,
        amount: Decimal,
        reason: str,
        processed_by=None
    ) -> Refund:
        """Create a refund record."""
        refund_id = f"REF-{uuid.uuid4().hex[:12].upper()}"
        return self.model.objects.create(
            payment=payment,
            refund_id=refund_id,
            amount=amount,
            reason=reason,
            processed_by=processed_by
        )

    def get_payment_refunds(self, payment: Payment) -> QuerySet[Refund]:
        """Get all refunds for a payment."""
        return self.model.objects.filter(payment=payment).order_by('-created_at')

    def update_refund_status(
        self,
        refund: Refund,
        status: str,
        gateway_response: Dict = None
    ) -> Refund:
        """Update refund status."""
        refund.status = status
        
        if gateway_response:
            refund.gateway_response = gateway_response
        
        if status == Refund.RefundStatus.COMPLETED:
            refund.completed_at = timezone.now()
            # Update payment refunded amount
            refund.payment.refunded_amount += refund.amount
            refund.payment.save()
        
        refund.save()
        return refund

    def get_total_refunded(self, payment: Payment) -> Decimal:
        """Get total refunded amount for a payment."""
        return self.model.objects.filter(
            payment=payment,
            status=Refund.RefundStatus.COMPLETED
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
