"""
Serializers for Cart and Order.
"""

from rest_framework import serializers
from .models import Cart, CartItem, Order, OrderItem
from apps.products.models import Product


# =============================================================================
# CART SERIALIZERS
# =============================================================================

class CartItemSerializer(serializers.ModelSerializer):
    """Serializer for cart items."""
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_price = serializers.SerializerMethodField()  # Use final_price (discounted)
    original_price = serializers.DecimalField(
        source='product.price', max_digits=10, decimal_places=2, read_only=True
    )
    product_image = serializers.SerializerMethodField()  # Full URL
    product_slug = serializers.CharField(source='product.slug', read_only=True)
    is_on_sale = serializers.BooleanField(source='product.is_on_sale', read_only=True)
    discount_percent = serializers.DecimalField(
        source='product.discount_percent', max_digits=5, decimal_places=2, read_only=True
    )
    subtotal = serializers.SerializerMethodField()  # Use final_price for subtotal
    
    class Meta:
        model = CartItem
        fields = [
            'id', 'product', 'product_name', 'product_price', 'original_price',
            'product_image', 'product_slug', 'is_on_sale', 'discount_percent',
            'quantity', 'subtotal'
        ]
        read_only_fields = ['id']
    
    def get_product_price(self, obj):
        """Return the final price (discounted if on sale)."""
        return str(obj.product.final_price)
    
    def get_product_image(self, obj):
        """Return full URL for product image."""
        if obj.product.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.product.image.url)
            return obj.product.image.url
        return None
    
    def get_subtotal(self, obj):
        """Calculate subtotal using final price."""
        return str(obj.product.final_price * obj.quantity)


class CartSerializer(serializers.ModelSerializer):
    """Serializer for cart."""
    items = serializers.SerializerMethodField()
    total_items = serializers.ReadOnlyField()
    total_price = serializers.SerializerMethodField()
    
    class Meta:
        model = Cart
        fields = ['id', 'items', 'total_items', 'total_price', 'updated_at']
    
    def get_items(self, obj):
        """Get cart items with request context for absolute URLs."""
        items = obj.items.all()
        return CartItemSerializer(items, many=True, context=self.context).data
    
    def get_total_price(self, obj):
        """Calculate total using final prices (discounted)."""
        total = sum(item.product.final_price * item.quantity for item in obj.items.all())
        return str(total)


class AddToCartSerializer(serializers.Serializer):
    """Serializer for adding items to cart."""
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)
    
    def validate_product_id(self, value):
        try:
            product = Product.objects.get(id=value, is_active=True)
            if product.stock <= 0:
                raise serializers.ValidationError("Product is out of stock")
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product not found")
        return value


class UpdateCartItemSerializer(serializers.Serializer):
    """Serializer for updating cart item quantity."""
    quantity = serializers.IntegerField(min_value=1)


# =============================================================================
# ORDER SERIALIZERS
# =============================================================================

class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for order items."""
    subtotal = serializers.ReadOnlyField()
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product_name', 'product_price', 'quantity', 'subtotal']


class OrderSerializer(serializers.ModelSerializer):
    """Serializer for orders."""
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'status', 'status_display',
            'shipping_name', 'shipping_address', 'shipping_city', 'shipping_phone',
            'subtotal', 'shipping_cost', 'total',
            'notes', 'items', 'created_at'
        ]
        read_only_fields = ['id', 'order_number', 'subtotal', 'total', 'created_at']


class CreateOrderSerializer(serializers.Serializer):
    """Serializer for creating order from cart."""
    shipping_name = serializers.CharField(max_length=100)
    shipping_address = serializers.CharField()
    shipping_city = serializers.CharField(max_length=100)
    shipping_phone = serializers.CharField(max_length=20)
    notes = serializers.CharField(required=False, allow_blank=True, default='')
    coupon_code = serializers.CharField(required=False, allow_blank=True, default='')

