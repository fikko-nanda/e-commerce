from rest_framework import serializers
from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    store_name = serializers.ReadOnlyField(source='store.store_name')

    class Meta:
        model = Product
        fields = ['id', 'store', 'store_name', 'name', 'price', 'stock', 'is_active', 'created_at']
        read_only_fields = ['id', 'store', 'created_at']