"""
Service layer for Cart app.
Contains all business logic for cart operations.
"""

from apps.core.base import BaseService
from apps.core.exceptions import BusinessLogicException, ValidationException
from .repositories import CartRepository, CartItemRepository, CouponRepository
from .models import Cart, CartItem, Coupon
from apps.products.repositories import ProductRepository
from typing import Optional, Dict, Any
from decimal import Decimal


class CartService(BaseService):
    """Service for cart-related business logic."""
    
    def __init__(self):
        self.repository = CartRepository()
        self.item_repository = CartItemRepository()
        self.product_repository = ProductRepository()
        self.coupon_repository = CouponRepository()

    def create(self, data: Dict[str, Any]) -> Cart:
        """Create a new cart."""
        user = data.get('user')
        session_id = data.get('session_id')
        
        if user:
            return self.repository.get_or_create_user_cart(user)
        elif session_id:
            return self.repository.get_or_create_session_cart(session_id)
        else:
            raise ValidationException('User or session_id is required')

    def update(self, id: int, data: Dict[str, Any]) -> Cart:
        """Update cart - mainly for merging."""
        pass

    def get_cart(self, user=None, session_id: str = None) -> Optional[Cart]:
        """Get cart for user or session."""
        if user:
            return self.repository.get_user_cart(user)
        elif session_id:
            return self.repository.get_session_cart(session_id)
        return None

    def get_or_create_cart(self, user=None, session_id: str = None) -> Cart:
        """Get or create cart for user or session."""
        if user:
            return self.repository.get_or_create_user_cart(user)
        elif session_id:
            return self.repository.get_or_create_session_cart(session_id)
        raise ValidationException('User or session_id is required')

    def add_item(
        self,
        cart: Cart,
        product_id: int,
        quantity: int = 1
    ) -> CartItem:
        """Add item to cart."""
        if quantity < 1:
            raise ValidationException('Quantity must be at least 1', 'quantity')
        
        product = self.product_repository.get_by_id(product_id)
        if not product:
            raise BusinessLogicException('Product not found')
        
        if not product.is_active:
            raise BusinessLogicException('Product is not available')
        
        # Check stock
        existing_item = self.item_repository.get_cart_item(cart, product)
        total_quantity = quantity + (existing_item.quantity if existing_item else 0)
        
        if product.stock_quantity < total_quantity:
            raise BusinessLogicException(
                f'Only {product.stock_quantity} items available in stock'
            )
        
        return self.item_repository.add_item(cart, product, quantity)

    def update_item_quantity(
        self,
        cart: Cart,
        product_id: int,
        quantity: int
    ) -> CartItem:
        """Update cart item quantity."""
        if quantity < 1:
            raise ValidationException('Quantity must be at least 1', 'quantity')
        
        product = self.product_repository.get_by_id(product_id)
        if not product:
            raise BusinessLogicException('Product not found')
        
        item = self.item_repository.get_cart_item(cart, product)
        if not item:
            raise BusinessLogicException('Item not found in cart')
        
        # Check stock
        if product.stock_quantity < quantity:
            raise BusinessLogicException(
                f'Only {product.stock_quantity} items available in stock'
            )
        
        return self.item_repository.update_quantity(item, quantity)

    def remove_item(self, cart: Cart, product_id: int) -> bool:
        """Remove item from cart."""
        product = self.product_repository.get_by_id(product_id)
        if not product:
            raise BusinessLogicException('Product not found')
        
        return self.item_repository.remove_item(cart, product)

    def clear_cart(self, cart: Cart) -> None:
        """Clear all items from cart."""
        self.repository.clear_cart(cart)

    def merge_carts(self, user, session_id: str) -> Cart:
        """Merge session cart into user cart when user logs in."""
        user_cart = self.repository.get_or_create_user_cart(user)
        session_cart = self.repository.get_session_cart(session_id)
        
        if session_cart and not session_cart.is_empty:
            return self.repository.merge_carts(user_cart, session_cart)
        
        return user_cart

    def get_cart_summary(self, cart: Cart, coupon_code: str = None) -> Dict[str, Any]:
        """Get cart summary with totals."""
        items = list(cart.items.select_related('product', 'product__category').all())
        
        subtotal = sum(item.total_price for item in items)
        discount = Decimal('0')
        coupon = None
        
        # Apply coupon if provided
        if coupon_code:
            coupon = self.coupon_repository.get_valid_coupon(coupon_code)
            if coupon:
                discount = coupon.calculate_discount(subtotal)
        
        # Calculate shipping (free over certain amount)
        shipping_threshold = Decimal('2000')  # Free shipping over Rs. 2000
        shipping_cost = Decimal('0') if subtotal >= shipping_threshold else Decimal('200')
        
        total = subtotal - discount + shipping_cost
        
        return {
            'items': items,
            'item_count': len(items),
            'subtotal': subtotal,
            'discount': discount,
            'coupon': coupon,
            'shipping_cost': shipping_cost,
            'free_shipping_threshold': shipping_threshold,
            'total': total
        }

    def validate_cart_for_checkout(self, cart: Cart) -> Dict[str, Any]:
        """Validate cart before checkout."""
        errors = []
        warnings = []
        
        if cart.is_empty:
            errors.append('Cart is empty')
            return {'valid': False, 'errors': errors, 'warnings': warnings}
        
        for item in cart.items.select_related('product').all():
            product = item.product
            
            if not product.is_active:
                errors.append(f'{product.name} is no longer available')
            elif product.stock_quantity < item.quantity:
                if product.stock_quantity == 0:
                    errors.append(f'{product.name} is out of stock')
                else:
                    warnings.append(
                        f'Only {product.stock_quantity} units of {product.name} available'
                    )
            
            # Check if price changed
            if item.price_at_addition != product.price:
                warnings.append(
                    f'Price of {product.name} has changed from Rs. {item.price_at_addition} to Rs. {product.price}'
                )
        
        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings
        }


