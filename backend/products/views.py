from rest_framework import generics, permissions, status, serializers
from rest_framework.response import Response
from django.db.models import Q
from stores.models import Store
from products.models import Product
from reviews.models import Review
from products.serializers import (
    ProductCreateSerializer, 
    ProductSimpleSerializer, 
    ProductDetailSerializer
)


class ProductListCreateView(generics.ListCreateAPIView):
    queryset = Product.objects.filter(is_active=True).select_related('store')
    serializer_class = ProductSimpleSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            self.permission_classes = [permissions.IsAuthenticated]
        else:
            self.permission_classes = [permissions.AllowAny]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProductCreateSerializer
        return ProductSimpleSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        queryset = Product.objects.filter(is_active=True).select_related('store')

        # ?mine=true -> hanya produk dari toko user yang login (seller dashboard)
        if self.request.query_params.get('mine') and self.request.user.is_authenticated:
            queryset = queryset.filter(store__user=self.request.user)

        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__iexact=category)

        search = self.request.query_params.get('name', '')
        if search:
            queryset = queryset.filter(name__icontains=search)

        return queryset
    
    def perform_create(self, serializer):
        user = self.request.user
        
        if not hasattr(user, 'store'):
            raise serializers.ValidationError({
                'error': 'Anda harus menjadi seller terlebih dahulu untuk membuat produk'
            })
        
        serializer.save()


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Single product detail view"""
    queryset = Product.objects.select_related('store')
    serializer_class = ProductDetailSerializer


class ProductCreateView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ProductCreateSerializer
    
    def perform_create(self, serializer):
        user = self.request.user
        try:
            store = Store.objects.get(user=user)
            serializer.save(store=store)
        except Store.DoesNotExist:
            raise serializers.ValidationError({
                'error': 'Anda belum memiliki toko. Silakan daftar sebagai seller terlebih dahulu.'
            })
