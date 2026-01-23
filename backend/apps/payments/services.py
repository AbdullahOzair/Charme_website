"""
Service layer for Payments app.
Contains all business logic for payment operations.
"""

from apps.core.base import BaseService
from apps.core.exceptions import BusinessLogicException, PaymentException
from .repositories import PaymentRepository, PaymentLogRepository, RefundRepository
from .models import Payment, PaymentLog, Refund
from apps.orders.repositories import OrderRepository
from apps.orders.models import Order
from typing import Optional, Dict, Any
from decimal import Decimal
from django.conf import settings
from django.utils import timezone
import stripe
import hashlib
import hmac
import json
import requests


class PaymentService(BaseService):
    """Service for payment-related business logic."""
    
    def __init__(self):
        self.repository = PaymentRepository()
        self.log_repository = PaymentLogRepository()
        self.refund_repository = RefundRepository()
        self.order_repository = OrderRepository()
        
        # Initialize Stripe
        stripe.api_key = settings.STRIPE_SECRET_KEY

    def create(self, data: Dict[str, Any]) -> Payment:
        """Create a payment record."""
        order_id = data.get('order_id')
        payment_method = data.get('payment_method')
        
        if not order_id:
            raise PaymentException('Order ID is required')
        
        order = self.order_repository.get_by_id(order_id)
        if not order:
            raise PaymentException('Order not found')
        
        if order.payment_status == Order.PaymentStatus.PAID:
            raise PaymentException('Order is already paid')
        
        return self.repository.create_payment(
            order=order,
            payment_method=payment_method,
            amount=order.total,
            currency='PKR'
        )

    def update(self, id: int, data: Dict[str, Any]) -> Payment:
        """Update payment record."""
        payment = self.repository.get_by_id(id)
        if not payment:
            raise PaymentException('Payment not found')
        
        return self.repository.update(payment, **data)

    def process_payment(
        self,
        order_number: str,
        payment_method: str,
        payment_data: Dict[str, Any],
        request_info: Dict = None
    ) -> Dict[str, Any]:
        """Process payment based on payment method."""
        order = self.order_repository.get_by_order_number(order_number)
        if not order:
            raise PaymentException('Order not found')
        
        if order.payment_status == Order.PaymentStatus.PAID:
            raise PaymentException('Order is already paid')
        
        # Create payment record
        payment = self.repository.create_payment(
            order=order,
            payment_method=payment_method,
            amount=order.total
        )
        
        try:
            if payment_method == Payment.PaymentMethod.STRIPE:
                result = self._process_stripe_payment(payment, payment_data, request_info)
            elif payment_method == Payment.PaymentMethod.EASYPAISA:
                result = self._process_easypaisa_payment(payment, payment_data, request_info)
            elif payment_method == Payment.PaymentMethod.JAZZCASH:
                result = self._process_jazzcash_payment(payment, payment_data, request_info)
            elif payment_method == Payment.PaymentMethod.COD:
                result = self._process_cod_payment(payment, request_info)
            else:
                raise PaymentException(f'Unsupported payment method: {payment_method}')
            
            return result
            
        except Exception as e:
            # Log the error
            self.log_repository.create_log(
                payment=payment,
                action='process_payment_error',
                error_message=str(e),
                is_success=False,
                ip_address=request_info.get('ip_address') if request_info else None
            )
            
            self.repository.update_status(
                payment,
                Payment.PaymentStatus.FAILED,
                error_message=str(e)
            )
            raise

    def _process_stripe_payment(
        self,
        payment: Payment,
        payment_data: Dict,
        request_info: Dict = None
    ) -> Dict[str, Any]:
        """Process Stripe card payment."""
        try:
            # Create payment intent
            intent = stripe.PaymentIntent.create(
                amount=int(payment.amount * 100),  # Stripe uses cents
                currency='pkr',
                payment_method=payment_data.get('payment_method_id'),
                confirm=True,
                automatic_payment_methods={
                    'enabled': True,
                    'allow_redirects': 'never'
                },
                metadata={
                    'order_number': payment.order.order_number,
                    'transaction_id': payment.transaction_id
                }
            )
            
            # Log the request
            self.log_repository.create_log(
                payment=payment,
                action='stripe_payment_intent_create',
                request_data={'payment_method_id': payment_data.get('payment_method_id')},
                response_data={'intent_id': intent.id, 'status': intent.status},
                is_success=True,
                ip_address=request_info.get('ip_address') if request_info else None
            )
            
            # Update payment record
            payment.stripe_payment_intent_id = intent.id
            payment.gateway_transaction_id = intent.id
            payment.save()
            
            if intent.status == 'succeeded':
                self._mark_payment_successful(payment, {'stripe_intent': intent.id})
                return {
                    'success': True,
                    'payment': payment,
                    'message': 'Payment successful'
                }
            elif intent.status == 'requires_action':
                return {
                    'success': False,
                    'requires_action': True,
                    'client_secret': intent.client_secret,
                    'payment': payment
                }
            else:
                raise PaymentException(f'Unexpected payment status: {intent.status}')
                
        except stripe.error.CardError as e:
            raise PaymentException(f'Card error: {e.user_message}', provider='stripe')
        except stripe.error.StripeError as e:
            raise PaymentException(f'Stripe error: {str(e)}', provider='stripe')

    def _process_easypaisa_payment(
        self,
        payment: Payment,
        payment_data: Dict,
        request_info: Dict = None
    ) -> Dict[str, Any]:
        """Process EasyPaisa mobile wallet payment."""
        mobile_number = payment_data.get('mobile_number')
        if not mobile_number:
            raise PaymentException('Mobile number is required for EasyPaisa')
        
        payment.mobile_account_number = mobile_number
        payment.save()
        
        # EasyPaisa API integration
        # This is a simplified example - actual implementation will vary
        easypaisa_payload = {
            'storeId': settings.EASYPAISA_MERCHANT_ID,
            'amount': str(payment.amount),
            'orderRefNum': payment.transaction_id,
            'mobileAccountNo': mobile_number,
            'emailAddress': payment.order.user.email,
        }
        
        # Log the request
        self.log_repository.create_log(
            payment=payment,
            action='easypaisa_initiate',
            request_data=easypaisa_payload,
            is_success=True,
            ip_address=request_info.get('ip_address') if request_info else None
        )
        
        # In production, make actual API call to EasyPaisa
        # For now, return a pending status requiring OTP verification
        return {
            'success': False,
            'requires_otp': True,
            'payment': payment,
            'message': 'Please verify with OTP sent to your mobile'
        }

    def _process_jazzcash_payment(
        self,
        payment: Payment,
        payment_data: Dict,
        request_info: Dict = None
    ) -> Dict[str, Any]:
        """Process JazzCash mobile wallet payment."""
        mobile_number = payment_data.get('mobile_number')
        if not mobile_number:
            raise PaymentException('Mobile number is required for JazzCash')
        
        payment.mobile_account_number = mobile_number
        payment.save()
        
        # JazzCash API integration
        # Generate secure hash for JazzCash
        timestamp = timezone.now().strftime('%Y%m%d%H%M%S')
        
        jazzcash_payload = {
            'pp_MerchantID': settings.JAZZCASH_MERCHANT_ID,
            'pp_Password': settings.JAZZCASH_PASSWORD,
            'pp_Amount': str(int(payment.amount * 100)),  # JazzCash uses paisa
            'pp_TxnRefNo': payment.transaction_id,
            'pp_MobileNumber': mobile_number,
            'pp_CNIC': payment_data.get('cnic_last6', ''),
            'pp_TxnDateTime': timestamp,
            'pp_TxnExpiryDateTime': '',
            'pp_Description': f'Order {payment.order.order_number}',
        }
        
        # Calculate secure hash
        hash_string = '&'.join([
            settings.JAZZCASH_INTEGRITY_SALT,
            jazzcash_payload['pp_Amount'],
            jazzcash_payload['pp_MerchantID'],
            jazzcash_payload['pp_MobileNumber'],
            jazzcash_payload['pp_Password'],
            jazzcash_payload['pp_TxnDateTime'],
            jazzcash_payload['pp_TxnRefNo'],
        ])
        
        secure_hash = hmac.new(
            settings.JAZZCASH_INTEGRITY_SALT.encode(),
            hash_string.encode(),
            hashlib.sha256
        ).hexdigest()
        
        jazzcash_payload['pp_SecureHash'] = secure_hash
        
        # Log the request
        self.log_repository.create_log(
            payment=payment,
            action='jazzcash_initiate',
            request_data={k: v for k, v in jazzcash_payload.items() if k != 'pp_Password'},
            is_success=True,
            ip_address=request_info.get('ip_address') if request_info else None
        )
        
        # In production, make actual API call to JazzCash
        return {
            'success': False,
            'requires_otp': True,
            'payment': payment,
            'message': 'Please verify with OTP sent to your mobile'
        }

    def _process_cod_payment(
        self,
        payment: Payment,
        request_info: Dict = None
    ) -> Dict[str, Any]:
        """Process Cash on Delivery order."""
        # Log the request
        self.log_repository.create_log(
            payment=payment,
            action='cod_initiate',
            request_data={},
            response_data={'status': 'cod_pending'},
            is_success=True,
            ip_address=request_info.get('ip_address') if request_info else None
        )
        
        # Update payment status to COD
        self.repository.update_status(
            payment,
            Payment.PaymentStatus.PENDING,
            gateway_response={'type': 'cod'}
        )
        
        # Update order payment status
        self.order_repository.update_payment_status(
            payment.order,
            Order.PaymentStatus.COD
        )
        
        # Confirm the order
        self.order_repository.update_status(
            payment.order,
            Order.OrderStatus.CONFIRMED,
            'Cash on Delivery order confirmed'
        )
        
        return {
            'success': True,
            'payment': payment,
            'message': 'Order confirmed. Pay on delivery.'
        }

    def _mark_payment_successful(self, payment: Payment, gateway_response: Dict) -> None:
        """Mark payment as successful and update order."""
        self.repository.update_status(
            payment,
            Payment.PaymentStatus.COMPLETED,
            gateway_response=gateway_response
        )
        
        # Update order status
        self.order_repository.update_payment_status(
            payment.order,
            Order.PaymentStatus.PAID
        )
        
        self.order_repository.update_status(
            payment.order,
            Order.OrderStatus.CONFIRMED,
            'Payment received'
        )

    def verify_stripe_webhook(self, payload: bytes, sig_header: str) -> Dict[str, Any]:
        """Verify and process Stripe webhook."""
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
            
            if event['type'] == 'payment_intent.succeeded':
                intent = event['data']['object']
                payment = self.repository.get_by_stripe_intent(intent['id'])
                if payment:
                    self._mark_payment_successful(payment, {'stripe_event': event['id']})
            
            elif event['type'] == 'payment_intent.payment_failed':
                intent = event['data']['object']
                payment = self.repository.get_by_stripe_intent(intent['id'])
                if payment:
                    self.repository.update_status(
                        payment,
                        Payment.PaymentStatus.FAILED,
                        error_message=intent.get('last_payment_error', {}).get('message', 'Payment failed')
                    )
            
            return {'success': True, 'event_type': event['type']}
            
        except stripe.error.SignatureVerificationError:
            raise PaymentException('Invalid webhook signature', provider='stripe')

    def process_refund(
        self,
        payment_id: int,
        amount: Decimal,
        reason: str,
        processed_by=None
    ) -> Refund:
        """Process a refund for a payment."""
        payment = self.repository.get_by_id(payment_id)
        if not payment:
            raise PaymentException('Payment not found')
        
        if not payment.is_refundable:
            raise PaymentException('Payment is not refundable')
        
        if amount > payment.remaining_refundable:
            raise PaymentException(
                f'Refund amount exceeds remaining refundable amount of Rs. {payment.remaining_refundable}'
            )
        
        # Create refund record
        refund = self.refund_repository.create_refund(
            payment=payment,
            amount=amount,
            reason=reason,
            processed_by=processed_by
        )
        
        try:
            if payment.payment_method == Payment.PaymentMethod.STRIPE:
                self._process_stripe_refund(payment, refund, amount)
            # Add other payment method refunds as needed
            
            # Update refund status
            self.refund_repository.update_refund_status(
                refund,
                Refund.RefundStatus.COMPLETED
            )
            
            # Update payment refunded amount
            payment.refunded_amount += amount
            if payment.refunded_amount >= payment.amount:
                payment.status = Payment.PaymentStatus.REFUNDED
            else:
                payment.status = Payment.PaymentStatus.PARTIALLY_REFUNDED
            payment.save()
            
            return refund
            
        except Exception as e:
            self.refund_repository.update_refund_status(
                refund,
                Refund.RefundStatus.FAILED,
                gateway_response={'error': str(e)}
            )
            raise PaymentException(f'Refund failed: {str(e)}')

    def _process_stripe_refund(self, payment: Payment, refund: Refund, amount: Decimal) -> None:
        """Process Stripe refund."""
        stripe_refund = stripe.Refund.create(
            payment_intent=payment.stripe_payment_intent_id,
            amount=int(amount * 100)
        )
        
        refund.gateway_refund_id = stripe_refund.id
        refund.save()

    def get_payment_status(self, transaction_id: str) -> Optional[Dict[str, Any]]:
        """Get payment status by transaction ID."""
        payment = self.repository.get_by_transaction_id(transaction_id)
        if not payment:
            return None
        
        return {
            'transaction_id': payment.transaction_id,
            'status': payment.status,
            'amount': payment.amount,
            'payment_method': payment.payment_method,
            'order_number': payment.order.order_number
        }
