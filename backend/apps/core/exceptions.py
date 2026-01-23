"""
Custom exception handlers for the API.
"""

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler that formats all errors consistently.
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    if response is not None:
        custom_response_data = {
            'success': False,
            'error': {
                'code': response.status_code,
                'message': get_error_message(response.data),
                'details': response.data
            }
        }
        response.data = custom_response_data
    else:
        # Handle unhandled exceptions
        logger.exception(f"Unhandled exception: {exc}")
        response = Response(
            {
                'success': False,
                'error': {
                    'code': status.HTTP_500_INTERNAL_SERVER_ERROR,
                    'message': 'An unexpected error occurred. Please try again later.',
                    'details': None
                }
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return response


def get_error_message(data):
    """
    Extract a user-friendly error message from the response data.
    """
    if isinstance(data, dict):
        if 'detail' in data:
            return str(data['detail'])
        if 'non_field_errors' in data:
            return str(data['non_field_errors'][0])
        # Get the first error message
        for key, value in data.items():
            if isinstance(value, list) and len(value) > 0:
                return f"{key}: {value[0]}"
            elif isinstance(value, str):
                return f"{key}: {value}"
    elif isinstance(data, list) and len(data) > 0:
        return str(data[0])
    return 'An error occurred'


class BusinessLogicException(Exception):
    """
    Exception for business logic errors in the service layer.
    """
    def __init__(self, message, code=None):
        self.message = message
        self.code = code or 'BUSINESS_ERROR'
        super().__init__(self.message)


class PaymentException(Exception):
    """
    Exception for payment-related errors.
    """
    def __init__(self, message, provider=None, code=None):
        self.message = message
        self.provider = provider
        self.code = code or 'PAYMENT_ERROR'
        super().__init__(self.message)


class ValidationException(Exception):
    """
    Exception for validation errors in the service layer.
    """
    def __init__(self, message, field=None):
        self.message = message
        self.field = field
        super().__init__(self.message)
