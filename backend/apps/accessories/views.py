# backend/apps/accessories/views.py
from rest_framework import viewsets, filters
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend

from .models import Material, ColorPalette, Bead, Chain, Charm
from .serializers import (
    MaterialSerializer,
    ColorPaletteSerializer,
    BeadSerializer,
    ChainSerializer,
    CharmSerializer,
)


class MaterialViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Material.objects.filter(is_active=True)
    serializer_class = MaterialSerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'


class ColorPaletteViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ColorPalette.objects.filter(is_active=True)
    serializer_class = ColorPaletteSerializer
    permission_classes = [AllowAny]


class BeadViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BeadSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['material', 'color', 'shape']
    search_fields = ['name']
    ordering_fields = ['name', 'price', 'size_mm']
    ordering = ['name']

    def get_queryset(self):
        return Bead.objects.filter(is_active=True).select_related('material', 'color')


class ChainViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ChainSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'price', 'thickness_mm']
    ordering = ['name']

    def get_queryset(self):
        return Chain.objects.filter(is_active=True).select_related('material', 'color')


class CharmViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CharmSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'price']
    ordering = ['name']

    def get_queryset(self):
        return Charm.objects.filter(is_active=True).select_related('material', 'color')
