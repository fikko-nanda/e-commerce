from rest_framework import serializers
from .models import User, Store


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'role', 'google_id']


class StoreRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = ['store_name', 'phone', 'address']

    def validate_store_name(self, value):
        forbidden_words = ['admin', 'official', 'penipu', 'toxic']
        for word in forbidden_words:
            if word in value.lower():
                raise serializers.ValidationError(f"Nama toko tidak boleh mengandung kata '{word}'.")
        return value