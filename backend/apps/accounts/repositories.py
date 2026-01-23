"""
Repository layer for Accounts app.
Handles all database operations for User and Address models.
"""

from apps.core.base import BaseRepository
from .models import User, Address
from typing import Optional
from django.db.models import QuerySet


class UserRepository(BaseRepository):
    """Repository for User model operations."""
    model = User

    def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        try:
            return self.model.objects.get(email__iexact=email)
        except self.model.DoesNotExist:
            return None

    def get_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID."""
        try:
            return self.model.objects.get(id=user_id)
        except self.model.DoesNotExist:
            return None

    def email_exists(self, email: str) -> bool:
        """Check if email already exists."""
        return self.model.objects.filter(email__iexact=email).exists()

    def get_active_users(self) -> QuerySet[User]:
        """Get all active users."""
        return self.model.objects.filter(is_active=True)

    def search_users(self, query: str) -> QuerySet[User]:
        """Search users by name or email."""
        from django.db.models import Q
        return self.model.objects.filter(
            Q(email__icontains=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query)
        )


class AddressRepository(BaseRepository):
    """Repository for Address model operations."""
    model = Address

    def get_user_addresses(self, user: User) -> QuerySet[Address]:
        """Get all addresses for a user."""
        return self.model.objects.filter(user=user).order_by('-is_default', '-created_at')

    def get_user_default_address(self, user: User) -> Optional[Address]:
        """Get user's default address."""
        try:
            return self.model.objects.get(user=user, is_default=True)
        except self.model.DoesNotExist:
            # Return first address if no default
            return self.model.objects.filter(user=user).first()

    def get_by_id(self, address_id: int) -> Optional[Address]:
        """Get address by ID."""
        try:
            return self.model.objects.get(id=address_id)
        except self.model.DoesNotExist:
            return None

    def create_address(self, user: User, **data) -> Address:
        """Create a new address for user."""
        # If this is set as default, unset other defaults
        if data.get('is_default', False):
            self.model.objects.filter(user=user, is_default=True).update(is_default=False)
        
        return self.model.objects.create(user=user, **data)

    def update_address(self, address: Address, **data) -> Address:
        """Update an address."""
        # If setting as default, unset other defaults
        if data.get('is_default', False) and not address.is_default:
            self.model.objects.filter(user=address.user, is_default=True).update(is_default=False)
        
        for key, value in data.items():
            setattr(address, key, value)
        address.save()
        return address

    def delete_address(self, address: Address) -> bool:
        """Delete an address."""
        address.delete()
        return True

    def set_default_address(self, user: User, address_id: int) -> Optional[Address]:
        """Set an address as default."""
        try:
            # Unset current default
            self.model.objects.filter(user=user, is_default=True).update(is_default=False)
            # Set new default
            address = self.model.objects.get(id=address_id, user=user)
            address.is_default = True
            address.save()
            return address
        except self.model.DoesNotExist:
            return None

