"""
Views for Cart and Order APIs.
"""

from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.authentication import SessionAuthentication
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from decimal import Decimal

from .models import Cart, CartItem, Order, OrderItem
from .serializers import (
    CartSerializer, CartItemSerializer, AddToCartSerializer, UpdateCartItemSerializer,
    OrderSerializer, CreateOrderSerializer, AddCustomDesignToCartSerializer
)
from apps.products.models import Product
from apps.core.models import StoreSettings
from apps.cart.models import Coupon
from apps.cart.serializers import CouponSerializer


def get_cart(request):
    """Get or create cart for user/session, merging guest cart if needed."""
    import logging
    logger = logging.getLogger(__name__)
    
    if request.user.is_authenticated:
        # Get or create user cart
        user_cart, created = Cart.objects.get_or_create(user=request.user)
        
        session_id = request.session.session_key
        logger.info(f"Authenticated user {request.user.id}, session: {session_id}, user cart created: {created}")
        
        # Try to merge guest cart (whether user cart was just created or not)
        if session_id:
            try:
                # Find guest cart from session
                guest_cart = Cart.objects.get(session_id=session_id, user__isnull=True)
                logger.info(f"Found guest cart {guest_cart.id} with {guest_cart.items.count()} items")
                
                # Merge items from guest cart to user cart
                merged_count = 0
                for guest_item in guest_cart.items.all():
                    user_item, item_created = CartItem.objects.get_or_create(
                        cart=user_cart,
                        product=guest_item.product,
                        defaults={'quantity': guest_item.quantity}
                    )
                    if not item_created:
                        # Item already exists, add quantities
                        user_item.quantity += guest_item.quantity
                        user_item.save()
                    merged_count += 1
                
                logger.info(f"Merged {merged_count} items from guest cart to user cart")
                # Delete guest cart after merge
                guest_cart.delete()
                
            except Cart.DoesNotExist:
                logger.info("No guest cart found to merge")
        else:
            logger.info("No session ID available for merge")
        
        return user_cart
    else:
        session_id = request.session.session_key
        if not session_id:
            request.session.create()
            session_id = request.session.session_key
        cart, _ = Cart.objects.get_or_create(session_id=session_id, user__isnull=True)
        logger.info(f"Guest cart {cart.id}, session: {session_id}, items: {cart.items.count()}")
        return cart


# =============================================================================
# CSRF-Exempt Session Authentication for Cart (allows guest users)
# =============================================================================

class CsrfExemptSessionAuthentication(SessionAuthentication):
    """Session auth without CSRF enforcement for cart API."""
    def enforce_csrf(self, request):
        return  # Skip CSRF check


# =============================================================================
# CART VIEWS
# =============================================================================

