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

# ── Media storage on Cloudflare R2 (S3-compatible) ──────────────────────────
# Uploaded media (bead images/textures/models) is stored in an R2 bucket so the
# Cloudflare Pages frontend can load it over HTTPS. All values come from env.
# Requires: django-storages, boto3 (see requirements.txt).
AWS_ACCESS_KEY_ID       = os.environ.get('R2_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY   = os.environ.get('R2_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = os.environ.get('R2_BUCKET_NAME')
AWS_S3_ENDPOINT_URL     = os.environ.get('R2_ENDPOINT_URL')  # https://<account_id>.r2.cloudflarestorage.com
# Public domain that serves the bucket (R2 public dev URL or a custom domain).
AWS_S3_CUSTOM_DOMAIN    = os.environ.get('R2_PUBLIC_DOMAIN')  # e.g. media.charme.com or pub-xxxx.r2.dev
AWS_S3_REGION_NAME      = 'auto'
AWS_S3_SIGNATURE_VERSION = 's3v4'
AWS_S3_FILE_OVERWRITE   = False
AWS_DEFAULT_ACL         = None      # R2 ignores ACLs; bucket is made public via R2 settings
AWS_QUERYSTRING_AUTH    = False     # serve unsigned public URLs

# Only switch media to R2 when the bucket is configured; otherwise keep local
# disk (lets the app boot on hosts where R2 isn't set up yet).
if AWS_STORAGE_BUCKET_NAME:
    STORAGES = {
        'default': {'BACKEND': 'storages.backends.s3.S3Storage'},
        'staticfiles': {'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage'},
    }
    if AWS_S3_CUSTOM_DOMAIN:
        MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/'
