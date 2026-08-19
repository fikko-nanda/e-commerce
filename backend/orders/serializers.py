from rest_framework import serializers
from .models import Order
from products.models import Product


class OrderCreateSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)
    payment_method = serializers.ChoiceField(choices=Order.PaymentMethod.choices)

    def validate_product_id(self, value):
        try:
            product = Product.objects.get(id=value, is_active=True)
        except Product.DoesNotExist:
            raise serializers.ValidationError("Produk tidak ditemukan atau tidak aktif.")
        
        if product.stock <= 0:
            raise serializers.ValidationError("Stok produk telah habis.")
            
        return value


class OrderDetailSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    store_name = serializers.ReadOnlyField(source='store.store_name')

    class Meta:
        model = Order
        fields = [
            'id', 'buyer', 'store', 'store_name', 'product', 'product_name',
            'quantity', 'total_price', 'payment_method', 'payment_status',
            'shipping_status', 'created_at'
        ]
        read_only_fields = fields