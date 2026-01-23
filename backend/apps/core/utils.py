"""
Utility functions and helpers.
"""

import uuid
import hashlib
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict


def generate_order_number() -> str:
    """Generate a unique order number."""
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    unique_id = uuid.uuid4().hex[:6].upper()
    return f"CHM-{timestamp}-{unique_id}"


def generate_transaction_id() -> str:
    """Generate a unique transaction ID."""
    return f"TXN-{uuid.uuid4().hex[:12].upper()}"


def calculate_percentage(amount: Decimal, percentage: Decimal) -> Decimal:
    """Calculate percentage of an amount."""
    return (amount * percentage) / Decimal('100')


def format_currency(amount: Decimal, currency: str = 'PKR') -> str:
    """Format amount as currency string."""
    if currency == 'PKR':
        return f"Rs. {amount:,.2f}"
    elif currency == 'USD':
        return f"${amount:,.2f}"
    return f"{currency} {amount:,.2f}"


def hash_string(value: str) -> str:
    """Create SHA256 hash of a string."""
    return hashlib.sha256(value.encode()).hexdigest()


def sanitize_phone_number(phone: str) -> str:
    """Sanitize and format phone number for Pakistan."""
    # Remove all non-digit characters
    digits = ''.join(filter(str.isdigit, phone))
    
    # Handle different formats
    if digits.startswith('92'):
        return f"+{digits}"
    elif digits.startswith('0'):
        return f"+92{digits[1:]}"
    elif len(digits) == 10:
        return f"+92{digits}"
    
    return phone


def paginate_queryset(queryset, page: int = 1, page_size: int = 12) -> Dict[str, Any]:
    """
    Manually paginate a queryset.
    Returns dict with items and pagination info.
    """
    total = queryset.count()
    start = (page - 1) * page_size
    end = start + page_size
    
    return {
        'items': queryset[start:end],
        'pagination': {
            'page': page,
            'page_size': page_size,
            'total_items': total,
            'total_pages': (total + page_size - 1) // page_size,
            'has_next': end < total,
            'has_previous': page > 1
        }
    }
