"""
URL configuration for Cart app.
"""

from django.urls import path
from .views import (
    CartView, CartItemView, ApplyCouponView,
    CartSummaryView, MergeCartView
)

urlpatterns = [
    path('', CartView.as_view(), name='cart'),
    path('item/<int:product_id>/', CartItemView.as_view(), name='cart_item'),
    path('apply-coupon/', ApplyCouponView.as_view(), name='apply_coupon'),
    path('summary/', CartSummaryView.as_view(), name='cart_summary'),
    path('merge/', MergeCartView.as_view(), name='merge_cart'),
]
