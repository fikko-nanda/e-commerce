from rest_framework import serializers
from reviews.models import Review


class ReviewSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source='user.email')
    product_name = serializers.ReadOnlyField(source='product.name')
    
    class Meta:
        model = Review
        fields = ['id', 'user_email', 'product_name', 'product', 'order',
                  'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'created_at', 'user']
    
    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating harus antara 1-5")
        return value
    
    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['user'] = request.user
        
        return super().create(validated_data)
    
    def validate(self, data):
        # Prevent duplicate reviews from same user for same product
        user = self.context.get('request').user if hasattr(self, 'context') else None
        product_id = data.get('product') or self.initial_data.get('product')
        
        if user and product_id:
            existing = Review.objects.filter(
                user=user,
                product_id=product_id
            ).first()
            
            if existing:
                raise serializers.ValidationError("Anda sudah mereview produk ini")
        
        return data


class ReviewSimpleSerializer(serializers.ModelSerializer):
    """Simplified for listing"""
    user_email = serializers.ReadOnlyField(source='user.email')
    product_name = serializers.ReadOnlyField(source='product.name')
    
    class Meta:
        model = Review
        fields = ['id', 'user_email', 'product_name', 'rating', 'comment']
