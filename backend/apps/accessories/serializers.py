# backend/apps/accessories/serializers.py
from rest_framework import serializers
from .models import Material, ColorPalette, Bead, Chain, Charm, CharmVariant


class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = '__all__'
        read_only_fields = ['id', 'slug']


class ColorPaletteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ColorPalette
        fields = '__all__'
        read_only_fields = ['id']


class BeadSerializer(serializers.ModelSerializer):
    material = MaterialSerializer(read_only=True)
    color    = ColorPaletteSerializer(read_only=True)
    # Expose the new rendering fields explicitly so the frontend always
    # receives them even if the client sends a sparse field list.
    bead_material_type = serializers.CharField(read_only=True)
    transparency       = serializers.CharField(read_only=True)

    class Meta:
        model  = Bead
        fields = '__all__'
        read_only_fields = ['id']


class ChainSerializer(serializers.ModelSerializer):
    material = MaterialSerializer(read_only=True)
    color = ColorPaletteSerializer(read_only=True)

    class Meta:
        model = Chain
        fields = '__all__'
        read_only_fields = ['id']


class CharmVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = CharmVariant
        fields = ['id', 'color_name', 'color_hex', 'image', 'is_default', 'sort_order']


class CharmSerializer(serializers.ModelSerializer):
    material = MaterialSerializer(read_only=True)
    color = ColorPaletteSerializer(read_only=True)
    variants = CharmVariantSerializer(many=True, read_only=True)

    class Meta:
        model = Charm
        fields = '__all__'
        read_only_fields = ['id']
