"""
URL configuration for Charmé project.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API Routes
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/products/', include('apps.products.urls')),
    path('api/v1/', include('apps.orders.urls')),  # Cart & Orders
    path('api/v1/payments/', include('apps.payments.urls')),  # Stripe Payments
    path('api/v1/', include('apps.core.urls')),  # Core (Contact, etc.)
    
    # JWT Token Refresh
    path('api/v1/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
