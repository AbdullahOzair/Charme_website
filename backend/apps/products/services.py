"""
Service layer for Products app.
Contains all business logic for product operations.
"""

from apps.core.base import BaseService
from apps.core.exceptions import BusinessLogicException, ValidationException
from .repositories import (
    ProductRepository, CategoryRepository, ProductImageRepository,
    ProductReviewRepository, WishlistRepository
)
from .models import Product, Category, ProductReview, Wishlist
from typing import Optional, Dict, Any, List
from decimal import Decimal


class CategoryService(BaseService):
    """Service for category-related business logic."""
    
    def __init__(self):
        self.repository = CategoryRepository()

    def create(self, data: Dict[str, Any]) -> Category:
        """Create a new category."""
        name = data.get('name', '').strip()
        if not name:
            raise ValidationException('Category name is required', 'name')
        
        if self.repository.filter_by(name__iexact=name).exists():
            raise ValidationException('Category with this name already exists', 'name')
        
        return self.repository.create(
            name=name,
            description=data.get('description', ''),
            parent_id=data.get('parent_id'),
            display_order=data.get('display_order', 0),
            is_featured=data.get('is_featured', False),
            meta_title=data.get('meta_title', ''),
            meta_description=data.get('meta_description', '')
        )

    def update(self, id: int, data: Dict[str, Any]) -> Category:
        """Update a category."""
        category = self.repository.get_by_id(id)
        if not category:
            raise BusinessLogicException('Category not found')
        
        allowed_fields = [
            'name', 'description', 'parent_id', 'display_order',
            'is_featured', 'is_active', 'meta_title', 'meta_description'
        ]
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        return self.repository.update(category, **update_data)

    def get_active_categories(self) -> list:
        """Get all active categories."""
        return list(self.repository.get_active_categories())

    def get_featured_categories(self) -> list:
        """Get featured categories."""
        return list(self.repository.get_featured_categories())

    def get_category_tree(self) -> List[Dict]:
        """Get categories as a tree structure."""
        root_categories = self.repository.get_root_categories()
        tree = []
        
        for category in root_categories:
            tree.append({
                'category': category,
                'children': list(self.repository.get_subcategories(category))
            })
        
        return tree

    def get_by_slug(self, slug: str) -> Optional[Category]:
        """Get category by slug."""
        return self.repository.get_by_slug(slug)


class ProductService(BaseService):
    """Service for product-related business logic."""
    
    def __init__(self):
        self.repository = ProductRepository()
        self.category_repository = CategoryRepository()
        self.image_repository = ProductImageRepository()
        self.review_repository = ProductReviewRepository()

    def create(self, data: Dict[str, Any]) -> Product:
        """Create a new product."""
        # Validate required fields
        required_fields = ['name', 'sku', 'description', 'category_id', 'price']
        for field in required_fields:
            if not data.get(field):
                raise ValidationException(f'{field.replace("_", " ").title()} is required', field)
        
        # Validate SKU uniqueness
        if self.repository.get_by_sku(data['sku']):
            raise ValidationException('SKU already exists', 'sku')
        
        # Validate category
        category = self.category_repository.get_by_id(data['category_id'])
        if not category:
            raise ValidationException('Category not found', 'category_id')
        
        # Validate price
        price = Decimal(str(data['price']))
        if price <= 0:
            raise ValidationException('Price must be greater than 0', 'price')
        
        return self.repository.create(
            name=data['name'],
            sku=data['sku'],
            description=data['description'],
            short_description=data.get('short_description', ''),
            category=category,
            price=price,
            compare_at_price=data.get('compare_at_price'),
            cost_price=data.get('cost_price'),
            stock_quantity=data.get('stock_quantity', 0),
            materials=data.get('materials', ''),
            size=data.get('size', ''),
            color=data.get('color', ''),
            weight=data.get('weight'),
            is_featured=data.get('is_featured', False),
            is_new_arrival=data.get('is_new_arrival', True),
            meta_title=data.get('meta_title', ''),
            meta_description=data.get('meta_description', '')
        )

    def update(self, id: int, data: Dict[str, Any]) -> Product:
        """Update a product."""
        product = self.repository.get_by_id(id)
        if not product:
            raise BusinessLogicException('Product not found')
        
        allowed_fields = [
            'name', 'description', 'short_description', 'price', 'compare_at_price',
            'cost_price', 'stock_quantity', 'materials', 'size', 'color', 'weight',
            'is_active', 'is_featured', 'is_new_arrival', 'is_bestseller',
            'meta_title', 'meta_description', 'low_stock_threshold'
        ]
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        # Handle category update
        if 'category_id' in data:
            category = self.category_repository.get_by_id(data['category_id'])
            if category:
                update_data['category'] = category
        
        return self.repository.update(product, **update_data)

    def get_product_detail(self, slug: str) -> Optional[Dict[str, Any]]:
        """Get detailed product information."""
        product = self.repository.get_by_slug(slug)
        if not product:
            return None
        
        # Increment view count
        self.repository.increment_view_count(product)
        
        # Get rating stats
        rating_stats = self.review_repository.get_product_rating_stats(product)
        
        # Get related products
        related = list(self.repository.get_related_products(product))
        
        return {
            'product': product,
            'rating_stats': rating_stats,
            'related_products': related
        }

    def get_products_list(
        self,
        category_slug: str = None,
        search_query: str = None,
        min_price: Decimal = None,
        max_price: Decimal = None,
        in_stock_only: bool = False,
        sort_by: str = 'newest'
    ) -> list:
        """Get filtered list of products."""
        if search_query:
            return list(self.repository.search_products(search_query))
        
        return list(self.repository.filter_products(
            category_slug=category_slug,
            min_price=min_price,
            max_price=max_price,
            in_stock_only=in_stock_only,
            sort_by=sort_by
        ))

    def get_featured_products(self) -> list:
        """Get featured products."""
        return list(self.repository.get_featured_products())

    def get_new_arrivals(self) -> list:
        """Get new arrival products."""
        return list(self.repository.get_new_arrivals())

    def get_bestsellers(self) -> list:
        """Get bestseller products."""
        return list(self.repository.get_bestsellers())

    def get_on_sale_products(self) -> list:
        """Get products on sale."""
        return list(self.repository.get_on_sale())

    def update_stock(self, product_id: int, quantity_change: int) -> Product:
        """Update product stock."""
        product = self.repository.get_by_id(product_id)
        if not product:
            raise BusinessLogicException('Product not found')
        
        new_quantity = product.stock_quantity + quantity_change
        if new_quantity < 0:
            raise BusinessLogicException('Insufficient stock')
        
        return self.repository.update_stock(product, quantity_change)

    def check_stock_availability(self, product_id: int, quantity: int) -> bool:
        """Check if requested quantity is available."""
        product = self.repository.get_by_id(product_id)
        if not product:
            return False
        return product.is_active and product.stock_quantity >= quantity


