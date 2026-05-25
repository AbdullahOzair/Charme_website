# backend/apps/customization/validators.py
import os
from django.core.exceptions import ValidationError

ALLOWED_3D_EXTENSIONS = {'.glb', '.gltf'}
ALLOWED_IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.webp'}


def validate_3d_file(value):
    ext = os.path.splitext(value.name)[1].lower()
    if ext not in ALLOWED_3D_EXTENSIONS:
        raise ValidationError(
            f"Unsupported 3D file format '{ext}'. "
            f"Allowed formats: {', '.join(sorted(ALLOWED_3D_EXTENSIONS))}"
        )


def validate_image_file(value):
    ext = os.path.splitext(value.name)[1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValidationError(
            f"Unsupported image format '{ext}'. "
            f"Allowed formats: {', '.join(sorted(ALLOWED_IMAGE_EXTENSIONS))}"
        )
