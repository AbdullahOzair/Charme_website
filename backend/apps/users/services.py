"""
Service layer for Users app.
Contains all business logic for user operations.
"""

from apps.core.base import BaseService
from apps.core.exceptions import BusinessLogicException, ValidationException
from .repositories import UserRepository, AddressRepository
from .models import User, Address
from typing import Optional, Dict, Any
from django.contrib.auth.hashers import make_password
import re


class UserService(BaseService):
    """Service for user-related business logic."""
    
    def __init__(self):
        self.repository = UserRepository()
        self.address_repository = AddressRepository()

    def create(self, data: Dict[str, Any]) -> User:
        """Create a new user with validation."""
        # Validate email
        email = data.get('email', '').lower().strip()
        if not email:
            raise ValidationException('Email is required', 'email')
        
        if not self._is_valid_email(email):
            raise ValidationException('Invalid email format', 'email')
        
        if self.repository.get_by_email(email):
            raise ValidationException('Email already registered', 'email')
        
        # Validate password
        password = data.get('password')
        if not password or len(password) < 8:
            raise ValidationException('Password must be at least 8 characters', 'password')
        
        # Validate name
        first_name = data.get('first_name', '').strip()
        last_name = data.get('last_name', '').strip()
        
        if not first_name:
            raise ValidationException('First name is required', 'first_name')
        if not last_name:
            raise ValidationException('Last name is required', 'last_name')
        
        # Create user
        user = self.repository.create(
            email=email,
            password=make_password(password),
            first_name=first_name,
            last_name=last_name,
            phone=data.get('phone', '')
        )
        
        return user

    def update(self, id: int, data: Dict[str, Any]) -> User:
        """Update user profile."""
        user = self.repository.get_by_id(id)
        if not user:
            raise BusinessLogicException('User not found')
        
        # Fields that can be updated
        allowed_fields = ['first_name', 'last_name', 'phone', 'date_of_birth']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        return self.repository.update(user, **update_data)

    def change_password(self, user: User, old_password: str, new_password: str) -> bool:
        """Change user password."""
        if not user.check_password(old_password):
            raise ValidationException('Current password is incorrect', 'old_password')
        
        if len(new_password) < 8:
            raise ValidationException('New password must be at least 8 characters', 'new_password')
        
        user.set_password(new_password)
        user.save()
        return True

    def verify_email(self, user: User) -> User:
        """Mark user's email as verified."""
        return self.repository.verify_email(user)

    def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        return self.repository.get_by_email(email.lower().strip())

    def authenticate(self, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password."""
        user = self.get_by_email(email)
        if user and user.check_password(password) and user.is_active:
            return user
        return None

    def _is_valid_email(self, email: str) -> bool:
        """Validate email format."""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None


class AddressService(BaseService):
    """Service for address-related business logic."""
    
    def __init__(self):
        self.repository = AddressRepository()

    def create(self, data: Dict[str, Any]) -> Address:
        """Create a new address."""
        user = data.get('user')
        if not user:
            raise ValidationException('User is required')
        
        # Validate required fields
        required_fields = ['full_name', 'phone', 'address_line_1', 'city', 'state', 'postal_code']
        for field in required_fields:
            if not data.get(field):
                raise ValidationException(f'{field.replace("_", " ").title()} is required', field)
        
        # If this is the first address, make it default
        is_default = data.get('is_default', False)
        if not self.repository.get_user_addresses(user).exists():
            is_default = True
        
        address = self.repository.create(
            user=user,
            address_type=data.get('address_type', 'both'),
            full_name=data['full_name'],
            phone=data['phone'],
            address_line_1=data['address_line_1'],
            address_line_2=data.get('address_line_2', ''),
            city=data['city'],
            state=data['state'],
            postal_code=data['postal_code'],
            country=data.get('country', 'Pakistan'),
            is_default=is_default
        )
        
        return address

    def update(self, id: int, data: Dict[str, Any]) -> Address:
        """Update an address."""
        address = self.repository.get_by_id(id)
        if not address:
            raise BusinessLogicException('Address not found')
        
        # Fields that can be updated
        allowed_fields = [
            'full_name', 'phone', 'address_line_1', 'address_line_2',
            'city', 'state', 'postal_code', 'country', 'address_type', 'is_default'
        ]
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        return self.repository.update(address, **update_data)

    def get_user_addresses(self, user) -> list:
        """Get all addresses for a user."""
        return list(self.repository.get_user_addresses(user))

    def get_default_address(self, user) -> Optional[Address]:
        """Get user's default address."""
        return self.repository.get_default_address(user)

    def set_as_default(self, address_id: int, user) -> Address:
        """Set an address as default."""
        address = self.repository.get_by_id(address_id)
        if not address:
            raise BusinessLogicException('Address not found')
        
        if address.user != user:
            raise BusinessLogicException('Address does not belong to user')
        
        return self.repository.set_default(address)

    def delete_address(self, address_id: int, user) -> bool:
        """Soft delete an address."""
        address = self.repository.get_by_id(address_id)
        if not address:
            raise BusinessLogicException('Address not found')
        
        if address.user != user:
            raise BusinessLogicException('Address does not belong to user')
        
        # Soft delete
        self.repository.soft_delete(address)
        
        # If this was default, set another as default
        if address.is_default:
            other_address = self.repository.get_user_addresses(user).first()
            if other_address:
                self.repository.set_default(other_address)
        
        return True
