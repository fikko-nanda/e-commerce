from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.core.cache import cache
from .models import Product
from .serializers import ProductSerializer


class ProductListCreateView(APIView):

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get(self, request):
        cache_key = 'product_list_active'
        cached_data = cache.get(cache_key)

        # Cek jika cache tidak None (termasuk jika nilainya list kosong [])
        if cached_data is not None:
            return Response({'source': 'cache', 'data': cached_data}, status=status.HTTP_200_OK)

        products = Product.objects.filter(is_active=True, stock__gt=0).select_related('store')
        serializer = ProductSerializer(products, many=True)
        
        # Simpan ke cache selama 60 detik (meskipun data masih kosong)
        cache.set(cache_key, serializer.data, timeout=60)

        return Response({'source': 'database', 'data': serializer.data}, status=status.HTTP_200_OK)

    def post(self, request):
        if not hasattr(request.user, 'store'):
            return Response({'error': 'Hanya pemilik toko yang dapat menambahkan produk.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = ProductSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(store=request.user.store)
            
            # Invalidasi cache saat ada produk baru
            cache.delete('product_list_active')

            return Response({'status': 'success', 'data': serializer.data}, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)