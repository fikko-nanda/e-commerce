from rest_framework import serializers
from orders.models import Order
from products.models import Product


class OrderCreateSerializer(serializers.ModelSerializer):
    """Serializer untuk checkout/create order"""
    product_id = serializers.CharField(write_only=True)
    
    class Meta:
        model = Order
        fields = ['product_id', 'quantity', 'payment_method', 
                 'shipping_address', 'courier_name']
    
    def validate_product_id(self, value):
        # Convert string UUID to actual product
        try:
            product = Product.objects.get(id=value)
            if not product.is_active:
                raise serializers.ValidationError("Produk tidak tersedia")
            return product.id
        except Product.DoesNotExist:
            raise serializers.ValidationError("Produk tidak ditemukan")
    
    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity harus lebih besar dari 0")
        return value
    
    def create(self, validated_data):
        user = self.context['request'].user
        product_id = validated_data.pop('product_id')
        
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            raise serializers.ValidationError({"error": "Produk tidak ditemukan"})
        
        # Check stock
        if product.stock < validated_data['quantity']:
            raise serializers.ValidationError({
                'error': f'Stok tidak cukup. Tersedia: {product.stock}'
            })
        
        # Calculate total price
        total_price = product.price * validated_data['quantity']
        validated_data['buyer'] = user
        validated_data['store'] = product.store
        validated_data['product'] = product
        validated_data['total_price'] = total_price
        validated_data['payment_status'] = 'PENDING'
        
        # Decrease stock
        product.stock -= validated_data['quantity']
        product.save()
        
        return super().create(validated_data)


class OrderDetailSerializer(serializers.ModelSerializer):
    """Full order details"""
    product_name = serializers.ReadOnlyField(source='product.name')
    store_name = serializers.ReadOnlyField(source='store.store_name')
    buyer_email = serializers.ReadOnlyField(source='buyer.email')
    
    class Meta:
        model = Order
        fields = [
            'id', 'product_name', 'store_name', 'buyer_email',
            'quantity', 'total_price', 'payment_method',
            'payment_status', 'shipping_status',
            'shipping_address', 'courier_name', 'tracking_number',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class OrderListSerializer(serializers.ModelSerializer):
    """Simplified for listing"""
    product_name = serializers.ReadOnlyField(source='product.name')
    store_name = serializers.ReadOnlyField(source='store.store_name')
    
    class Meta:
        model = Order
        fields = [
            'id', 'product_name', 'store_name', 'quantity',
            'total_price', 'payment_status', 'shipping_status',
            'created_at'
        ]
