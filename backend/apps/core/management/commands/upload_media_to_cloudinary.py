"""
One-time migration: push existing LOCAL media files (backend/media/) up to the
configured storage (Cloudinary in production settings), keeping the same paths
so the URLs stored in the database resolve.

Run it locally, pointing at the production DB + Cloudinary creds:

    export DJANGO_SETTINGS_MODULE=config.settings.production
    export DJANGO_SECRET_KEY=anything
    export DATABASE_URL="postgresql://...neon...?sslmode=require"
    export CLOUDINARY_CLOUD_NAME=...  CLOUDINARY_API_KEY=...  CLOUDINARY_API_SECRET=...
    python manage.py upload_media_to_cloudinary

Safe to run once. Re-running may create duplicate uploads, so avoid repeats.
"""
import os

from django.apps import apps
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db.models import FileField


class Command(BaseCommand):
    help = 'Upload existing local media files to the configured (Cloudinary) storage.'

    def handle(self, *args, **options):
        media_root = str(settings.MEDIA_ROOT)
        uploaded = missing = failed = 0

        for model in apps.get_models():
            file_fields = [f for f in model._meta.get_fields() if isinstance(f, FileField)]
            if not file_fields:
                continue

            for obj in model.objects.all().iterator():
                for field in file_fields:
                    ff = getattr(obj, field.name)
                    if not ff or not ff.name:
                        continue

                    local_path = os.path.join(media_root, ff.name)
                    if not os.path.exists(local_path):
                        missing += 1
                        self.stdout.write(f'  · missing local file, skipped: {ff.name}')
                        continue

                    try:
                        with open(local_path, 'rb') as fh:
                            data = fh.read()
                        # Save directly to the field's storage at the SAME name so
                        # the DB value keeps pointing at the right object.
                        saved_name = ff.storage.save(ff.name, ContentFile(data))
                        if saved_name != ff.name:
                            setattr(obj, field.name, saved_name)
                            obj.save(update_fields=[field.name])
                        uploaded += 1
                        self.stdout.write(self.style.SUCCESS(
                            f'  ✓ {model.__name__}.{field.name}: {ff.name} -> {saved_name}'))
                    except Exception as exc:  # noqa: BLE001
                        failed += 1
                        self.stderr.write(self.style.ERROR(
                            f'  ✗ {model.__name__}.{field.name}: {ff.name} — {exc}'))

        self.stdout.write(self.style.SUCCESS(
            f'\nDone. uploaded={uploaded}, missing_local={missing}, failed={failed}'))
