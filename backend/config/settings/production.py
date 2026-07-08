"""
Production settings for Charmé.
"""

from .base import *

DEBUG = False

# Security settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
X_FRAME_OPTIONS = 'DENY'

# Behind Render's (and Cloudflare's) HTTPS proxy — trust the forwarded scheme so
# Django knows requests are secure (needed for secure cookies, no redirect loop).
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True

# CSRF trusted origins (Django 4+) — required for admin login over HTTPS.
# Comma-separated, e.g. "https://charme-api.onrender.com,https://charme.pages.dev"
CSRF_TRUSTED_ORIGINS = [
    o.strip().rstrip('/') for o in os.environ.get('CSRF_TRUSTED_ORIGINS', '').split(',') if o.strip()
]

# Use Redis for caching when REDIS_URL is provided; otherwise fall back to
# local-memory cache so the app still boots on free hosts without Redis.
REDIS_URL = os.environ.get('REDIS_URL')
if REDIS_URL:
    CACHES = {
        'default': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': REDIS_URL,
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            }
        }
    }
    # Store sessions in the Redis cache
    SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
    SESSION_CACHE_ALIAS = 'default'
else:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        }
    }
    # Default DB-backed sessions when there's no Redis

# ── Media storage on Cloudinary (free, no credit card) ──────────────────────
# Uploaded media (bead/charm images) is stored on Cloudinary's CDN so the
# Cloudflare Pages frontend can load it over HTTPS. Values come from env.
# Requires: cloudinary, django-cloudinary-storage (see requirements.txt).
CLOUDINARY_CLOUD_NAME = os.environ.get('CLOUDINARY_CLOUD_NAME')
CLOUDINARY_API_KEY    = os.environ.get('CLOUDINARY_API_KEY')
CLOUDINARY_API_SECRET = os.environ.get('CLOUDINARY_API_SECRET')

# Only switch media to Cloudinary when configured; otherwise keep local disk
# (lets the app boot before the creds are set).
if CLOUDINARY_CLOUD_NAME:
    CLOUDINARY_STORAGE = {
        'CLOUD_NAME': CLOUDINARY_CLOUD_NAME,
        'API_KEY':    CLOUDINARY_API_KEY,
        'API_SECRET': CLOUDINARY_API_SECRET,
    }
    STORAGES = {
        'default': {'BACKEND': 'cloudinary_storage.storage.MediaCloudinaryStorage'},
        'staticfiles': {'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage'},
    }
