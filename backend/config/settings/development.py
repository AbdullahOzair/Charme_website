# backend/config/settings/development.py
"""
Development settings — extends base.py.
Safe local defaults: SQLite fallback, no SSL, CORS open, dummy cache.
"""

import os

from .base import *  # noqa: F401, F403

DEBUG = True

SECRET_KEY = os.environ.get(
    'DJANGO_SECRET_KEY',
    'django-insecure-dev-key-do-not-use-in-production',
)

ALLOWED_HOSTS = ['*']

# ── Database ──────────────────────────────────────────────────────────────────
# Use DATABASE_URL env var if provided (e.g. a local Postgres); otherwise fall
# back to SQLite so the project works on a fresh checkout with no setup.
_database_url = os.environ.get('DATABASE_URL', '')

if _database_url:
    try:
        import dj_database_url
        DATABASES = {'default': dj_database_url.config(default=_database_url)}
    except ImportError:
        pass  # dj-database-url not installed; DATABASE_URL ignored
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',  # noqa: F405  (BASE_DIR from base.py)
        }
    }

# ── CORS ─────────────────────────────────────────────────────────────────────
CORS_ALLOW_ALL_ORIGINS = True

# ── Cache ─────────────────────────────────────────────────────────────────────
# Dummy cache means every view is a cache miss locally — no Redis needed.
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}

# ── Email ─────────────────────────────────────────────────────────────────────
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# ── Security — disable all HTTPS enforcement for local HTTP ──────────────────
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
SECURE_HSTS_SECONDS = 0
