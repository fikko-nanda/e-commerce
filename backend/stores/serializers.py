from rest_framework import serializers
from .models import Store

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


class AdminStoreSerializer(serializers.ModelSerializer):
    """Serializer khusus admin untuk memoderasi toko (termasuk status suspend)."""
    owner_email = serializers.ReadOnlyField(source='user.email')
    owner_username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Store
        fields = [
            'id', 'store_name', 'phone', 'address', 'status',
            'owner_email', 'owner_username', 'created_at'
        ]
        read_only_fields = ['id', 'store_name', 'phone', 'address', 'owner_email', 'owner_username', 'created_at']
