from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import ContactMessage
from .serializers import ContactMessageSerializer


class ContactMessageView(APIView):
    """
    API endpoint for submitting contact messages
    Public endpoint - no authentication required
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Submit a new contact message"""
        serializer = ContactMessageSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    'success': True,
                    'message': 'Thank you for your message! We will get back to you soon.',
                    'data': serializer.data
                },
                status=status.HTTP_201_CREATED
            )
        
        return Response(
            {
                'success': False,
                'message': 'Please check your input and try again.',
                'errors': serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )
