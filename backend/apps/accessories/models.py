# backend/apps/accessories/models.py
from django.db import models
from django.utils.text import slugify
from django.core.validators import MinValueValidator
from decimal import Decimal


class Material(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    price_modifier = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=Decimal('1.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text='Multiplier applied to base price',
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class ColorPalette(models.Model):
    name = models.CharField(max_length=100, unique=True)
    hex_code = models.CharField(max_length=7, help_text='Hex color code, e.g. #FF5733')
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.hex_code})"


class Bead(models.Model):
    SHAPE_ROUND = 'round'
    SHAPE_OVAL = 'oval'
    SHAPE_CUBE = 'cube'
    SHAPE_FACETED = 'faceted'
    SHAPE_CHOICES = [
        (SHAPE_ROUND, 'Round'),
        (SHAPE_OVAL, 'Oval'),
        (SHAPE_CUBE, 'Cube'),
        (SHAPE_FACETED, 'Faceted'),
    ]

    name = models.CharField(max_length=200)
    image = models.ImageField(upload_to='beads/', blank=True, null=True)
    model_file = models.FileField(upload_to='beads/models/', blank=True, null=True)
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
    )
    stock = models.PositiveIntegerField(default=0)
    material = models.ForeignKey(
        Material,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='beads',
    )
    color = models.ForeignKey(
        ColorPalette,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='beads',
    )
    size_mm = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.1'))],
        help_text='Bead size in millimeters',
    )
    shape = models.CharField(max_length=10, choices=SHAPE_CHOICES, default=SHAPE_ROUND)
    texture = models.ImageField(upload_to='beads/textures/', blank=True, null=True)
    thumbnail = models.ImageField(upload_to='beads/thumbnails/', blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Chain(models.Model):
    name = models.CharField(max_length=200)
    image = models.ImageField(upload_to='chains/', blank=True, null=True)
    model_file = models.FileField(upload_to='chains/models/', blank=True, null=True)
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
    )
    stock = models.PositiveIntegerField(default=0)
    material = models.ForeignKey(
        Material,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='chains',
    )
    color = models.ForeignKey(
        ColorPalette,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='chains',
    )
    thickness_mm = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.1'))],
        help_text='Chain thickness in millimeters',
    )
    compatible_lengths = models.JSONField(
        default=list,
        help_text='List of compatible bracelet lengths in mm',
    )
    thumbnail = models.ImageField(upload_to='chains/thumbnails/', blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Charm(models.Model):
    name = models.CharField(max_length=200)
    image = models.ImageField(upload_to='charms/', blank=True, null=True)
    model_file = models.FileField(upload_to='charms/models/', blank=True, null=True)
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
    )
    stock = models.PositiveIntegerField(default=0)
    material = models.ForeignKey(
        Material,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='charms',
    )
    color = models.ForeignKey(
        ColorPalette,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='charms',
    )
    thumbnail = models.ImageField(upload_to='charms/thumbnails/', blank=True, null=True)
    preview_image = models.ImageField(upload_to='charms/previews/', blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name
