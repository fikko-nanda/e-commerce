from rest_framework import viewsets, permissions, mixins
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
        # Mendukung filter ulasan berdasarkan product_id di URL query parameter
        # Contoh: /api/reviews/?product=<product_id>
        product_id = self.request.query_params.get('product')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset

    def perform_destroy(self, instance):
        # Admin boleh menghapus review siapa pun (moderasi konten)
        is_admin = getattr(self.request.user, 'role', None) == 'admin'
        if not is_admin and instance.user != self.request.user:
            raise PermissionDenied("Anda tidak memiliki izin untuk menghapus ulasan ini.")
        instance.delete()