from rest_framework import serializers
from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    store_name = serializers.ReadOnlyField(source='store.store_name')
    store_user_id = serializers.ReadOnlyField(source='store.user_id')
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Product
        fields = ['id', 'store', 'store_name', 'store_user_id', 'name', 'price', 'stock', 'category', 'description', 'image', 'is_active', 'created_at']
        read_only_fields = ['id', 'store', 'store_user_id', 'created_at', 'is_active']