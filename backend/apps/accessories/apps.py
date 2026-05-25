# backend/apps/accessories/apps.py
from django.apps import AppConfig


class AccessoriesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.accessories'
    verbose_name = 'Accessories'

    def ready(self):
        from django.db.models.signals import post_migrate
        post_migrate.connect(_create_defaults, sender=self)


def _create_defaults(sender, **kwargs):
    try:
        from apps.accessories.models import Material, ColorPalette
    except Exception:
        return

    default_materials = [
        {'name': 'Silver', 'slug': 'silver', 'price_modifier': '1.00'},
        {'name': 'Gold', 'slug': 'gold', 'price_modifier': '2.50'},
        {'name': 'Rose Gold', 'slug': 'rose-gold', 'price_modifier': '2.00'},
    ]
    for mat in default_materials:
        Material.objects.get_or_create(
            slug=mat['slug'],
            defaults={'name': mat['name'], 'price_modifier': mat['price_modifier'], 'is_active': True},
        )

    default_colors = [
        {'name': 'Classic Black', 'hex_code': '#1A1A1A'},
        {'name': 'Pearl White', 'hex_code': '#F5F0E8'},
        {'name': 'Midnight Blue', 'hex_code': '#191970'},
    ]
    for col in default_colors:
        ColorPalette.objects.get_or_create(
            name=col['name'],
            defaults={'hex_code': col['hex_code'], 'is_active': True},
        )
