# backend/apps/accessories/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BeadViewSet, ChainViewSet, CharmViewSet, MaterialViewSet, ColorPaletteViewSet

router = DefaultRouter()
router.register(r'materials', MaterialViewSet, basename='material')
router.register(r'colors', ColorPaletteViewSet, basename='color')
router.register(r'beads', BeadViewSet, basename='bead')
router.register(r'chains', ChainViewSet, basename='chain')
router.register(r'charms', CharmViewSet, basename='charm')

urlpatterns = [
    path('', include(router.urls)),
]
