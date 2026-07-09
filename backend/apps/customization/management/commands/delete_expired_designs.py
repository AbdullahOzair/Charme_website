"""
Delete saved custom designs (and their preview images) older than 30 days.

Run manually or from a scheduler:
    python manage.py delete_expired_designs
"""
from django.core.management.base import BaseCommand

from apps.customization.cleanup import delete_expired_designs, EXPIRY_DAYS


class Command(BaseCommand):
    help = f'Delete saved designs older than {EXPIRY_DAYS} days, plus their preview images.'

    def handle(self, *args, **options):
        count = delete_expired_designs()
        self.stdout.write(self.style.SUCCESS(f'Deleted {count} expired design(s).'))
