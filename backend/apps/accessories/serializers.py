# backend/apps/accessories/serializers.py
from rest_framework import serializers
from .models import Material, ColorPalette, Bead, Chain, Charm


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
    color = ColorPaletteSerializer(read_only=True)

    class Meta:
        model = Bead
        fields = '__all__'
        read_only_fields = ['id']


class ChainSerializer(serializers.ModelSerializer):
    material = MaterialSerializer(read_only=True)
    color = ColorPaletteSerializer(read_only=True)

    class Meta:
        model = Chain
        fields = '__all__'
        read_only_fields = ['id']


class CharmSerializer(serializers.ModelSerializer):
    material = MaterialSerializer(read_only=True)
    color = ColorPaletteSerializer(read_only=True)

    class Meta:
        model = Charm
        fields = '__all__'
        read_only_fields = ['id']
