from rest_framework import serializers
from .models import Review
from orders.models import Order


class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    product_name = serializers.ReadOnlyField(source='product.name')
    store_name = serializers.ReadOnlyField(source='product.store.store_name')
    
    # Gunakan PrimaryKeyRelatedField agar otomatis menyesuaikan tipe ID (UUID atau Integer)
    order_id = serializers.PrimaryKeyRelatedField(
        queryset=Order.objects.all(), 
        write_only=True, 
        source='order'
    )

    class Meta:
        model = Review
        fields = ['id', 'username', 'product', 'product_name', 'store_name', 'order_id', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'username', 'product', 'product_name', 'store_name', 'created_at']

    def validate(self, attrs):
        user = self.context['request'].user
        order = attrs.get('order')

        # 1. Pastikan Order adalah milik user yang sedang login
        if order.buyer != user:
            raise serializers.ValidationError({"order_id": "Pesanan tidak ditemukan atau bukan milik Anda."})

        # 2. Validasi status pembayaran (Mendukung 'PAID', 'paid', atau metode 'COD')
        pay_status = str(getattr(order, 'payment_status', '')).upper()
        pay_method = str(getattr(order, 'payment_method', '')).upper()
        
        if pay_status != 'PAID' and pay_method != 'COD':
            raise serializers.ValidationError({"order_id": "Anda hanya dapat mengulas produk dari pesanan yang sudah lunas atau COD."})

        # 3. Pastikan pesanan belum pernah diulas
        if Review.objects.filter(order=order).exists():
            raise serializers.ValidationError({"order_id": "Pesanan ini sudah pernah diberi ulasan."})

        return attrs

    def create(self, validated_data):
        order = validated_data['order']
        
        review = Review.objects.create(
            user=self.context['request'].user,
            product=order.product,
            **validated_data
        )
        return review