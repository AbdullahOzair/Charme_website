"""
Product models for Charmé - Handmade Bracelets.
"""

from django.db import models
from django.utils.text import slugify
from django.core.validators import MinValueValidator
from decimal import Decimal


class Category(models.Model):
    """Product categories."""
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'categories'
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Product(models.Model):
    """Product model for handmade bracelets."""
    
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    description = models.TextField()
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    stock = models.PositiveIntegerField(default=0)
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products'
    )
    
    # Discount fields
    is_on_sale = models.BooleanField(default=False, help_text="Mark product as on sale")
    discount_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(Decimal('0')), MinValueValidator(Decimal('0'))],
        help_text="Discount percentage (0-100)"
    )
    sale_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Calculated sale price (auto-calculated if discount is set)"
    )
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        
        # Auto-calculate sale price if discount is set
        if self.discount_percent and self.discount_percent > 0:
            discount_amount = self.price * (self.discount_percent / 100)
            self.sale_price = self.price - discount_amount
        else:
            self.sale_price = None
            
        super().save(*args, **kwargs)

    @property
    def in_stock(self):
        return self.stock > 0
    
    @property
    def final_price(self):
        """Returns the price to display (sale price if on sale, regular price otherwise)."""
        if self.is_on_sale and self.sale_price:
            return self.sale_price
        return self.price
    
    @property
    def savings(self):
        """Calculate the amount saved."""
        if self.is_on_sale and self.sale_price:
            return self.price - self.sale_price
        return Decimal('0')


class ProductImage(models.Model):
    """Additional product images for gallery."""
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image = models.ImageField(upload_to='products/gallery/')
    alt_text = models.CharField(max_length=200, blank=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.product.name} - Image {self.order}"

