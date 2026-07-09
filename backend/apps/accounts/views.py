from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model

import logging
import secrets

from django.contrib.auth.hashers import make_password, check_password
from django.core.mail import send_mail
from django.conf import settings

from .models import Address, PasswordResetCode
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
    AddressSerializer,
    ChangePasswordSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
)

logger = logging.getLogger(__name__)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """User registration endpoint."""
    
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    """User login endpoint with JWT and cart merging."""
    
    serializer_class = CustomTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        # Merge guest cart with user cart after successful login
        if response.status_code == 200:
            self._merge_guest_cart_to_user(request)
        
        return response
    
    def _merge_guest_cart_to_user(self, request):
        """Merge guest session cart into authenticated user's cart."""
        from apps.orders.models import Cart, CartItem
        
        # Get guest cart from session
        session_id = request.session.session_key
        if not session_id:
            return
        
        try:
            guest_cart = Cart.objects.get(session_id=session_id, user__isnull=True)
            if guest_cart.items.count() == 0:
                return
            
            # Get user from validated data
            user_email = request.data.get('email')
            user = User.objects.get(email=user_email)
            
            # Get or create user cart
            user_cart, _ = Cart.objects.get_or_create(user=user)
            
            # Merge items
            for guest_item in guest_cart.items.all():
                user_item, created = CartItem.objects.get_or_create(
                    cart=user_cart,
                    product=guest_item.product,
                    defaults={'quantity': guest_item.quantity}
                )
                if not created:
                    # Item already exists, add quantities
                    user_item.quantity += guest_item.quantity
                    user_item.save()
            
            # Delete guest cart
            guest_cart.delete()
            
        except Cart.DoesNotExist:
            pass  # No guest cart to merge


class LogoutView(APIView):
    """User logout endpoint - blacklists refresh token."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'detail': 'Logged out successfully'}, status=status.HTTP_200_OK)
        except Exception:
            return Response({'detail': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(generics.RetrieveUpdateAPIView):
    """User profile endpoint."""
    
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """Change password endpoint."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'detail': 'Invalid old password'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'detail': 'Password changed successfully'})


GENERIC_RESET_MESSAGE = (
    'If an account with that email exists, a 6-digit reset code has been sent to it.'
)


class PasswordResetRequestView(APIView):
    """
    Step 1 — email a 6-digit reset code to the account (if it exists).
    Always returns a generic success so it can't reveal which emails are registered.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        user = User.objects.filter(email__iexact=email).first()
        if user:
            # Invalidate any earlier unused codes, then issue a fresh one.
            PasswordResetCode.objects.filter(user=user, is_used=False).update(is_used=True)
            code = f'{secrets.randbelow(1_000_000):06d}'
            PasswordResetCode.objects.create(user=user, code_hash=make_password(code))
            try:
                send_mail(
                    subject='Your Charmé password reset code',
                    message=(
                        f'Your Charmé password reset code is: {code}\n\n'
                        f'It expires in {PasswordResetCode.EXPIRY_MINUTES} minutes. '
                        'If you did not request this, you can ignore this email.'
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
            except Exception as exc:  # noqa: BLE001
                logger.error('Failed to send password reset email: %s', exc)

        return Response({'detail': GENERIC_RESET_MESSAGE})


class PasswordResetConfirmView(APIView):
    """
    Step 2 — verify the code and set the new password.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        code = serializer.validated_data['code']
        new_password = serializer.validated_data['new_password']

        invalid = Response(
            {'detail': 'Invalid or expired code.'}, status=status.HTTP_400_BAD_REQUEST
        )

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return invalid

        reset = (
            PasswordResetCode.objects
            .filter(user=user, is_used=False)
            .order_by('-created_at')
            .first()
        )
        if not reset or not reset.is_valid():
            return invalid

        if not check_password(code, reset.code_hash):
            reset.attempts += 1
            reset.save(update_fields=['attempts'])
            return invalid

        user.set_password(new_password)
        user.save()
        reset.is_used = True
        reset.save(update_fields=['is_used'])

        return Response({'detail': 'Password has been reset. You can now log in.'})


class AddressListCreateView(generics.ListCreateAPIView):
    """List and create addresses."""
    
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, delete address."""
    
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)
