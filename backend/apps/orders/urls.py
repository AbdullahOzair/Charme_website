"""
URL configuration for Cart and Orders.
"""

from django.urls import path
from .views import (
    CartView, CartItemView, AddCustomDesignToCartView,
    OrderListCreateView, OrderDetailView,
    CartSummaryView, ApplyCouponView
)

urlpatterns = [
    # Cart
    path('cart/', CartView.as_view(), name='cart'),
    path('cart/items/<int:pk>/', CartItemView.as_view(), name='cart-item'),
    path('cart/custom/', AddCustomDesignToCartView.as_view(), name='cart-custom-design'),
    path('cart/summary/', CartSummaryView.as_view(), name='cart-summary'),
    path('cart/apply-coupon/', ApplyCouponView.as_view(), name='apply-coupon'),
    
    # Orders
    path('orders/', OrderListCreateView.as_view(), name='order-list'),
    path('orders/<str:order_number>/', OrderDetailView.as_view(), name='order-detail'),
]

