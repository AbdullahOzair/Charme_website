from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from .models import Address

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """User serializer for profile operations."""
    
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'phone', 'date_joined']
        read_only_fields = ['id', 'email', 'date_joined']


class RegisterSerializer(serializers.ModelSerializer):
    """User registration serializer."""
    
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['email', 'password', 'password_confirm', 'first_name', 'last_name', 'phone']
    
    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match'})
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        return User.objects.create_user(**validated_data)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT token serializer that includes user data."""
    
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data


class AddressSerializer(serializers.ModelSerializer):
    """Address serializer."""
    
    class Meta:
        model = Address
        fields = ['id', 'full_name', 'phone', 'address_line1', 'address_line2', 
                  'city', 'state', 'postal_code', 'country', 'address_type', 
                  'is_default', 'created_at']
        read_only_fields = ['id', 'created_at']


class ChangePasswordSerializer(serializers.Serializer):
    """Change password serializer."""
    
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