class CouponService(BaseService):
    """Service for coupon-related business logic."""
    
    def __init__(self):
        self.repository = CouponRepository()

    def create(self, data: Dict[str, Any]) -> Coupon:
        """Create a new coupon."""
        code = data.get('code', '').upper().strip()
        if not code:
            raise ValidationException('Coupon code is required', 'code')
        
        if self.repository.get_by_code(code):
            raise ValidationException('Coupon code already exists', 'code')
        
        return self.repository.create(
            code=code,
            description=data.get('description', ''),
            discount_type=data.get('discount_type', 'percentage'),
            discount_value=data.get('discount_value', 0),
            minimum_order_amount=data.get('minimum_order_amount', 0),
            maximum_discount=data.get('maximum_discount'),
            usage_limit=data.get('usage_limit'),
            usage_limit_per_user=data.get('usage_limit_per_user', 1),
            valid_from=data['valid_from'],
            valid_until=data['valid_until']
        )

    def update(self, id: int, data: Dict[str, Any]) -> Coupon:
        """Update a coupon."""
        coupon = self.repository.get_by_id(id)
        if not coupon:
            raise BusinessLogicException('Coupon not found')
        
        allowed_fields = [
            'description', 'discount_type', 'discount_value', 'minimum_order_amount',
            'maximum_discount', 'usage_limit', 'usage_limit_per_user',
            'valid_from', 'valid_until', 'is_active'
        ]
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        return self.repository.update(coupon, **update_data)

    def validate_coupon(self, code: str, subtotal: Decimal, user=None) -> Dict[str, Any]:
        """Validate a coupon code and return discount info."""
        coupon = self.repository.get_by_code(code)
        
        if not coupon:
            return {'valid': False, 'error': 'Invalid coupon code'}
        
        if not coupon.is_valid:
            return {'valid': False, 'error': 'Coupon has expired or is no longer valid'}
        
        if subtotal < coupon.minimum_order_amount:
            return {
                'valid': False,
                'error': f'Minimum order amount of Rs. {coupon.minimum_order_amount} required'
            }
        
        # TODO: Check user usage limit
        
        discount = coupon.calculate_discount(subtotal)
        
        return {
            'valid': True,
            'coupon': coupon,
            'discount': discount,
            'final_subtotal': subtotal - discount
        }

    def apply_coupon(self, coupon: Coupon) -> Coupon:
        """Mark coupon as used."""
        return self.repository.increment_usage(coupon)