class CartView(APIView):
    """
    GET  /api/v1/cart/     - Get cart
    POST /api/v1/cart/     - Add to cart
    DELETE /api/v1/cart/   - Clear cart
    """
    authentication_classes = [JWTAuthentication, CsrfExemptSessionAuthentication]
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Get current cart."""
        cart = get_cart(request)
        serializer = CartSerializer(cart, context={'request': request})
        return Response(serializer.data)
    
    def post(self, request):
        """Add product to cart."""
        serializer = AddToCartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        cart = get_cart(request)
        product = Product.objects.get(id=serializer.validated_data['product_id'])
        quantity = serializer.validated_data['quantity']
        
        # Check stock
        if product.stock < quantity:
            return Response(
                {'error': f'Only {product.stock} items available'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Add or update cart item
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={'quantity': quantity}
        )
        
        if not created:
            cart_item.quantity += quantity
            if cart_item.quantity > product.stock:
                return Response(
                    {'error': f'Only {product.stock} items available'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            cart_item.save()
        
        return Response(CartSerializer(cart, context={'request': request}).data, status=status.HTTP_201_CREATED)
    
    def delete(self, request):
        """Clear cart."""
        cart = get_cart(request)
        cart.items.all().delete()
        return Response({'message': 'Cart cleared'})


class CartItemView(APIView):
    """
    PATCH  /api/v1/cart/items/{id}/  - Update quantity
    DELETE /api/v1/cart/items/{id}/  - Remove item
    """
    authentication_classes = [JWTAuthentication, CsrfExemptSessionAuthentication]
    permission_classes = [AllowAny]
    
    def patch(self, request, pk):
        """Update cart item quantity."""
        cart = get_cart(request)
        
        try:
            item = cart.items.get(pk=pk)
        except CartItem.DoesNotExist:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = UpdateCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        quantity = serializer.validated_data['quantity']
        
        if quantity > item.product.stock:
            return Response(
                {'error': f'Only {item.product.stock} items available'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        item.quantity = quantity
        item.save()
        
        return Response(CartSerializer(cart).data)
    
    def delete(self, request, pk):
        """Remove item from cart."""
        cart = get_cart(request)

        try:
            item = cart.items.get(pk=pk)
            item.delete()
        except CartItem.DoesNotExist:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)

        return Response(CartSerializer(cart).data)


class AddCustomDesignToCartView(APIView):
    """
    POST /api/v1/cart/custom/  - Add a saved custom design to the cart.
    """
    authentication_classes = [JWTAuthentication, CsrfExemptSessionAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from apps.customization.models import CustomDesign

        serializer = AddCustomDesignToCartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        design_id = serializer.validated_data['custom_design_id']
        quantity = serializer.validated_data['quantity']

        try:
            design = CustomDesign.objects.get(id=design_id, user=request.user)
        except CustomDesign.DoesNotExist:
            return Response(
                {'error': 'Custom design not found or does not belong to you'},
                status=status.HTTP_404_NOT_FOUND,
            )

        cart = get_cart(request)
        cart_item = CartItem.objects.create(
            cart=cart,
            custom_design=design,
            quantity=quantity,
        )


        return Response(
            CartSerializer(cart, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


# =============================================================================
# ORDER VIEWS
# =============================================================================

class OrderListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/v1/orders/  - List user orders
    POST /api/v1/orders/  - Create order from cart
    """
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateOrderSerializer
        return OrderSerializer
    
    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Create order from cart."""
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Order creation request data: {request.data}")
        
        serializer = CreateOrderSerializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"Order validation errors: {serializer.errors}")
            return Response(
                {'error': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cart = get_cart(request)
        logger.info(f"Cart for user {request.user.id}: {cart.id}, items: {cart.items.count()}")
        
        if cart.is_empty:
            return Response(
                {'error': 'Cart is empty'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate subtotal using discounted prices
        subtotal = sum(item.subtotal for item in cart.items.all())
        
        # Get shipping settings
        settings = StoreSettings.get_settings()
        shipping_cost = Decimal('0') if subtotal >= settings.free_shipping_threshold else settings.shipping_cost
        
        # Apply coupon if provided
        discount = Decimal('0')
        coupon_code = serializer.validated_data.get('coupon_code', '').strip().upper()
        coupon = None
        
        if coupon_code:
            from django.utils import timezone
            now = timezone.now()
            try:
                coupon = Coupon.objects.get(
                    code__iexact=coupon_code,
                    is_active=True,
                    valid_from__lte=now,
                    valid_until__gte=now
                )
                if not (coupon.usage_limit and coupon.times_used >= coupon.usage_limit):
                    if subtotal >= coupon.minimum_order_amount:
                        discount = coupon.calculate_discount(subtotal)
                        # Free shipping coupon
                        if coupon.discount_type == 'free_shipping':
                            shipping_cost = Decimal('0')
                        # Increment usage
                        coupon.times_used += 1
                        coupon.save()
            except Coupon.DoesNotExist:
                pass
        
        total = subtotal - discount + shipping_cost
        
        # Create order
        order = Order.objects.create(
            user=request.user,
            shipping_name=serializer.validated_data['shipping_name'],
            shipping_address=serializer.validated_data['shipping_address'],
            shipping_city=serializer.validated_data['shipping_city'],
            shipping_phone=serializer.validated_data['shipping_phone'],
            notes=serializer.validated_data.get('notes', ''),
            subtotal=subtotal,
            shipping_cost=shipping_cost,
            total=total
        )
        
        # Create order items from cart using discounted prices
        for cart_item in cart.items.all():
            if cart_item.custom_design:
                OrderItem.objects.create(
                    order=order,
                    product=None,
                    product_name=f"Custom Jewelry — {cart_item.custom_design.name}",
                    product_price=cart_item.custom_design.total_price,
                    quantity=cart_item.quantity,
                )
                # Mark design as ordered only after a real order is placed
                cart_item.custom_design.status = 'ordered'
                cart_item.custom_design.save(update_fields=['status'])
            else:
                OrderItem.objects.create(
                    order=order,
                    product=cart_item.product,
                    product_name=cart_item.product.name,
                    product_price=cart_item.product.final_price,
                    quantity=cart_item.quantity,
                )
                cart_item.product.stock -= cart_item.quantity
                cart_item.product.save()
        
        # Clear cart
        cart.items.all().delete()
        
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderDetailView(generics.RetrieveAPIView):
    """
    GET /api/v1/orders/{order_number}/  - Get order details
    """
    permission_classes = [IsAuthenticated]
    serializer_class = OrderSerializer
    lookup_field = 'order_number'
    
    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)


# =============================================================================
# CART SUMMARY & COUPON VIEWS
# =============================================================================

class CartSummaryView(APIView):
    """
    GET /api/v1/cart/summary/?coupon=CODE  - Get cart summary with pricing
    """
    authentication_classes = [JWTAuthentication, CsrfExemptSessionAuthentication]
    permission_classes = [AllowAny]
    
    def get(self, request):
        cart = get_cart(request)
        coupon_code = request.query_params.get('coupon', '').strip().upper()
        
        items = list(cart.items.select_related('product').all())
        
        # Calculate subtotal using discounted prices
        subtotal = sum(item.subtotal for item in items)
        discount = Decimal('0')
        coupon = None
        
        # Apply coupon if provided
        if coupon_code:
            from django.utils import timezone
            now = timezone.now()
            try:
                coupon = Coupon.objects.get(
                    code__iexact=coupon_code,
                    is_active=True,
                    valid_from__lte=now,
                    valid_until__gte=now
                )
                # Check usage limits
                if not (coupon.usage_limit and coupon.times_used >= coupon.usage_limit):
                    # Check minimum order amount
                    if subtotal >= coupon.minimum_order_amount:
                        discount = coupon.calculate_discount(subtotal)
            except Coupon.DoesNotExist:
                coupon = None
        
        # Get shipping settings from admin
        settings = StoreSettings.get_settings()
        shipping_threshold = settings.free_shipping_threshold
        shipping_cost = Decimal('0') if subtotal >= shipping_threshold else settings.shipping_cost
        
        # Free shipping coupon
        if coupon and coupon.discount_type == 'free_shipping':
            shipping_cost = Decimal('0')
        
        total = subtotal - discount + shipping_cost
        
        # Build item data with pricing details
        items_data = []
        for item in items:
            if item.custom_design:
                design = item.custom_design
                preview = None
                if design.preview_image:
                    preview = request.build_absolute_uri(design.preview_image.url)
                items_data.append({
                    'id': item.id,
                    'item_type': 'custom_design',
                    'product_id': None,
                    'product_name': f"Custom Jewelry — {design.name}",
                    'product_slug': None,
                    'product_image': preview,
                    'product_price': str(design.total_price),
                    'original_price': str(design.total_price),
                    'is_on_sale': False,
                    'discount_percent': '0',
                    'quantity': item.quantity,
                    'subtotal': str(item.subtotal),
                })
            else:
                product = item.product
                items_data.append({
                    'id': item.id,
                    'item_type': 'product',
                    'product_id': product.id,
                    'product_name': product.name,
                    'product_slug': product.slug,
                    'product_image': request.build_absolute_uri(product.image.url) if product.image else None,
                    'product_price': str(product.final_price),
                    'original_price': str(product.price),
                    'is_on_sale': product.is_on_sale,
                    'discount_percent': str(product.discount_percent) if product.discount_percent else '0',
                    'quantity': item.quantity,
                    'subtotal': str(item.subtotal),
                })
        
        return Response({
            'success': True,
            'data': {
                'items': items_data,
                'item_count': len(items),
                'subtotal': str(subtotal),
                'discount': str(discount),
                'coupon': CouponSerializer(coupon).data if coupon else None,
                'shipping_cost': str(shipping_cost),
                'free_shipping_threshold': str(shipping_threshold),
                'total': str(total)
            }
        })


class ApplyCouponView(APIView):
    """
    POST /api/v1/cart/apply-coupon/  - Validate and apply coupon
    """
    authentication_classes = [JWTAuthentication, CsrfExemptSessionAuthentication]
    permission_classes = [AllowAny]
    
    def post(self, request):
        code = request.data.get('code', '').strip().upper()
        
        if not code:
            return Response({
                'success': False,
                'error': 'Coupon code is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        cart = get_cart(request)
        subtotal = cart.total_price
        
        if subtotal == 0:
            return Response({
                'success': False,
                'error': 'Cart is empty'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate coupon
        from django.utils import timezone
        now = timezone.now()
        
        try:
            coupon = Coupon.objects.get(code__iexact=code)
        except Coupon.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Invalid coupon code'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if active
        if not coupon.is_active:
            return Response({
                'success': False,
                'error': 'This coupon is no longer active'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check validity period
        if now < coupon.valid_from or now > coupon.valid_until:
            return Response({
                'success': False,
                'error': 'This coupon has expired'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check usage limit
        if coupon.usage_limit and coupon.times_used >= coupon.usage_limit:
            return Response({
                'success': False,
                'error': 'This coupon has reached its usage limit'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check minimum order amount
        if subtotal < coupon.minimum_order_amount:
            return Response({
                'success': False,
                'error': f'Minimum order amount of Rs. {coupon.minimum_order_amount} required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate discount
        discount = coupon.calculate_discount(subtotal)
        
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

