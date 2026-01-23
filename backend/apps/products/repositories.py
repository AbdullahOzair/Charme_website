"""
Repository layer for Products app.
Handles all database operations for Product, Category, and related models.
"""

from apps.core.base import BaseRepository
from .models import Product, Category, ProductImage, ProductReview, Wishlist
from typing import Optional, List, Dict, Any
from django.db.models import QuerySet, Avg, Count, Q, F
from decimal import Decimal


class CategoryRepository(BaseRepository):
    """Repository for Category model operations."""
    model = Category

    def get_by_slug(self, slug: str) -> Optional[Category]:
        """Get category by slug."""
        try:
            return self.model.objects.get(slug=slug, is_active=True)
        except self.model.DoesNotExist:
            return None

    def get_active_categories(self) -> QuerySet[Category]:
        """Get all active categories."""
        return self.model.objects.filter(is_active=True).order_by('display_order', 'name')

    def get_featured_categories(self) -> QuerySet[Category]:
        """Get featured categories."""
        return self.model.objects.filter(
            is_active=True,
            is_featured=True
        ).order_by('display_order')

    def get_root_categories(self) -> QuerySet[Category]:
        """Get top-level categories (no parent)."""
        return self.model.objects.filter(
            parent__isnull=True,
            is_active=True
        ).order_by('display_order', 'name')

    def get_subcategories(self, parent: Category) -> QuerySet[Category]:
        """Get subcategories of a category."""
        return self.model.objects.filter(
            parent=parent,
            is_active=True
        ).order_by('display_order', 'name')


class ProductRepository(BaseRepository):
    """Repository for Product model operations."""
    model = Product

    def get_by_slug(self, slug: str) -> Optional[Product]:
        """Get product by slug."""
        try:
            return self.model.objects.select_related('category').prefetch_related('images').get(
                slug=slug,
                is_active=True
            )
        except self.model.DoesNotExist:
            return None

    def get_by_sku(self, sku: str) -> Optional[Product]:
        """Get product by SKU."""
        try:
            return self.model.objects.get(sku=sku)
        except self.model.DoesNotExist:
            return None

    def get_active_products(self) -> QuerySet[Product]:
        """Get all active products with related data."""
        return self.model.objects.filter(
            is_active=True
        ).select_related('category').prefetch_related('images')

    def get_featured_products(self, limit: int = 8) -> QuerySet[Product]:
        """Get featured products."""
        return self.get_active_products().filter(
            is_featured=True
        )[:limit]

    def get_new_arrivals(self, limit: int = 8) -> QuerySet[Product]:
        """Get new arrival products."""
        return self.get_active_products().filter(
            is_new_arrival=True
        ).order_by('-created_at')[:limit]

    def get_bestsellers(self, limit: int = 8) -> QuerySet[Product]:
        """Get bestseller products."""
        return self.get_active_products().filter(
            is_bestseller=True
        ).order_by('-sold_count')[:limit]

    def get_on_sale(self) -> QuerySet[Product]:
        """Get products on sale."""
        return self.get_active_products().filter(
            compare_at_price__isnull=False,
            compare_at_price__gt=F('price')
        )

    def get_by_category(self, category: Category) -> QuerySet[Product]:
        """Get products by category."""
        return self.get_active_products().filter(category=category)

    def search_products(self, query: str) -> QuerySet[Product]:
        """Search products by name, description, or SKU."""
        return self.get_active_products().filter(
            Q(name__icontains=query) |
            Q(description__icontains=query) |
            Q(sku__icontains=query) |
            Q(materials__icontains=query)
        )

    def filter_products(
        self,
        category_slug: Optional[str] = None,
        min_price: Optional[Decimal] = None,
        max_price: Optional[Decimal] = None,
        in_stock_only: bool = False,
        sort_by: str = '-created_at'
    ) -> QuerySet[Product]:
        """Filter products with various criteria."""
        queryset = self.get_active_products()
        
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        
        if min_price is not None:
            queryset = queryset.filter(price__gte=min_price)
        
        if max_price is not None:
            queryset = queryset.filter(price__lte=max_price)
        
        if in_stock_only:
            queryset = queryset.filter(stock_quantity__gt=0)
        
        # Handle sorting
        valid_sort_options = {
            'price_low': 'price',
            'price_high': '-price',
            'newest': '-created_at',
            'oldest': 'created_at',
            'name_asc': 'name',
            'name_desc': '-name',
            'popular': '-sold_count',
        }
        sort_field = valid_sort_options.get(sort_by, '-created_at')
        queryset = queryset.order_by(sort_field)
        
        return queryset

    def increment_view_count(self, product: Product) -> None:
        """Increment product view count."""
        self.model.objects.filter(pk=product.pk).update(view_count=F('view_count') + 1)

    def update_stock(self, product: Product, quantity_change: int) -> Product:
        """Update product stock quantity."""
        product.stock_quantity = max(0, product.stock_quantity + quantity_change)
        product.save()
        return product

    def get_related_products(self, product: Product, limit: int = 4) -> QuerySet[Product]:
        """Get related products (same category, excluding current)."""
        return self.get_active_products().filter(
            category=product.category
        ).exclude(pk=product.pk)[:limit]


