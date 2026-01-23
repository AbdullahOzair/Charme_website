"""
Payment URLs for multiple gateways.
"""

from django.urls import path
from . import views

app_name = 'payments'

urlpatterns = [
    # Stripe
    path('stripe/', views.StripePaymentView.as_view(), name='stripe-create'),
    path('stripe/webhook/', views.StripeWebhookView.as_view(), name='stripe-webhook'),
    
    # EasyPaisa
    path('easypaisa/', views.EasyPaisaPaymentView.as_view(), name='easypaisa-create'),
    path('easypaisa/callback/', views.EasyPaisaCallbackView.as_view(), name='easypaisa-callback'),
    
    # JazzCash
    path('jazzcash/', views.JazzCashPaymentView.as_view(), name='jazzcash-create'),
    path('jazzcash/callback/', views.JazzCashCallbackView.as_view(), name='jazzcash-callback'),
    
    # Cash on Delivery
    path('cod/', views.CODPaymentView.as_view(), name='cod-create'),
    
    # Admin verification
    path('verify/<int:payment_id>/', views.ManualVerificationView.as_view(), name='manual-verify'),
    path('pending/', views.PendingPaymentsView.as_view(), name='pending-list'),
    
    # Status
    path('<int:payment_id>/status/', views.PaymentStatusView.as_view(), name='status'),
]

