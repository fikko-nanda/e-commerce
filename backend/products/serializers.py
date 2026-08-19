from rest_framework import serializers
from products.models import Product
from stores.serializers import StoreSerializer


class ProductSimpleSerializer(serializers.ModelSerializer):
    store_name = serializers.ReadOnlyField(source='store.store_name')

    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'stock', 'image', 'category', 'store_name']


class ProductDetailSerializer(serializers.ModelSerializer):
    store = StoreSerializer(read_only=True)
    store_name = serializers.ReadOnlyField(source='store.store_name')

    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'stock',
                  'image', 'category', 'is_active', 'store', 'store_name', 'created_at']


class ProductCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'stock', 'image', 'category']
        read_only_fields = ['id']
        
    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                from stores.models import Store
                store = Store.objects.get(user=request.user)
                validated_data['store'] = store
            except Store.DoesNotExist:
                raise serializers.ValidationError({
                    'error': 'Anda harus memiliki toko terlebih dahulu untuk membuat produk'
                })
        return super().create(validated_data)
