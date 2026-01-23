"""
Service layer for Orders app (includes Cart and Coupon services).
Contains all business logic for order, cart, and coupon operations.
"""

from apps.core.base import BaseService
from apps.core.exceptions import BusinessLogicException, ValidationException
from .repositories import (
    OrderRepository, OrderItemRepository, OrderStatusHistoryRepository,
    CartRepository, CartItemRepository, CouponRepository
)
from .models import Order, OrderItem, Cart, CartItem, Coupon
from apps.products.repositories import ProductRepository
from apps.accounts.repositories import AddressRepository
from typing import Optional, Dict, Any, List
from decimal import Decimal
from django.db import transaction


# =============================================================================
# CART SERVICE
# =============================================================================

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

    def add_item(self, cart: Cart, product_id: int, quantity: int = 1) -> CartItem:
        """Add item to cart."""
        if quantity < 1:
            raise ValidationException('Quantity must be at least 1', 'quantity')
        
        product = self.product_repository.get_by_id(product_id)
        if not product:
            raise BusinessLogicException('Product not found')
        
        if not product.is_active:
            raise BusinessLogicException('Product is not available')
        
        existing_item = self.item_repository.get_cart_item(cart, product)
        total_quantity = quantity + (existing_item.quantity if existing_item else 0)
        
        if product.stock_quantity < total_quantity:
            raise BusinessLogicException(
                f'Only {product.stock_quantity} items available in stock'
            )
        
        return self.item_repository.add_item(cart, product, quantity)

    def update_item_quantity(self, cart: Cart, product_id: int, quantity: int) -> CartItem:
        """Update cart item quantity."""
        if quantity < 1:
            raise ValidationException('Quantity must be at least 1', 'quantity')
        
        product = self.product_repository.get_by_id(product_id)
        if not product:
            raise BusinessLogicException('Product not found')
        
        item = self.item_repository.get_cart_item(cart, product)
        if not item:
            raise BusinessLogicException('Item not found in cart')
        
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
        
        subtotal = sum(item.subtotal for item in items)
        discount = Decimal('0')
        coupon = None
        
        if coupon_code:
            coupon = self.coupon_repository.get_valid_coupon(coupon_code)
            if coupon:
                discount = coupon.calculate_discount(subtotal)
        
        shipping_threshold = Decimal('2000')
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
            
            if item.price_at_addition != product.price:
                warnings.append(
                    f'Price of {product.name} has changed from Rs. {item.price_at_addition} to Rs. {product.price}'
                )
        
        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings
        }


# =============================================================================
# COUPON SERVICE
# =============================================================================

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


# =============================================================================
# ORDER SERVICE
# =============================================================================

