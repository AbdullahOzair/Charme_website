"""
Auto-expiry for saved custom designs.

Designs are deleted 30 days after they were created, along with their stored
preview image. Cleanup runs lazily on normal traffic (no cron needed):
  - a per-user pass removes the requester's expired designs when they open
    "My Designs", and
  - a global sweep runs at most once every 24h (throttled via the cache).
"""
import logging

from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta

from .models import CustomDesign

logger = logging.getLogger(__name__)

EXPIRY_DAYS = 30
_SWEEP_KEY = 'designs_swept'
_SWEEP_TTL = 60 * 60 * 24  # once per 24h


def delete_expired_designs(user=None):
    """
    Delete CustomDesigns older than EXPIRY_DAYS (optionally for one user),
    removing each preview image file first. Returns the number deleted.
    """
    cutoff = timezone.now() - timedelta(days=EXPIRY_DAYS)
    qs = CustomDesign.objects.filter(created_at__lt=cutoff)
    if user is not None:
        qs = qs.filter(user=user)

    deleted = 0
    for design in qs.iterator():
        try:
            if design.preview_image:
                design.preview_image.delete(save=False)  # remove file from storage
            design.delete()
            deleted += 1
        except Exception as exc:  # noqa: BLE001
            logger.error('Failed to delete expired design %s: %s', design.pk, exc)

    if deleted:
        logger.info('Deleted %d expired design(s).', deleted)
    return deleted


def maybe_global_sweep():
    """Run a global expiry sweep at most once per 24h (piggybacks on traffic)."""
    if cache.get(_SWEEP_KEY):
        return 0
    cache.set(_SWEEP_KEY, True, _SWEEP_TTL)
    return delete_expired_designs()
