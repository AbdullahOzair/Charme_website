# backend/apps/accessories/models.py
from django.db import models
from django.utils.text import slugify
from django.core.validators import (
    MinValueValidator, MaxValueValidator, FileExtensionValidator, RegexValidator,
)

HEX_COLOR_VALIDATOR = RegexValidator(
    r'^#[0-9A-Fa-f]{6}$',
    'Enter a valid hex color like #RRGGBB (0–9, A–F only).',
)
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
    SHAPE_ROUND   = 'round'
    SHAPE_OVAL    = 'oval'
    SHAPE_CUBE    = 'cube'
    SHAPE_FACETED = 'faceted'
    SHAPE_CHOICES = [
        (SHAPE_ROUND,   'Round'),
        (SHAPE_OVAL,    'Oval'),
        (SHAPE_CUBE,    'Cube'),
        (SHAPE_FACETED, 'Faceted'),
    ]

    # 3D rendering material type (distinct from the accessory Material FK)
    MTYPE_GLASS    = 'glass'
    MTYPE_CRYSTAL  = 'crystal'
    MTYPE_STONE    = 'stone'
    MTYPE_METAL    = 'metal'
    MTYPE_RESIN    = 'resin'
    MTYPE_PEARL    = 'pearl'
    MTYPE_WOOD     = 'wood'
    MTYPE_CERAMIC  = 'ceramic'
    MTYPE_OTHER    = 'other'
    MTYPE_CHOICES  = [
        (MTYPE_GLASS,   'Glass'),
        (MTYPE_CRYSTAL, 'Crystal / Gemstone'),
        (MTYPE_STONE,   'Stone / Jade'),
        (MTYPE_METAL,   'Metal'),
        (MTYPE_RESIN,   'Resin / Acrylic'),
        (MTYPE_PEARL,   'Pearl'),
        (MTYPE_WOOD,    'Wood'),
        (MTYPE_CERAMIC, 'Ceramic'),
        (MTYPE_OTHER,   'Other'),
    ]

    TRANS_TRANSPARENT = 'transparent'
    TRANS_TRANSLUCENT = 'translucent'
    TRANS_OPAQUE      = 'opaque'
    TRANS_CHOICES     = [
        (TRANS_TRANSPARENT, 'Transparent'),
        (TRANS_TRANSLUCENT, 'Translucent'),
        (TRANS_OPAQUE,      'Opaque'),
    ]

    # Surface style for multi-shade / patterned beads
    TSTYLE_NONE     = 'none'
    TSTYLE_STONE    = 'natural_stone'
    TSTYLE_MARBLE   = 'marble'
    TSTYLE_CRACKLE  = 'crackle'
    TSTYLE_MILLE    = 'millefiori'
    TSTYLE_SWIRL    = 'swirl'
    TSTYLE_GALAXY   = 'galaxy'
    TSTYLE_CHOICES  = [
        (TSTYLE_NONE,    'None / solid'),
        (TSTYLE_STONE,   'Natural stone'),
        (TSTYLE_MARBLE,  'Marble'),
        (TSTYLE_CRACKLE, 'Crackle'),
        (TSTYLE_MILLE,   'Millefiori'),
        (TSTYLE_SWIRL,   'Swirl'),
        (TSTYLE_GALAXY,  'Galaxy'),
    ]

    name = models.CharField(max_length=200)
    image = models.ImageField(
        upload_to='beads/',
        blank=True,
        null=True,
        help_text='2D catalog photo (transparent PNG ok) shown on the bead selector card.',
    )
    model_file = models.FileField(
        upload_to='beads/models/',
        blank=True,
        null=True,
        validators=[FileExtensionValidator(['glb', 'gltf'])],
        help_text='Optional 3D model — only .glb / .gltf files. Do NOT upload images here.',
    )
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
    bead_material_type = models.CharField(
        max_length=10,
        choices=MTYPE_CHOICES,
        default=MTYPE_GLASS,
        help_text='Physical material of the bead — drives 3D rendering (transmission, IOR, metalness)',
    )
    transparency = models.CharField(
        max_length=12,
        choices=TRANS_CHOICES,
        default=TRANS_TRANSLUCENT,
        help_text='Transparency level for 3D rendering',
    )

    # ── Multi-shade / multicolor bead ─────────────────────────────────────────
    is_multi_shade = models.BooleanField(
        default=False,
        help_text='Tick for multicolor beads (natural stone, marble, millefiori). '
                  'Reveals the multi-shade options below and uses the real photo in 3D.',
    )
    use_real_photo = models.BooleanField(
        default=False,
        help_text='Render the real uploaded photo on the bead surface in the 3D viewer '
                  '(instead of the manual color/material). Auto-on for multi-shade beads.',
    )
    shade_colors = models.JSONField(
        default=list,
        blank=True,
        help_text='List of hex colors present in the bead, e.g. ["#B76E79", "#D4A574"]. '
                  'Used for the multicolor swatch. Filled manually or by AI.',
    )
    texture_style = models.CharField(
        max_length=20,
        choices=TSTYLE_CHOICES,
        default=TSTYLE_NONE,
        blank=True,
        help_text='Surface/pattern style for multi-shade beads.',
    )

    texture = models.ImageField(
        upload_to='beads/textures/',
        blank=True,
        null=True,
        help_text='Surface photo mapped onto the 3D bead (real multi-shade look). Falls back to the 2D image if empty.',
    )
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
    # How the charm attaches to the bracelet — drives 3D placement
    TYPE_DANGLE = 'dangle'
    TYPE_INLINE = 'inline'
    TYPE_CLIP   = 'clip'
    TYPE_CHOICES = [
        (TYPE_DANGLE, 'Dangle (hangs below the strand)'),
        (TYPE_INLINE, 'Inline (sits in the strand between beads)'),
        (TYPE_CLIP,   'Clip (rests on top of a bead)'),
    ]

    name = models.CharField(max_length=200)
    image = models.ImageField(upload_to='charms/', blank=True, null=True)
    model_file = models.FileField(
        upload_to='charms/models/',
        blank=True,
        null=True,
        validators=[FileExtensionValidator(['glb', 'gltf'])],
        help_text='Optional 3D model — only .glb / .gltf files.',
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
    )
    stock = models.PositiveIntegerField(default=0)
    size_mm = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('15.0'),
        validators=[MinValueValidator(Decimal('0.1'))],
        help_text='Charm size in millimeters — scales the charm in the 3D viewer.',
    )
    charm_type = models.CharField(
        max_length=10,
        choices=TYPE_CHOICES,
        default=TYPE_DANGLE,
        help_text='How the charm attaches — controls its 3D placement on the bracelet.',
    )
    is_movable = models.BooleanField(
        default=True,
        help_text='Customer can slide/drag this charm around the bracelet. '
                  'If off, it stays at its auto-assigned slot.',
    )
    RING_GOLD   = 'gold'
    RING_SILVER = 'silver'
    RING_CHOICES = [
        (RING_GOLD,   'Gold'),
        (RING_SILVER, 'Silver'),
    ]
    jump_ring_color = models.CharField(
        max_length=6,
        choices=RING_CHOICES,
        default=RING_GOLD,
        help_text='Metal color of the hoop/jump ring that connects the charm to the wire.',
    )
    anchor_x = models.FloatField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        help_text='Join point X (0–1 from the left of the image) where the loop meets the '
                  'wire. Set by clicking the image below. Auto-detected if left blank.',
    )
    anchor_y = models.FloatField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        help_text='Join point Y (0–1 from the top of the image).',
    )
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


class CharmVariant(models.Model):
    """A color option of a charm — same shape, different color + image."""
    charm = models.ForeignKey(
        Charm,
        on_delete=models.CASCADE,
        related_name='variants',
    )
    color_name = models.CharField(max_length=100, help_text='e.g. Red, Sky Blue, Gold')
    color_hex = models.CharField(
        max_length=7,
        default='#cccccc',
        validators=[HEX_COLOR_VALIDATOR],
        help_text='Swatch color shown to the customer, e.g. #E11D48',
    )
    image = models.ImageField(
        upload_to='charms/variants/',
        help_text='This color’s image (transparent PNG recommended).',
    )
    is_default = models.BooleanField(
        default=False,
        help_text='Show this color first in the configurator.',
    )
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'id']

    def __str__(self):
        return f'{self.charm.name} — {self.color_name}'
