from rest_framework import viewsets, permissions, status, serializers
from rest_framework.response import Response
from orders.models import Order
from reviews.models import Review
from reviews.serializers import ReviewSerializer


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Only allow owners to edit/delete their reviews"""
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user == request.user


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.select_related('user', 'product').all()
    serializer_class = ReviewSerializer
    
    def get_permissions(self):
        if self.action in ['create']:
            self.permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['retrieve', 'list']:
            self.permission_classes = [permissions.AllowAny]
        else:
            self.permission_classes = [permissions.IsAuthenticated]
        return super().get_permissions()
    
    def get_queryset(self):
        queryset = Review.objects.select_related('user', 'product')
        
        # Filter by product_id if provided
        product_id = self.request.query_params.get('product', None)
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        
        return queryset
    
    def perform_create(self, serializer):
        user = self.request.user
        
        # Prevent duplicate reviews
        product_id = self.request.data.get('product')
        existing = Review.objects.filter(user=user, product_id=product_id).first()
        if existing:
            raise serializers.ValidationError("Anda sudah mereview produk ini")
        
        serializer.save(user=user)
