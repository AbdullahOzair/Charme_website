"""
Repository layer for Cart app.
Handles all database operations for Cart, CartItem, and Coupon models.
"""

from apps.core.base import BaseRepository
from .models import Cart, CartItem, Coupon
from typing import Optional
from django.db.models import QuerySet
from django.utils import timezone


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
        from datetime import timedelta
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
            
            # Check usage limit
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
