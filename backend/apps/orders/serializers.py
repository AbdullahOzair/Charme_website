"""
Serializers for Cart and Order.
"""

from rest_framework import serializers
from .models import Cart, CartItem, Order, OrderItem
from apps.products.models import Product


# =============================================================================
# CART SERIALIZERS
# =============================================================================

def _resolve_design_details(design):
    """
    Parse config_json from a CustomDesign and return a human-readable
    breakdown of beads, chain, charms, length, and prices.
    """
    from apps.accessories.models import Bead, Chain, Charm, Material, ColorPalette
    from decimal import Decimal

    cfg = design.config_json or {}
    details = {}

    # Bracelet length
    length = cfg.get('braceletLength')
    if length:
        details['bracelet_length_cm'] = length

    # Beads
    bead_ids = cfg.get('selectedBeads', [])
    if bead_ids:
        from collections import Counter
        id_counts = Counter(bead_ids)
        beads_qs = Bead.objects.filter(id__in=id_counts.keys()).select_related('color', 'material')
        beads_info = []
        for bead in beads_qs:
            count = id_counts[bead.id]
            beads_info.append({
                'name': bead.name,
                'count': count,
                'price_each': str(bead.price),
                'subtotal': str(bead.price * count),
                'color': bead.color.name if bead.color else None,
                'material': bead.material.name if bead.material else None,
            })
        details['beads'] = beads_info
        details['bead_count'] = len(bead_ids)

    # Chain
    chain_id = cfg.get('selectedChain')
    if chain_id:
        try:
            chain = Chain.objects.select_related('material').get(id=chain_id)
            details['chain'] = {
                'name': chain.name,
                'price': str(chain.price),
                'material': chain.material.name if chain.material else None,
            }
        except Chain.DoesNotExist:
            pass

    # Charms
    charm_ids = cfg.get('selectedCharms', [])
    if charm_ids:
        from collections import Counter
        id_counts = Counter(charm_ids)
        charms_qs = Charm.objects.filter(id__in=id_counts.keys())
        charms_info = []
        for charm in charms_qs:
            count = id_counts[charm.id]
            charms_info.append({
                'name': charm.name,
                'count': count,
                'price_each': str(charm.price),
                'subtotal': str(charm.price * count),
            })
        details['charms'] = charms_info
        details['charm_count'] = len(charm_ids)

    # Material
    material_id = cfg.get('selectedMaterial')
    if material_id:
        try:
            material = Material.objects.get(id=material_id)
            details['material'] = material.name
        except Material.DoesNotExist:
            pass

    # Color
    color_id = cfg.get('selectedColor')
    if color_id:
        try:
            color = ColorPalette.objects.get(id=color_id)
            details['color'] = {'name': color.name, 'hex': color.hex_code}
        except ColorPalette.DoesNotExist:
            pass

    details['total_price'] = str(design.total_price)
    return details


class CartItemSerializer(serializers.ModelSerializer):
    """Serializer for cart items — handles both regular products and custom designs."""
    item_type = serializers.SerializerMethodField()
    product_name = serializers.SerializerMethodField()
    product_price = serializers.SerializerMethodField()
    original_price = serializers.SerializerMethodField()
    product_image = serializers.SerializerMethodField()
    product_slug = serializers.SerializerMethodField()
    is_on_sale = serializers.SerializerMethodField()
    discount_percent = serializers.SerializerMethodField()
    subtotal = serializers.SerializerMethodField()
    design_details = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = [
            'id', 'item_type', 'product', 'custom_design',
            'product_name', 'product_price', 'original_price',
            'product_image', 'product_slug', 'is_on_sale', 'discount_percent',
            'quantity', 'subtotal', 'design_details',
        ]
        read_only_fields = ['id']

    def get_item_type(self, obj):
        return 'custom_design' if obj.custom_design_id else 'product'

    def get_product_name(self, obj):
        if obj.custom_design:
            return obj.custom_design.name
        return obj.product.name if obj.product else ''

    def get_product_price(self, obj):
        if obj.custom_design:
            return str(obj.custom_design.total_price)
        return str(obj.product.final_price) if obj.product else '0'

    def get_original_price(self, obj):
        if obj.custom_design:
            return str(obj.custom_design.total_price)
        return str(obj.product.price) if obj.product else '0'

    def get_product_image(self, obj):
        request = self.context.get('request')
        if obj.custom_design and obj.custom_design.preview_image:
            if request:
                return request.build_absolute_uri(obj.custom_design.preview_image.url)
            return obj.custom_design.preview_image.url
        if obj.product and obj.product.image:
            if request:
                return request.build_absolute_uri(obj.product.image.url)
            return obj.product.image.url
        return None

    def get_product_slug(self, obj):
        return obj.product.slug if obj.product else None

    def get_is_on_sale(self, obj):
        return obj.product.is_on_sale if obj.product else False

    def get_discount_percent(self, obj):
        return str(obj.product.discount_percent) if obj.product and obj.product.discount_percent else '0'

    def get_subtotal(self, obj):
        return str(obj.subtotal)

    def get_design_details(self, obj):
        if obj.custom_design:
            return _resolve_design_details(obj.custom_design)
        return None


class CartSerializer(serializers.ModelSerializer):
    """Serializer for cart."""
    items = serializers.SerializerMethodField()
    total_items = serializers.ReadOnlyField()
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total_items', 'total_price', 'updated_at']

    def get_items(self, obj):
        items = obj.items.all()
        return CartItemSerializer(items, many=True, context=self.context).data

    def get_total_price(self, obj):
        return str(sum(item.subtotal for item in obj.items.all()))


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


class AddCustomDesignToCartSerializer(serializers.Serializer):
    """Serializer for adding a saved custom design to cart."""
    custom_design_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)

    def validate_custom_design_id(self, value):
        from apps.customization.models import CustomDesign
        try:
            CustomDesign.objects.get(id=value)
        except CustomDesign.DoesNotExist:
            raise serializers.ValidationError("Custom design not found")
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
    payment_method = serializers.SerializerMethodField()
    payment_status = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'status', 'status_display',
            'payment_method', 'payment_status',
            'shipping_name', 'shipping_address', 'shipping_city', 'shipping_phone',
            'subtotal', 'shipping_cost', 'total',
            'notes', 'items', 'created_at'
        ]
        read_only_fields = ['id', 'order_number', 'subtotal', 'total', 'created_at']

    def get_payment_method(self, obj):
        try:
            return obj.payment.method
        except Exception:
            return None

    def get_payment_status(self, obj):
        try:
            return obj.payment.status
        except Exception:
            return None


class CreateOrderSerializer(serializers.Serializer):
    """Serializer for creating order from cart."""
    shipping_name = serializers.CharField(max_length=100)
    shipping_address = serializers.CharField()
    shipping_city = serializers.CharField(max_length=100)
    shipping_phone = serializers.CharField(max_length=20)
    notes = serializers.CharField(required=False, allow_blank=True, default='')
    coupon_code = serializers.CharField(required=False, allow_blank=True, default='')
