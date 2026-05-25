# backend/apps/customization/views.py
import base64
import uuid

from django.core.files.base import ContentFile
from rest_framework import viewsets, filters, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import JewelryCategory, Bracelet, CustomDesign
from .serializers import (
    JewelryCategorySerializer,
    BraceletSerializer,
    CustomDesignSerializer,
    SaveDesignSerializer,
)


class JewelryCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = JewelryCategory.objects.filter(is_active=True)
    serializer_class = JewelryCategorySerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'


class BraceletViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Bracelet.objects.filter(is_active=True).select_related('category')
    serializer_class = BraceletSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'base_price']
    ordering = ['name']


class CustomDesignViewSet(viewsets.ModelViewSet):
    serializer_class = CustomDesignSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'updated_at', 'total_price']
    ordering = ['-updated_at']

    def get_queryset(self):
        return CustomDesign.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SaveDesignView(APIView):
    """
    POST /api/v1/customization/save/
    Accepts { name, config_json, total_price, preview_image_base64 }.
    Decodes the base64 PNG, saves it to media/designs/previews/, creates a
    CustomDesign with status='saved', and returns { id, name, status, preview_image_url }.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SaveDesignSerializer(
            data=request.data,
            context={'request': request},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        design = serializer.save(user=request.user, status=CustomDesign.STATUS_SAVED)

        preview_url = None
        if design.preview_image:
            try:
                preview_url = request.build_absolute_uri(design.preview_image.url)
            except Exception:
                pass

        return Response(
            {
                'id': design.id,
                'name': design.name,
                'status': design.status,
                'preview_image_url': preview_url,
            },
            status=status.HTTP_201_CREATED,
        )


class SavedDesignsListView(APIView):
    """
    GET /api/v1/customization/saved/
    Returns all CustomDesign records for the authenticated user,
    ordered by created_at descending.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        designs = (
            CustomDesign.objects
            .filter(user=request.user)
            .order_by('-created_at')
        )
        serializer = CustomDesignSerializer(
            designs,
            many=True,
            context={'request': request},
        )
        return Response(serializer.data)
