from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied
from .models import Review
from .serializers import ReviewSerializer


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all().select_related('user', 'product', 'product__store', 'order')
    serializer_class = ReviewSerializer

    def get_permissions(self):
        # Membaca ulasan bisa dilakukan siapa saja (Public)
        # Membuat/Mengedit/Menghapus ulasan wajib Login (Authenticated)
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # 1. Filter berdasarkan product_id (Untuk halaman Detail Produk)
        # Contoh: GET /api/reviews/?product=<product_id>
        product_id = self.request.query_params.get('product')
        if product_id:
            queryset = queryset.filter(product_id=product_id)

        # 2. Filter khusus Toko/Seller (Untuk Dashboard Penjual)
        # Contoh: GET /api/reviews/?store_me=true atau GET /api/reviews/?store=<store_id>
        store_me = self.request.query_params.get('store_me')
        store_id = self.request.query_params.get('store')

        if store_me and hasattr(self.request.user, 'store'):
            queryset = queryset.filter(product__store=self.request.user.store)
        elif store_id:
            queryset = queryset.filter(product__store_id=store_id)

        return queryset.order_by('-created_at')

    def perform_destroy(self, instance):
        # Admin / Staff boleh menghapus review siapa pun (moderasi konten)
        user = self.request.user
        is_admin = getattr(user, 'role', None) == 'admin' or getattr(user, 'is_staff', False)
        
        if not is_admin and instance.user != user:
            raise PermissionDenied("Anda tidak memiliki izin untuk menghapus ulasan ini.")
        
        instance.delete()