class ProductReviewService(BaseService):
    """Service for product review business logic."""
    
    def __init__(self):
        self.repository = ProductReviewRepository()
        self.product_repository = ProductRepository()

    def create(self, data: Dict[str, Any]) -> ProductReview:
        """Create a product review."""
        product_id = data.get('product_id')
        user = data.get('user')
        
        if not product_id or not user:
            raise ValidationException('Product and user are required')
        
        product = self.product_repository.get_by_id(product_id)
        if not product:
            raise BusinessLogicException('Product not found')
        
        # Check if user already reviewed this product
        existing_review = self.repository.get_user_review(product, user)
        if existing_review:
            raise BusinessLogicException('You have already reviewed this product')
        
        rating = data.get('rating')
        if not rating or rating < 1 or rating > 5:
            raise ValidationException('Rating must be between 1 and 5', 'rating')
        
        comment = data.get('comment', '').strip()
        if not comment:
            raise ValidationException('Review comment is required', 'comment')
        
        return self.repository.create(
            product=product,
            user=user,
            rating=rating,
            title=data.get('title', ''),
            comment=comment
        )

    def update(self, id: int, data: Dict[str, Any]) -> ProductReview:
        """Update a review."""
        review = self.repository.get_by_id(id)
        if not review:
            raise BusinessLogicException('Review not found')
        
        allowed_fields = ['rating', 'title', 'comment']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        return self.repository.update(review, **update_data)

    def get_product_reviews(self, product_id: int) -> list:
        """Get reviews for a product."""
        product = self.product_repository.get_by_id(product_id)
        if not product:
            return []
        return list(self.repository.get_product_reviews(product))


class WishlistService(BaseService):
    """Service for wishlist business logic."""
    
    def __init__(self):
        self.repository = WishlistRepository()
        self.product_repository = ProductRepository()

    def create(self, data: Dict[str, Any]) -> Wishlist:
        """Add product to wishlist."""
        user = data.get('user')
        product_id = data.get('product_id')
        
        if not user or not product_id:
            raise ValidationException('User and product are required')
        
        product = self.product_repository.get_by_id(product_id)
        if not product:
            raise BusinessLogicException('Product not found')
        
        return self.repository.add_to_wishlist(user, product)

    def update(self, id: int, data: Dict[str, Any]) -> Any:
        """Not applicable for wishlist."""
        pass

    def get_user_wishlist(self, user) -> list:
        """Get user's wishlist."""
        return list(self.repository.get_user_wishlist(user))

    def remove_from_wishlist(self, user, product_id: int) -> bool:
        """Remove product from wishlist."""
        product = self.product_repository.get_by_id(product_id)
        if not product:
            raise BusinessLogicException('Product not found')
        
        return self.repository.remove_from_wishlist(user, product)

    def is_in_wishlist(self, user, product_id: int) -> bool:
        """Check if product is in user's wishlist."""
        product = self.product_repository.get_by_id(product_id)
        if not product:
            return False
        return self.repository.is_in_wishlist(user, product)
