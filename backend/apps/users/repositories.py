"""
Repository layer for Users app.
Handles all database operations for User and Address models.
"""

from apps.core.base import BaseRepository
from .models import User, Address
from typing import Optional, List
from django.db.models import QuerySet


class UserRepository(BaseRepository):
    """Repository for User model operations."""
    model = User

    def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email address."""
        try:
            return self.model.objects.get(email=email)
        except self.model.DoesNotExist:
            return None

    def get_active_users(self) -> QuerySet[User]:
        """Get all active users."""
        return self.model.objects.filter(is_active=True)

    def get_verified_users(self) -> QuerySet[User]:
        """Get all email-verified users."""
        return self.model.objects.filter(is_email_verified=True, is_active=True)

    def search_users(self, query: str) -> QuerySet[User]:
        """Search users by email, name, or phone."""
        from django.db.models import Q
        return self.model.objects.filter(
            Q(email__icontains=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(phone__icontains=query)
        )

    def verify_email(self, user: User) -> User:
        """Mark user's email as verified."""
        user.is_email_verified = True
        user.save()
        return user


class AddressRepository(BaseRepository):
    """Repository for Address model operations."""
    model = Address

    def get_user_addresses(self, user: User) -> QuerySet[Address]:
        """Get all addresses for a user."""
        return self.model.objects.filter(user=user, is_active=True)

    def get_default_address(self, user: User) -> Optional[Address]:
        """Get user's default address."""
        return self.model.objects.filter(
            user=user,
            is_default=True,
            is_active=True
        ).first()

    def get_shipping_addresses(self, user: User) -> QuerySet[Address]:
        """Get user's shipping addresses."""
        return self.model.objects.filter(
            user=user,
            address_type__in=['shipping', 'both'],
            is_active=True
        )

    def get_billing_addresses(self, user: User) -> QuerySet[Address]:
        """Get user's billing addresses."""
        return self.model.objects.filter(
            user=user,
            address_type__in=['billing', 'both'],
            is_active=True
        )

    def set_default(self, address: Address) -> Address:
        """Set an address as default."""
        # Unset other defaults
        self.model.objects.filter(
            user=address.user,
            is_default=True
        ).exclude(pk=address.pk).update(is_default=False)
        
        address.is_default = True
        address.save()
        return address
