from rest_framework import serializers
from django.contrib.auth.models import AnonymousUser
from users.models import User
from stores.models import Store


class StoreSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.email')
    
    class Meta:
        model = Store
        fields = ['id', 'store_name', 'phone', 'address', 'status', 'created_at', 'user']
        read_only_fields = ['id', 'created_at', 'user']


class StoreDetailSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.email')
    
    class Meta:
        model = Store
        fields = ['id', 'store_name', 'phone', 'address', 'status', 
                  'created_at', 'user']


class StoreRegistrationSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(write_only=True)
    
    class Meta:
        model = Store
        fields = ['store_name', 'phone', 'address', 'status', 'user_email']
    
    def validate_store_name(self, value):
        forbidden_words = ['admin', 'moderator', 'system', 'support']
        for word in forbidden_words:
            if word in value.lower():
                raise serializers.ValidationError(f"Nama toko tidak boleh mengandung kata '{word}'")
        return value
    
    def create(self, validated_data):
        email = validated_data.pop('user_email')
        user = User.objects.get(email=email)
        
        if hasattr(user, 'store'):
            raise serializers.ValidationError("Anda sudah memiliki toko")
        
        validated_data['user'] = user
        return super().create(validated_data)


class StoreUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = ['store_name', 'phone', 'address', 'status']
