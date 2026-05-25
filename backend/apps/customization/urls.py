# backend/apps/customization/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    JewelryCategoryViewSet,
    BraceletViewSet,
    CustomDesignViewSet,
    SaveDesignView,
    SavedDesignsListView,
)

router = DefaultRouter()
router.register(r'categories', JewelryCategoryViewSet, basename='jewelry-category')
router.register(r'bracelets', BraceletViewSet, basename='bracelet')
router.register(r'designs', CustomDesignViewSet, basename='custom-design')

urlpatterns = [
    path('', include(router.urls)),
    path('save/', SaveDesignView.as_view(), name='save-design'),
    path('saved/', SavedDesignsListView.as_view(), name='saved-designs'),
]
