"""
Repository layer for Orders app.
Handles all database operations for Order, OrderItem, OrderStatusHistory, Cart, CartItem, and Coupon models.
"""

from apps.core.base import BaseRepository
from .models import Order, OrderItem, OrderStatusHistory, Cart, CartItem, Coupon
from typing import Optional, List, Dict, Any
from django.db.models import QuerySet, Sum, Count, Avg
from django.utils import timezone
from datetime import timedelta


# =============================================================================
# CART REPOSITORIES
# =============================================================================

class CartRepository(BaseRepository):
    """Repository for Cart model operations."""
    model = Cart

    def get_user_cart(self, user) -> Optional[Cart]:
        """Get cart for authenticated user."""
        try:
            return self.model.objects.prefetch_related(
                'items', 'items__product', 'items__product__images'
            ).get(user=user)
        except self.model.DoesNotExist:
            return None

    def get_or_create_user_cart(self, user) -> Cart:
        """Get or create cart for authenticated user."""
        cart, created = self.model.objects.get_or_create(user=user)
        return cart

    def get_session_cart(self, session_id: str) -> Optional[Cart]:
        """Get cart for guest session."""
        try:
            return self.model.objects.prefetch_related(
                'items', 'items__product', 'items__product__images'
            ).get(session_id=session_id, user__isnull=True)
        except self.model.DoesNotExist:
            return None

    def get_or_create_session_cart(self, session_id: str) -> Cart:
        """Get or create cart for guest session."""
        cart, created = self.model.objects.get_or_create(
            session_id=session_id,
            user__isnull=True,
            defaults={'session_id': session_id}
        )
        return cart

    def merge_carts(self, user_cart: Cart, session_cart: Cart) -> Cart:
        """Merge session cart into user cart."""
        for item in session_cart.items.all():
            existing_item = user_cart.items.filter(product=item.product).first()
            if existing_item:
                existing_item.quantity += item.quantity
                existing_item.save()
            else:
                item.cart = user_cart
                item.save()
        
        session_cart.delete()
        return user_cart

    def clear_cart(self, cart: Cart) -> None:
        """Remove all items from cart."""
        cart.items.all().delete()

    def cleanup_old_session_carts(self, days: int = 30) -> int:
        """Delete old session carts."""
        cutoff_date = timezone.now() - timedelta(days=days)
        deleted, _ = self.model.objects.filter(
            user__isnull=True,
            updated_at__lt=cutoff_date
        ).delete()
        return deleted


class CartItemRepository(BaseRepository):
    """Repository for CartItem model operations."""
    model = CartItem

    def get_cart_item(self, cart: Cart, product) -> Optional[CartItem]:
        """Get specific item from cart."""
        try:
            return self.model.objects.get(cart=cart, product=product)
        except self.model.DoesNotExist:
            return None

    def add_item(self, cart: Cart, product, quantity: int = 1) -> CartItem:
        """Add item to cart or update quantity if exists."""
        item, created = self.model.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={
                'quantity': quantity,
                'price_at_addition': product.price
            }
        )
        
        if not created:
            item.quantity += quantity
            item.save()
        
        return item

    def update_quantity(self, item: CartItem, quantity: int) -> CartItem:
        """Update item quantity."""
        item.quantity = quantity
        item.save()
        return item

    def remove_item(self, cart: Cart, product) -> bool:
        """Remove item from cart."""
        deleted, _ = self.model.objects.filter(cart=cart, product=product).delete()
        return deleted > 0


class CouponRepository(BaseRepository):
    """Repository for Coupon model operations."""
    model = Coupon

    def get_by_code(self, code: str) -> Optional[Coupon]:
        """Get coupon by code."""
        try:
            return self.model.objects.get(code__iexact=code)
        except self.model.DoesNotExist:
            return None

    def get_valid_coupon(self, code: str) -> Optional[Coupon]:
        """Get a valid coupon by code."""
        now = timezone.now()
        try:
            coupon = self.model.objects.get(
                code__iexact=code,
                is_active=True,
                valid_from__lte=now,
                valid_until__gte=now
            )
            if coupon.usage_limit and coupon.times_used >= coupon.usage_limit:
                return None
            return coupon
        except self.model.DoesNotExist:
            return None

    def get_active_coupons(self) -> QuerySet[Coupon]:
        """Get all currently active coupons."""
        now = timezone.now()
        return self.model.objects.filter(
            is_active=True,
            valid_from__lte=now,
            valid_until__gte=now
        )

    def increment_usage(self, coupon: Coupon) -> Coupon:
        """Increment coupon usage count."""
        coupon.times_used += 1
        coupon.save()
        return coupon


# =============================================================================
# ORDER REPOSITORIES
# =============================================================================

