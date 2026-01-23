"""
API Views for Cart app.
"""

from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.authentication import SessionAuthentication
from decimal import Decimal

from .models import Cart, CartItem, Coupon
from .serializers import (
    CartSerializer, CartItemSerializer, CartSummarySerializer,
    AddToCartSerializer, UpdateCartItemSerializer, ApplyCouponSerializer,
    CouponSerializer
)
from .services import CartService, CouponService
from apps.products.models import Product
from apps.core.models import StoreSettings


def get_cart(request):
    """Get or create cart for current user/session."""
    if request.user.is_authenticated:
        cart, _ = Cart.objects.get_or_create(user=request.user)
    else:
        session_id = request.session.session_key
        if not session_id:
            request.session.create()
            session_id = request.session.session_key
        
        cart, _ = Cart.objects.get_or_create(
            session_id=session_id,
            user__isnull=True
        )
    return cart


class CartView(generics.GenericAPIView):
    """Cart operations endpoint."""
    authentication_classes = []  # Allow anonymous access
    permission_classes = [AllowAny]
    
    def get(self, request, *args, **kwargs):
        """Get current cart."""
        cart = get_cart(request)
        serializer = CartSerializer(cart)
        
        # Calculate summary
        items = list(cart.items.select_related('product', 'product__category').all())
        subtotal = sum(item.total_price for item in items)
        
        # Get shipping settings from admin
        settings = StoreSettings.get_settings()
        shipping_threshold = settings.free_shipping_threshold
        shipping_cost = Decimal('0') if subtotal >= shipping_threshold else settings.shipping_cost
        
        return Response({
            'success': True,
            'data': {
                'cart': serializer.data,
                'summary': {
                    'item_count': len(items),
                    'subtotal': str(subtotal),
                    'shipping_cost': str(shipping_cost),
                    'free_shipping_threshold': str(shipping_threshold),
                    'total': str(subtotal + shipping_cost)
                }
            }
        })
    
    def post(self, request, *args, **kwargs):
        """Add item to cart."""
        serializer = AddToCartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        product_id = serializer.validated_data['product_id']
        quantity = serializer.validated_data['quantity']
        
        # Check if product exists
        try:
            product = Product.objects.get(id=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Product not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        cart = get_cart(request)
        
        # Check stock
        existing_item = cart.items.filter(product=product).first()
        total_quantity = quantity + (existing_item.quantity if existing_item else 0)
        
        if product.stock_quantity < total_quantity:
            return Response({
                'success': False,
                'error': f'Only {product.stock_quantity} items available in stock'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Add or update cart item
        if existing_item:
            existing_item.quantity = total_quantity
            existing_item.save()
            item = existing_item
        else:
            item = CartItem.objects.create(
                cart=cart,
                product=product,
                quantity=quantity,
                price_at_addition=product.price
            )
        
        return Response({
            'success': True,
            'message': 'Item added to cart',
            'data': CartItemSerializer(item).data
        }, status=status.HTTP_201_CREATED)
    
    def delete(self, request, *args, **kwargs):
        """Clear cart."""
        cart = get_cart(request)
        cart.items.all().delete()
        
        return Response({
            'success': True,
            'message': 'Cart cleared'
        })


class CartItemView(generics.GenericAPIView):
    """Cart item operations endpoint."""
    authentication_classes = []  # Allow anonymous access
    permission_classes = [AllowAny]
    
    def patch(self, request, product_id, *args, **kwargs):
        """Update cart item quantity."""
        serializer = UpdateCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        cart = get_cart(request)
        
        try:
            item = cart.items.select_related('product').get(product_id=product_id)
        except CartItem.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Item not found in cart'
            }, status=status.HTTP_404_NOT_FOUND)
        
        quantity = serializer.validated_data['quantity']
        
        # Check stock
        if item.product.stock_quantity < quantity:
            return Response({
                'success': False,
                'error': f'Only {item.product.stock_quantity} items available in stock'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        item.quantity = quantity
        item.save()
        
        return Response({
            'success': True,
            'message': 'Cart updated',
            'data': CartItemSerializer(item).data
        })
    
    def delete(self, request, product_id, *args, **kwargs):
        """Remove item from cart."""
        cart = get_cart(request)
        
        deleted, _ = cart.items.filter(product_id=product_id).delete()
        
        if deleted:
            return Response({
                'success': True,
                'message': 'Item removed from cart'
            })
        
        return Response({
            'success': False,
            'error': 'Item not found in cart'
        }, status=status.HTTP_404_NOT_FOUND)


class ApplyCouponView(generics.GenericAPIView):
    """Apply coupon to cart."""
    authentication_classes = []  # Allow anonymous access
    permission_classes = [AllowAny]
    serializer_class = ApplyCouponSerializer
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        code = serializer.validated_data['code'].upper().strip()
        cart = get_cart(request)
        
        # Get cart subtotal
        subtotal = sum(item.total_price for item in cart.items.all())
        
        if subtotal == 0:
            return Response({
                'success': False,
                'error': 'Cart is empty'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate coupon
        coupon_service = CouponService()
        result = coupon_service.validate_coupon(code, subtotal, request.user if request.user.is_authenticated else None)
        
        if not result['valid']:
            return Response({
                'success': False,
                'error': result['error']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        coupon = result['coupon']
        discount = result['discount']
        
        return Response({
            'success': True,
            'message': 'Coupon applied successfully',
            'data': {
                'coupon': CouponSerializer(coupon).data,
                'discount': str(discount),
                'subtotal': str(subtotal),
                'new_subtotal': str(subtotal - discount)
            }
        })


class CartSummaryView(generics.GenericAPIView):
    """Get detailed cart summary."""
    authentication_classes = []  # Allow anonymous access
    permission_classes = [AllowAny]
    
    def get(self, request, *args, **kwargs):
        cart = get_cart(request)
        coupon_code = request.query_params.get('coupon', '')
        
        items = list(cart.items.select_related(
            'product', 'product__category'
        ).prefetch_related('product__images').all())
        
        subtotal = sum(item.total_price for item in items)
        discount = Decimal('0')
        coupon = None
        
        # Apply coupon if provided
        if coupon_code:
            coupon_service = CouponService()
            result = coupon_service.validate_coupon(
                coupon_code, subtotal,
                request.user if request.user.is_authenticated else None
            )
            if result['valid']:
                discount = result['discount']
                coupon = result['coupon']
        
        # Get shipping settings from admin
        settings = StoreSettings.get_settings()
        shipping_threshold = settings.free_shipping_threshold
        shipping_cost = Decimal('0') if subtotal >= shipping_threshold else settings.shipping_cost
        
        # Check for free shipping coupon
        if coupon and coupon.discount_type == 'free_shipping':
            shipping_cost = Decimal('0')
        
        total = subtotal - discount + shipping_cost
        
        return Response({
            'success': True,
            'data': {
                'items': CartItemSerializer(items, many=True).data,
                'item_count': len(items),
                'subtotal': str(subtotal),
                'discount': str(discount),
                'coupon': CouponSerializer(coupon).data if coupon else None,
                'shipping_cost': str(shipping_cost),
                'free_shipping_threshold': str(shipping_threshold),
                'total': str(total)
            }
        })


class MergeCartView(generics.GenericAPIView):
    """Merge session cart with user cart after login."""
    authentication_classes = []  # Allow anonymous access
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response({
                'success': False,
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        session_id = request.data.get('session_id') or request.session.session_key
        
        if not session_id:
            return Response({
                'success': True,
                'message': 'No session cart to merge'
            })
        
        cart_service = CartService()
        cart = cart_service.merge_carts(request.user, session_id)
        
        return Response({
            'success': True,
            'message': 'Carts merged successfully',
            'data': CartSerializer(cart).data
        })
