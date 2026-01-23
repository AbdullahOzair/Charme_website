"""
Serializers for Products app.
"""

from rest_framework import serializers
from .models import Category, Product, ProductImage


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model."""
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'is_active', 'created_at']
        read_only_fields = ['id', 'slug', 'created_at']


class ProductImageSerializer(serializers.ModelSerializer):
    """Serializer for product images."""
    
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'order']
        read_only_fields = ['id']


class ProductListSerializer(serializers.ModelSerializer):
    """Serializer for product list view."""
    category = CategorySerializer(read_only=True)
    in_stock = serializers.ReadOnlyField()
    final_price = serializers.ReadOnlyField()
    savings = serializers.ReadOnlyField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'price', 'sale_price',
            'final_price', 'savings', 'is_on_sale', 'discount_percent',
            'stock', 'image', 'category', 'in_stock', 'created_at'
        ]


class ProductDetailSerializer(serializers.ModelSerializer):
    """Serializer for product detail view."""
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
        required=False
    )
    in_stock = serializers.ReadOnlyField()
    final_price = serializers.ReadOnlyField()
    savings = serializers.ReadOnlyField()
    images = ProductImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'price', 'sale_price',
            'final_price', 'savings', 'is_on_sale', 'discount_percent',
            'stock', 'image', 'images', 'category', 'category_id',
            'is_active', 'in_stock', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at', 'sale_price']


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating products."""
    
    class Meta:
        model = Product, 'is_on_sale', 'discount_percent'
        fields = [
            'name', 'description', 'price', 'stock', 
            'image', 'category', 'is_active'
        ]

