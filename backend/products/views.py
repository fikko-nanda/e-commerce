from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.core.cache import cache
from django.shortcuts import get_object_or_404
from .models import Product
from .serializers import ProductSerializer


def _invalidate_product_cache():
    """LocMemCache tidak punya delete_pattern; gunakan clear() untuk dev."""
    try:
        cache.clear()
    except Exception:
        cache.delete('product_list_active')


class ProductListCreateView(APIView):

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get(self, request):
        mine = request.query_params.get('mine') == 'true'
        category = request.query_params.get('category')

        # Endpoint khusus seller: produk milik toko saya
        if mine:
            if not request.user.is_authenticated:
                return Response({'error': 'Harus login terlebih dahulu.'}, status=status.HTTP_401_UNAUTHORIZED)
            if not hasattr(request.user, 'store'):
                return Response({'data': []}, status=status.HTTP_200_OK)
            products = Product.objects.filter(store=request.user.store).select_related('store')
            serializer = ProductSerializer(products, many=True)
            return Response({'source': 'database', 'data': serializer.data}, status=status.HTTP_200_OK)

        cache_key = 'product_list_active'
        if category:
            cache_key = f'product_list_{category.lower()}'

        cached_data = cache.get(cache_key)

        if cached_data is not None:
            return Response({'source': 'cache', 'data': cached_data}, status=status.HTTP_200_OK)

        products = Product.objects.filter(is_active=True, stock__gt=0, store__status='active').select_related('store')
        if category:
            products = products.filter(category__iexact=category)
        serializer = ProductSerializer(products, many=True)

        cache.set(cache_key, serializer.data, timeout=60)

        return Response({'source': 'database', 'data': serializer.data}, status=status.HTTP_200_OK)

    def post(self, request):
        if not hasattr(request.user, 'store'):
            return Response({'error': 'Hanya pemilik toko yang dapat menambahkan produk.'}, status=status.HTTP_403_FORBIDDEN)

        if request.user.store.status != 'active':
            return Response({'error': 'Toko Anda belum aktif. Produk hanya bisa ditambahkan oleh toko yang sudah aktif.'}, status=status.HTTP_403_FORBIDDEN)

        # Dukung multipart (upload gambar) & JSON
        data = request.data
        serializer = ProductSerializer(data=data)
        if serializer.is_valid():
            serializer.save(store=request.user.store)
            _invalidate_product_cache()
            return Response({'status': 'success', 'data': serializer.data}, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProductDetailView(APIView):
    # Set default permission ke AllowAny agar DRF tidak memblokir di awal saat tidak ada token
    permission_classes = [permissions.AllowAny]

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_object(self, pk):
        return get_object_or_404(Product.objects.select_related('store'), pk=pk)

    def get(self, request, pk):
        product = self.get_object(pk)
        serializer = ProductSerializer(product)
        return Response({'data': serializer.data}, status=status.HTTP_200_OK)

    def put(self, request, pk):
        product = self.get_object(pk)
        if product.store.user != request.user:
            return Response({'error': 'Anda tidak berhak mengubah produk ini.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = ProductSerializer(product, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            _invalidate_product_cache()
            return Response({'status': 'success', 'data': serializer.data}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        product = self.get_object(pk)
        if product.store.user != request.user:
            return Response({'error': 'Anda tidak berhak menghapus produk ini.'}, status=status.HTTP_403_FORBIDDEN)

        product.delete()
        _invalidate_product_cache()
        return Response({'status': 'deleted'}, status=status.HTTP_204_NO_CONTENT)