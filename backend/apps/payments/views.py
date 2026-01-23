"""
Payment views for multiple gateways.
Supports: Stripe, EasyPaisa, JazzCash, Cash on Delivery
"""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from django.conf import settings
from django.utils import timezone
from django.shortcuts import get_object_or_404
import stripe
import hashlib
import hmac
import json
import datetime

from .models import Payment
from .serializers import (
    PaymentSerializer,
    InitiatePaymentSerializer,
    ManualVerificationSerializer,
    CODPaymentSerializer,
)
from apps.orders.models import Order


# =============================================================================
# STRIPE PAYMENT VIEWS
# =============================================================================

class StripePaymentView(APIView):
    """Create Stripe payment intent."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = InitiatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        order_id = serializer.validated_data['order_id']
        order = get_object_or_404(Order, id=order_id, user=request.user)
        
        if hasattr(order, 'payment'):
            return Response(
                {'error': 'Payment already exists for this order'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        stripe.api_key = settings.STRIPE_SECRET_KEY
        
        try:
            intent = stripe.PaymentIntent.create(
                amount=int(order.total * 100),
                currency='pkr',
                metadata={'order_id': order.id}
            )
            
            payment = Payment.objects.create(
                order=order,
                method=Payment.Method.STRIPE,
                transaction_id=intent.id,
                amount=order.total,
                currency='PKR',
                status=Payment.Status.PENDING,
                gateway_response={'client_secret': intent.client_secret}
            )
            
            return Response({
                'payment_id': payment.id,
                'client_secret': intent.client_secret,
                'transaction_id': payment.transaction_id
            })
            
        except stripe.error.StripeError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class StripeWebhookView(APIView):
    """Handle Stripe webhooks."""
    permission_classes = [AllowAny]

    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except stripe.error.SignatureVerificationError:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        if event['type'] == 'payment_intent.succeeded':
            intent = event['data']['object']
            self._handle_success(intent['id'])
        elif event['type'] == 'payment_intent.payment_failed':
            intent = event['data']['object']
            self._handle_failure(intent['id'], intent.get('last_payment_error', {}).get('message', ''))

        return Response({'status': 'success'})
    
    def _handle_success(self, transaction_id):
        try:
            payment = Payment.objects.get(transaction_id=transaction_id)
            payment.status = Payment.Status.SUCCEEDED
            payment.save()
            payment.order.status = Order.Status.PAID
            payment.order.save()
        except Payment.DoesNotExist:
            pass
    
    def _handle_failure(self, transaction_id, error_msg):
        try:
            payment = Payment.objects.get(transaction_id=transaction_id)
            payment.status = Payment.Status.FAILED
            payment.error_message = error_msg
            payment.save()
        except Payment.DoesNotExist:
            pass


# =============================================================================
# EASYPAISA PAYMENT VIEWS
# =============================================================================

class EasyPaisaPaymentView(APIView):
    """Initiate EasyPaisa payment."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = InitiatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        order_id = serializer.validated_data['order_id']
        phone = serializer.validated_data.get('phone', '')
        order = get_object_or_404(Order, id=order_id, user=request.user)
        
        if hasattr(order, 'payment'):
            return Response(
                {'error': 'Payment already exists for this order'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        payment = Payment.objects.create(
            order=order,
            method=Payment.Method.EASYPAISA,
            amount=order.total,
            currency='PKR',
            status=Payment.Status.PENDING,
            customer_phone=phone
        )
        
        # Build EasyPaisa redirect URL
        redirect_url = self._build_redirect_url(payment, order)
        payment.redirect_url = redirect_url
        payment.save()
        
        return Response({
            'payment_id': payment.id,
            'transaction_id': payment.transaction_id,
            'redirect_url': redirect_url,
            'instructions': 'Complete payment on EasyPaisa and provide transaction reference for verification.'
        })
    
    def _build_redirect_url(self, payment, order):
        """Build EasyPaisa payment URL."""
        merchant_id = settings.EASYPAISA_MERCHANT_ID
        # EasyPaisa sandbox/production URL
        base_url = getattr(settings, 'EASYPAISA_BASE_URL', 'https://easypay.easypaisa.com.pk/easypay/Index.jsf')
        
        timestamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
        
        # Create hash for integrity (example - adjust per actual EasyPaisa docs)
        hash_string = f"{merchant_id}{payment.transaction_id}{payment.amount}{timestamp}"
        hash_key = settings.EASYPAISA_MERCHANT_KEY
        signature = hashlib.sha256(f"{hash_string}{hash_key}".encode()).hexdigest()
        
        return (
            f"{base_url}?"
            f"storeId={merchant_id}&"
            f"orderId={payment.transaction_id}&"
            f"transactionAmount={payment.amount}&"
            f"transactionType=MA&"
            f"mobileAccountNo={payment.customer_phone}&"
            f"emailAddress={order.user.email}&"
            f"signature={signature}"
        )


class EasyPaisaCallbackView(APIView):
    """Handle EasyPaisa callback/redirect."""
    permission_classes = [AllowAny]

    def get(self, request):
        """Handle redirect from EasyPaisa."""
        order_id = request.GET.get('orderId')
        status_code = request.GET.get('status')
        
        if not order_id:
            return Response({'error': 'Missing order ID'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            payment = Payment.objects.get(transaction_id=order_id)
            
            if status_code == '0000':  # Success code
                payment.status = Payment.Status.PROCESSING
                payment.gateway_response = dict(request.GET)
            else:
                payment.status = Payment.Status.FAILED
                payment.error_message = f"EasyPaisa status: {status_code}"
            
            payment.save()
            
            # Redirect to frontend with status
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            return Response({
                'status': payment.status,
                'redirect': f"{frontend_url}/orders/{payment.order.id}?payment_status={payment.status}"
            })
            
        except Payment.DoesNotExist:
            return Response({'error': 'Payment not found'}, status=status.HTTP_404_NOT_FOUND)


# =============================================================================
# JAZZCASH PAYMENT VIEWS
# =============================================================================

class JazzCashPaymentView(APIView):
    """Initiate JazzCash payment."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = InitiatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        order_id = serializer.validated_data['order_id']
        phone = serializer.validated_data.get('phone', '')
        order = get_object_or_404(Order, id=order_id, user=request.user)
        
        if hasattr(order, 'payment'):
            return Response(
                {'error': 'Payment already exists for this order'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        payment = Payment.objects.create(
            order=order,
            method=Payment.Method.JAZZCASH,
            amount=order.total,
            currency='PKR',
            status=Payment.Status.PENDING,
            customer_phone=phone
        )
        
        # Build JazzCash form data
        form_data = self._build_form_data(payment, order)
        
        return Response({
            'payment_id': payment.id,
            'transaction_id': payment.transaction_id,
            'form_data': form_data,
            'post_url': getattr(settings, 'JAZZCASH_POST_URL', 'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform'),
            'instructions': 'Submit form data to JazzCash URL. After payment, provide transaction reference for verification.'
        })
    
    def _build_form_data(self, payment, order):
        """Build JazzCash HMAC-signed form data."""
        merchant_id = settings.JAZZCASH_MERCHANT_ID
        password = settings.JAZZCASH_PASSWORD
        integrity_salt = settings.JAZZCASH_INTEGRITY_SALT
        
        timestamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
        expiry = (datetime.datetime.now() + datetime.timedelta(hours=1)).strftime('%Y%m%d%H%M%S')
        
        form_data = {
            'pp_Version': '1.1',
            'pp_TxnType': 'MWALLET',
            'pp_Language': 'EN',
            'pp_MerchantID': merchant_id,
            'pp_Password': password,
            'pp_TxnRefNo': payment.transaction_id,
            'pp_Amount': str(int(payment.amount * 100)),  # In paisa
            'pp_TxnCurrency': 'PKR',
            'pp_TxnDateTime': timestamp,
            'pp_TxnExpiryDateTime': expiry,
            'pp_BillReference': f"ORDER-{order.id}",
            'pp_Description': f"Charmé Order #{order.id}",
            'pp_ReturnURL': f"{getattr(settings, 'BACKEND_URL', 'http://localhost:8000')}/api/v1/payments/jazzcash/callback/",
        }
        
        # Create HMAC signature
        hash_string = '&'.join([f"{v}" for k, v in sorted(form_data.items()) if v])
        hash_string = f"{integrity_salt}&{hash_string}"
        
        signature = hmac.new(
            integrity_salt.encode(),
            hash_string.encode(),
            hashlib.sha256
        ).hexdigest()
        
        form_data['pp_SecureHash'] = signature
        
        payment.gateway_response = form_data
        payment.save()
        
        return form_data


class JazzCashCallbackView(APIView):
    """Handle JazzCash callback."""
    permission_classes = [AllowAny]

    def post(self, request):
        """Handle POST callback from JazzCash."""
        txn_ref = request.data.get('pp_TxnRefNo')
        response_code = request.data.get('pp_ResponseCode')
        
        if not txn_ref:
            return Response({'error': 'Missing transaction reference'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            payment = Payment.objects.get(transaction_id=txn_ref)
            payment.gateway_response = dict(request.data)
            
            if response_code == '000':  # Success
                payment.status = Payment.Status.PROCESSING
                payment.reference_number = request.data.get('pp_RetrievalReferenceNo', '')
            else:
                payment.status = Payment.Status.FAILED
                payment.error_message = request.data.get('pp_ResponseMessage', 'Payment failed')
            
            payment.save()
            
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            return Response({
                'status': payment.status,
                'redirect': f"{frontend_url}/orders/{payment.order.id}?payment_status={payment.status}"
            })
            
        except Payment.DoesNotExist:
            return Response({'error': 'Payment not found'}, status=status.HTTP_404_NOT_FOUND)


# =============================================================================
# CASH ON DELIVERY VIEWS
# =============================================================================

class CODPaymentView(APIView):
    """Create Cash on Delivery payment."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CODPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        order_id = serializer.validated_data['order_id']
        phone = serializer.validated_data.get('phone', '')
        order = get_object_or_404(Order, id=order_id, user=request.user)
        
        if hasattr(order, 'payment'):
            return Response(
                {'error': 'Payment already exists for this order'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        payment = Payment.objects.create(
            order=order,
            method=Payment.Method.COD,
            amount=order.total,
            currency='PKR',
            status=Payment.Status.PENDING,
            customer_phone=phone,
            notes=serializer.validated_data.get('notes', '')
        )
        
        # COD orders go to PENDING status - paid when delivered
        order.status = Order.Status.PENDING
        order.save()
        
        return Response({
            'payment_id': payment.id,
            'transaction_id': payment.transaction_id,
            'status': 'pending',
            'message': 'Cash on Delivery order confirmed. Pay when you receive your order.'
        })


# =============================================================================
# MANUAL VERIFICATION (Admin)
# =============================================================================

class ManualVerificationView(APIView):
    """Manually verify payment (for EasyPaisa/JazzCash)."""
    permission_classes = [IsAdminUser]

    def post(self, request, payment_id):
        serializer = ManualVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        payment = get_object_or_404(Payment, id=payment_id)
        
        if payment.status == Payment.Status.SUCCEEDED:
            return Response(
                {'error': 'Payment already verified'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        action = serializer.validated_data['action']
        reference = serializer.validated_data.get('reference_number', '')
        notes = serializer.validated_data.get('notes', '')
        
        if action == 'approve':
            payment.status = Payment.Status.SUCCEEDED
            payment.reference_number = reference
            payment.verified_by = request.user
            payment.verified_at = timezone.now()
            payment.notes = notes
            payment.save()
            
            # Update order status
            payment.order.status = Order.Status.PAID
            payment.order.save()
            
            return Response({
                'status': 'approved',
                'payment_id': payment.id,
                'order_status': payment.order.status
            })
        
        elif action == 'reject':
            payment.status = Payment.Status.FAILED
            payment.error_message = notes or 'Payment rejected by admin'
            payment.verified_by = request.user
            payment.verified_at = timezone.now()
            payment.save()
            
            return Response({
                'status': 'rejected',
                'payment_id': payment.id
            })
        
        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)


# =============================================================================
# COMMON VIEWS
# =============================================================================

class PaymentStatusView(APIView):
    """Get payment status."""
    permission_classes = [IsAuthenticated]

    def get(self, request, payment_id):
        payment = get_object_or_404(Payment, id=payment_id)
        
        # Check ownership
        if payment.order.user != request.user and not request.user.is_staff:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return Response(PaymentSerializer(payment).data)


class PendingPaymentsView(APIView):
    """List pending payments for admin verification."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        pending = Payment.objects.filter(
            status__in=[Payment.Status.PENDING, Payment.Status.PROCESSING],
            method__in=[Payment.Method.EASYPAISA, Payment.Method.JAZZCASH]
        ).select_related('order', 'order__user').order_by('-created_at')
        
        return Response(PaymentSerializer(pending, many=True).data)

