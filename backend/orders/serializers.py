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
    product_image = serializers.SerializerMethodField()
    store_name = serializers.ReadOnlyField(source='store.store_name')
    buyer_email = serializers.ReadOnlyField(source='buyer.email', default=None)
    buyer_username = serializers.ReadOnlyField(source='buyer.username', default=None)
    buyer_address = serializers.ReadOnlyField(source='buyer.address', default=None)

    class Meta:
        model = Order
        fields = [
            'id', 'buyer', 'buyer_email', 'buyer_username', 'buyer_address',
            'store', 'store_name', 'product', 'product_name', 'product_image',
            'quantity', 'total_price', 'payment_method', 'payment_status',
            'shipping_status', 'courier_name', 'tracking_number', 'created_at'
        ]
        # Menggunakan tuple/list langsung dari field model untuk read_only_fields
        read_only_fields = [
            'id', 'buyer', 'store', 'product', 'quantity', 'total_price',
            'payment_method', 'payment_status', 'shipping_status',
            'courier_name', 'tracking_number', 'created_at'
        ]

    def get_product_image(self, obj):
        try:
            if obj.product and obj.product.image and hasattr(obj.product.image, 'url'):
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.product.image.url)
                return obj.product.image.url
        except Exception:
            return None
        return None