class OrderRepository(BaseRepository):
    """Repository for Order model operations."""
    model = Order

    def get_by_order_number(self, order_number: str) -> Optional[Order]:
        """Get order by order number."""
        try:
            return self.model.objects.select_related('user').prefetch_related(
                'items', 'items__product', 'payments'
            ).get(order_number=order_number)
        except self.model.DoesNotExist:
            return None

    def get_user_orders(self, user) -> QuerySet[Order]:
        """Get all orders for a user."""
        return self.model.objects.filter(user=user).prefetch_related(
            'items', 'items__product'
        ).order_by('-created_at')

    def get_user_order(self, user, order_number: str) -> Optional[Order]:
        """Get specific order for a user."""
        try:
            return self.model.objects.select_related('user').prefetch_related(
                'items', 'items__product', 'payments', 'status_history'
            ).get(user=user, order_number=order_number)
        except self.model.DoesNotExist:
            return None

    def get_orders_by_status(self, status: str) -> QuerySet[Order]:
        """Get orders by status."""
        return self.model.objects.filter(status=status).order_by('-created_at')

    def get_pending_orders(self) -> QuerySet[Order]:
        """Get pending orders."""
        return self.get_orders_by_status(Order.OrderStatus.PENDING)

    def get_processing_orders(self) -> QuerySet[Order]:
        """Get orders being processed."""
        return self.model.objects.filter(
            status__in=[Order.OrderStatus.CONFIRMED, Order.OrderStatus.PROCESSING]
        ).order_by('-created_at')

    def update_status(
        self,
        order: Order,
        new_status: str,
        note: str = '',
        updated_by=None
    ) -> Order:
        """Update order status and create history record."""
        old_status = order.status
        order.status = new_status
        
        # Update timestamps based on status
        now = timezone.now()
        if new_status == Order.OrderStatus.CONFIRMED:
            order.confirmed_at = now
        elif new_status == Order.OrderStatus.SHIPPED:
            order.shipped_at = now
        elif new_status == Order.OrderStatus.DELIVERED:
            order.delivered_at = now
        elif new_status == Order.OrderStatus.CANCELLED:
            order.cancelled_at = now
        
        order.save()
        OrderStatusHistory.objects.create(
            order=order,
            status=new_status,
            note=note or f"Status changed from {old_status} to {new_status}",
            created_by=updated_by
        )
        
        return order

    def update_payment_status(self, order: Order, payment_status: str) -> Order:
        """Update order payment status."""
        order.payment_status = payment_status
        order.save()
        return order

    def get_order_statistics(self, days: int = 30) -> Dict[str, Any]:
        """Get order statistics for the last N days."""
        start_date = timezone.now() - timedelta(days=days)
        orders = self.model.objects.filter(created_at__gte=start_date)
        
        stats = orders.aggregate(
            total_orders=Count('id'),
            total_revenue=Sum('total'),
            avg_order_value=Avg('total')
        )
        
        # Orders by status
        status_breakdown = {}
        for status in Order.OrderStatus.choices:
            status_breakdown[status[0]] = orders.filter(status=status[0]).count()
        
        return {
            **stats,
            'status_breakdown': status_breakdown,
            'period_days': days
        }

    def search_orders(self, query: str) -> QuerySet[Order]:
        """Search orders by order number, customer name, or email."""
        from django.db.models import Q
        return self.model.objects.filter(
            Q(order_number__icontains=query) |
            Q(user__email__icontains=query) |
            Q(shipping_full_name__icontains=query) |
            Q(tracking_number__icontains=query)
        ).order_by('-created_at')


class OrderItemRepository(BaseRepository):
    """Repository for OrderItem model operations."""
    model = OrderItem

    def get_order_items(self, order: Order) -> QuerySet[OrderItem]:
        """Get all items for an order."""
        return self.model.objects.filter(order=order).select_related('product')

    def create_from_cart_items(self, order: Order, cart_items) -> List[OrderItem]:
        """Create order items from cart items."""
        order_items = []
        for cart_item in cart_items:
            # Use final_price to capture discounted price
            order_item = self.model.objects.create(
                order=order,
                product=cart_item.product,
                product_name=cart_item.product.name,
                quantity=cart_item.quantity,
                product_price=cart_item.product.final_price
            )
            order_items.append(order_item)
        return order_items


class OrderStatusHistoryRepository(BaseRepository):
    """Repository for OrderStatusHistory model operations."""
    model = OrderStatusHistory

    def get_order_history(self, order: Order) -> QuerySet[OrderStatusHistory]:
        """Get status history for an order."""
        return self.model.objects.filter(order=order).select_related('created_by').order_by('-created_at')

    def add_status_entry(
        self,
        order: Order,
        status: str,
        note: str = '',
        created_by=None
    ) -> OrderStatusHistory:
        """Add a status history entry."""
        return self.model.objects.create(
            order=order,
            status=status,
            note=note,
            created_by=created_by
        )
