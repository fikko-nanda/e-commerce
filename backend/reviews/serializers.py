from rest_framework import serializers
from .models import Review
from orders.models import Order


class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    order_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = Review
        fields = ['id', 'username', 'product', 'order_id', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'username', 'product', 'created_at']

    def validate(self, attrs):
        user = self.context['request'].user
        order_id = attrs.get('order_id')

        # 1. Pastikan Order ada dan milik user tersebut
        try:
            order = Order.objects.get(id=order_id, buyer=user)
        except Order.DoesNotExist:
            raise serializers.ValidationError({"order_id": "Pesanan tidak ditemukan atau bukan milik Anda."})

        # 2. Pastikan status pembayaran pesanan sudah PAID
        if order.payment_status != Order.PaymentStatus.PAID:
            raise serializers.ValidationError({"order_id": "Anda hanya dapat mengulas produk dari pesanan yang sudah lunas."})

        # 3. Pastikan pesanan belum pernah diulas
        if hasattr(order, 'review'):
            raise serializers.ValidationError({"order_id": "Pesanan ini sudah pernah diberi ulasan."})

        attrs['order_instance'] = order
        return attrs

    def create(self, validated_data):
        order = validated_data.pop('order_instance')
        validated_data.pop('order_id')
        
        review = Review.objects.create(
            user=self.context['request'].user,
            product=order.product,
            order=order,
            **validated_data
        )
        return review