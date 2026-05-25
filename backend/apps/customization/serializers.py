# backend/apps/customization/serializers.py
import base64
import uuid

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from rest_framework import serializers

from .models import JewelryCategory, Bracelet, CustomDesign

User = get_user_model()


class UserMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email']
        read_only_fields = ['id', 'email']


class JewelryCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = JewelryCategory
        fields = '__all__'
        read_only_fields = ['id', 'slug']


class BraceletSerializer(serializers.ModelSerializer):
    category = JewelryCategorySerializer(read_only=True)

    class Meta:
        model = Bracelet
        fields = '__all__'
        read_only_fields = ['id']


class CustomDesignSerializer(serializers.ModelSerializer):
    user = UserMinimalSerializer(read_only=True)

    class Meta:
        model = CustomDesign
        fields = '__all__'
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class SaveDesignSerializer(serializers.ModelSerializer):
    """
    Used exclusively by SaveDesignView.
    preview_image_base64 is write-only; the create() method decodes it and
    saves the PNG file to MEDIA_ROOT/designs/previews/.
    """
    preview_image_base64 = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        default='',
    )

    class Meta:
        model = CustomDesign
        fields = ['name', 'config_json', 'total_price', 'preview_image_base64']

    def create(self, validated_data):
        raw_b64 = validated_data.pop('preview_image_base64', '') or ''

        # user and status are injected by SaveDesignView via serializer.save(**kwargs)
        instance = CustomDesign(**validated_data)
        instance.save()

        if raw_b64:
            # Strip optional data-URI prefix: "data:image/png;base64,<data>"
            if ',' in raw_b64:
                raw_b64 = raw_b64.split(',', 1)[1]
            try:
                image_bytes = base64.b64decode(raw_b64)
                filename = f"preview_{uuid.uuid4().hex}.png"
                instance.preview_image.save(
                    filename,
                    ContentFile(image_bytes),
                    save=True,   # triggers instance.save() to persist the field
                )
            except Exception:
                # Non-fatal — design is saved without a preview image
                pass

        return instance