class OrderService(BaseService):
    """Service for order-related business logic."""
    
    def __init__(self):
        self.repository = OrderRepository()
        self.item_repository = OrderItemRepository()
        self.status_history_repository = OrderStatusHistoryRepository()
        self.cart_repository = CartRepository()
        self.product_repository = ProductRepository()
        self.address_repository = AddressRepository()
        self.coupon_repository = CouponRepository()

    @transaction.atomic
    def create(self, data: Dict[str, Any]) -> Order:
        """Create a new order from cart."""
        user = data.get('user')
        if not user:
            raise ValidationException('User is required')
        
        # Get cart
        cart = self.cart_repository.get_user_cart(user)
        if not cart or cart.is_empty:
            raise BusinessLogicException('Cart is empty')
        
        # Validate cart items
        cart_items = list(cart.items.select_related('product').all())
        self._validate_cart_items(cart_items)
        
        # Get shipping address
        shipping_address = self._get_shipping_address(data, user)
        
        # Calculate totals using discounted prices
        subtotal = sum(item.subtotal for item in cart_items)
        shipping_cost = data.get('shipping_cost', Decimal('200'))
        tax_amount = Decimal('0')
        discount_amount = Decimal('0')
        
        # Apply coupon
        coupon = None
        coupon_code = data.get('coupon_code', '').strip()
        if coupon_code:
            coupon = self.coupon_repository.get_valid_coupon(coupon_code)
            if coupon:
                discount_amount = coupon.calculate_discount(subtotal)
        
        # Free shipping over threshold
        if subtotal >= Decimal('2000'):
            shipping_cost = Decimal('0')
        
        total = subtotal + shipping_cost + tax_amount - discount_amount
        
        # Create order
        order = self.repository.create(
            user=user,
            status=Order.OrderStatus.PENDING,
            payment_status=Order.PaymentStatus.PENDING,
            
            # Shipping address
            shipping_full_name=shipping_address['full_name'],
            shipping_phone=shipping_address['phone'],
            shipping_address_line_1=shipping_address['address_line_1'],
            shipping_address_line_2=shipping_address.get('address_line_2', ''),
            shipping_city=shipping_address['city'],
            shipping_state=shipping_address['state'],
            shipping_postal_code=shipping_address['postal_code'],
            shipping_country=shipping_address.get('country', 'Pakistan'),
            
            # Totals
            subtotal=subtotal,
            shipping_cost=shipping_cost,
            tax_amount=tax_amount,
            discount_amount=discount_amount,
            total=total,
            
            # Coupon
            coupon=coupon,
            coupon_code=coupon_code if coupon else '',
            
            # Notes
            customer_notes=data.get('customer_notes', '')
        )
        
        # Create order items
        self.item_repository.create_from_cart_items(order, cart_items)
        
        # Update product stock
        for item in cart_items:
            self.product_repository.update_stock(item.product, -item.quantity)
            # Update sold count
            item.product.sold_count += item.quantity
            item.product.save()
        
        # Increment coupon usage
        if coupon:
            self.coupon_repository.increment_usage(coupon)
        
        # Clear cart
        self.cart_repository.clear_cart(cart)
        
        # Add status history
        self.status_history_repository.add_status_entry(
            order=order,
            status=Order.OrderStatus.PENDING,
            note='Order created'
        )
        
        return order

    def update(self, id: int, data: Dict[str, Any]) -> Order:
        """Update order details (admin only)."""
        order = self.repository.get_by_id(id)
        if not order:
            raise BusinessLogicException('Order not found')
        
        allowed_fields = ['admin_notes', 'tracking_number', 'carrier']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        return self.repository.update(order, **update_data)

    def get_user_orders(self, user) -> List[Order]:
        """Get all orders for a user."""
        return list(self.repository.get_user_orders(user))

    def get_user_order(self, user, order_number: str) -> Optional[Order]:
        """Get specific order for a user."""
        return self.repository.get_user_order(user, order_number)

    def get_order_by_number(self, order_number: str) -> Optional[Order]:
        """Get order by order number."""
        return self.repository.get_by_order_number(order_number)

    def update_status(
        self,
        order_number: str,
        new_status: str,
        note: str = '',
        updated_by=None
    ) -> Order:
        """Update order status."""
        order = self.repository.get_by_order_number(order_number)
        if not order:
            raise BusinessLogicException('Order not found')
        
        # Validate status transition
        if not self._is_valid_status_transition(order.status, new_status):
            raise BusinessLogicException(
                f'Cannot change status from {order.status} to {new_status}'
            )
        
        return self.repository.update_status(order, new_status, note, updated_by)

    def cancel_order(self, order_number: str, reason: str = '', cancelled_by=None) -> Order:
        """Cancel an order."""
        order = self.repository.get_by_order_number(order_number)
        if not order:
            raise BusinessLogicException('Order not found')
        
        # Can only cancel pending or confirmed orders
        if order.status not in [Order.OrderStatus.PENDING, Order.OrderStatus.CONFIRMED]:
            raise BusinessLogicException('Order cannot be cancelled at this stage')
        
        # Restore stock
        for item in order.items.all():
            self.product_repository.update_stock(item.product, item.quantity)
            item.product.sold_count -= item.quantity
            item.product.save()
        
        return self.repository.update_status(
            order,
            Order.OrderStatus.CANCELLED,
            reason or 'Order cancelled',
            cancelled_by
        )

    def _validate_cart_items(self, cart_items: List) -> None:
        """Validate cart items before creating order."""
        for item in cart_items:
            if not item.product.is_active:
                raise BusinessLogicException(
                    f'{item.product.name} is no longer available'
                )
            if item.product.stock_quantity < item.quantity:
                raise BusinessLogicException(
                    f'Insufficient stock for {item.product.name}'
                )

    def _get_shipping_address(self, data: Dict, user) -> Dict:
        """Get shipping address from data or user's saved address."""
        # If address_id provided, use saved address
        address_id = data.get('shipping_address_id')
        if address_id:
            address = self.address_repository.get_by_id(address_id)
            if address and address.user == user:
                return {
                    'full_name': address.full_name,
                    'phone': address.phone,
                    'address_line_1': address.address_line_1,
                    'address_line_2': address.address_line_2,
                    'city': address.city,
                    'state': address.state,
                    'postal_code': address.postal_code,
                    'country': address.country
                }
        
        # Otherwise, use provided address data
        required_fields = [
            'shipping_full_name', 'shipping_phone', 'shipping_address_line_1',
            'shipping_city', 'shipping_state', 'shipping_postal_code'
        ]
        
        for field in required_fields:
            if not data.get(field):
                raise ValidationException(
                    f'{field.replace("shipping_", "").replace("_", " ").title()} is required',
                    field
                )
        
        return {
            'full_name': data['shipping_full_name'],
            'phone': data['shipping_phone'],
            'address_line_1': data['shipping_address_line_1'],
            'address_line_2': data.get('shipping_address_line_2', ''),
            'city': data['shipping_city'],
            'state': data['shipping_state'],
            'postal_code': data['shipping_postal_code'],
            'country': data.get('shipping_country', 'Pakistan')
        }

    def _is_valid_status_transition(self, current: str, new: str) -> bool:
        """Check if status transition is valid."""
        valid_transitions = {
            Order.OrderStatus.PENDING: [
                Order.OrderStatus.CONFIRMED,
                Order.OrderStatus.CANCELLED
            ],
            Order.OrderStatus.CONFIRMED: [
                Order.OrderStatus.PROCESSING,
                Order.OrderStatus.CANCELLED
            ],
            Order.OrderStatus.PROCESSING: [
                Order.OrderStatus.SHIPPED,
                Order.OrderStatus.CANCELLED
            ],
            Order.OrderStatus.SHIPPED: [
                Order.OrderStatus.OUT_FOR_DELIVERY,
                Order.OrderStatus.DELIVERED
            ],
            Order.OrderStatus.OUT_FOR_DELIVERY: [
                Order.OrderStatus.DELIVERED
            ],
            Order.OrderStatus.DELIVERED: [
                Order.OrderStatus.REFUNDED
            ],
            Order.OrderStatus.CANCELLED: [],
            Order.OrderStatus.REFUNDED: []
        }
        
        return new in valid_transitions.get(current, [])

    def get_order_statistics(self, days: int = 30) -> Dict[str, Any]:
        """Get order statistics."""
        return self.repository.get_order_statistics(days)
