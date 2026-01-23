"""
Base classes for the 3-layer architecture.
"""

from abc import ABC, abstractmethod
from typing import TypeVar, Generic, List, Optional, Any
from django.db.models import QuerySet, Model

T = TypeVar('T', bound=Model)


class BaseRepository(ABC, Generic[T]):
    """
    Base repository class implementing common data access patterns.
    Repository Layer - Handles all database operations.
    """
    model: T = None

    def get_by_id(self, id: int) -> Optional[T]:
        """Get a single record by ID."""
        try:
            return self.model.objects.get(id=id)
        except self.model.DoesNotExist:
            return None

    def get_all(self) -> QuerySet[T]:
        """Get all records."""
        return self.model.objects.all()

    def get_active(self) -> QuerySet[T]:
        """Get all active records (if model has is_active field)."""
        return self.model.objects.filter(is_active=True)

    def create(self, **kwargs) -> T:
        """Create a new record."""
        return self.model.objects.create(**kwargs)

    def update(self, instance: T, **kwargs) -> T:
        """Update an existing record."""
        for key, value in kwargs.items():
            setattr(instance, key, value)
        instance.save()
        return instance

    def delete(self, instance: T) -> bool:
        """Delete a record."""
        instance.delete()
        return True

    def soft_delete(self, instance: T) -> T:
        """Soft delete a record (if model has is_active field)."""
        instance.is_active = False
        instance.save()
        return instance

    def filter_by(self, **kwargs) -> QuerySet[T]:
        """Filter records by given criteria."""
        return self.model.objects.filter(**kwargs)

    def exists(self, **kwargs) -> bool:
        """Check if a record exists."""
        return self.model.objects.filter(**kwargs).exists()

    def count(self, **kwargs) -> int:
        """Count records matching criteria."""
        if kwargs:
            return self.model.objects.filter(**kwargs).count()
        return self.model.objects.count()

    def bulk_create(self, objects: List[T]) -> List[T]:
        """Create multiple records at once."""
        return self.model.objects.bulk_create(objects)

    def bulk_update(self, objects: List[T], fields: List[str]) -> int:
        """Update multiple records at once."""
        return self.model.objects.bulk_update(objects, fields)


class BaseService(ABC):
    """
    Base service class for business logic.
    Service Layer - Contains all business logic and validation.
    """
    repository = None

    def get_by_id(self, id: int) -> Optional[Any]:
        """Get an entity by ID."""
        return self.repository.get_by_id(id)

    def get_all(self) -> QuerySet:
        """Get all entities."""
        return self.repository.get_all()

    @abstractmethod
    def create(self, data: dict) -> Any:
        """Create a new entity. Must be implemented by subclass."""
        pass

    @abstractmethod
    def update(self, id: int, data: dict) -> Any:
        """Update an entity. Must be implemented by subclass."""
        pass

    def delete(self, id: int) -> bool:
        """Delete an entity."""
        instance = self.repository.get_by_id(id)
        if instance:
            return self.repository.delete(instance)
        return False