class ProductImageRepository(BaseRepository):
    """Repository for ProductImage model operations."""
    model = ProductImage

    def get_product_images(self, product: Product) -> QuerySet[ProductImage]:
        """Get all images for a product."""
        return self.model.objects.filter(product=product).order_by('display_order')

    def get_primary_image(self, product: Product) -> Optional[ProductImage]:
        """Get primary image for a product."""
        return self.model.objects.filter(
            product=product,
            is_primary=True
        ).first() or self.model.objects.filter(product=product).first()


class ProductReviewRepository(BaseRepository):
    """Repository for ProductReview model operations."""
    model = ProductReview

    def get_product_reviews(self, product: Product, approved_only: bool = True) -> QuerySet[ProductReview]:
        """Get reviews for a product."""
        queryset = self.model.objects.filter(product=product)
        if approved_only:
            queryset = queryset.filter(is_approved=True)
        return queryset.select_related('user').order_by('-created_at')

    def get_user_review(self, product: Product, user) -> Optional[ProductReview]:
        """Get a user's review for a product."""
        try:
            return self.model.objects.get(product=product, user=user)
        except self.model.DoesNotExist:
            return None

    def get_product_rating_stats(self, product: Product) -> Dict[str, Any]:
        """Get rating statistics for a product."""
        reviews = self.model.objects.filter(product=product, is_approved=True)
        stats = reviews.aggregate(
            avg_rating=Avg('rating'),
            total_reviews=Count('id')
        )
        
        # Rating distribution
        distribution = {}
        for i in range(1, 6):
            distribution[i] = reviews.filter(rating=i).count()
        
        return {
            'average_rating': stats['avg_rating'] or 0,
            'total_reviews': stats['total_reviews'],
            'distribution': distribution
        }


class WishlistRepository(BaseRepository):
    """Repository for Wishlist model operations."""
    model = Wishlist

    def get_user_wishlist(self, user) -> QuerySet[Wishlist]:
        """Get user's wishlist items."""
        return self.model.objects.filter(user=user).select_related('product')

    def is_in_wishlist(self, user, product: Product) -> bool:
        """Check if product is in user's wishlist."""
        return self.model.objects.filter(user=user, product=product).exists()

    def add_to_wishlist(self, user, product: Product) -> Wishlist:
        """Add product to user's wishlist."""
        wishlist, created = self.model.objects.get_or_create(user=user, product=product)
        return wishlist

    def remove_from_wishlist(self, user, product: Product) -> bool:
        """Remove product from user's wishlist."""
        deleted, _ = self.model.objects.filter(user=user, product=product).delete()
        return deleted > 0
