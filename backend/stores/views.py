from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, serializers
from core.permissions import IsAdminRole
from .models import Store
from .serializers import StoreRegistrationSerializer, AdminStoreSerializer


class StoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = ['id', 'store_name', 'phone', 'address', 'status', 'created_at']
        read_only_fields = fields


class RegisterSellerView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user

        if hasattr(user, 'store'):
            return Response({'error': 'Anda sudah terdaftar sebagai penjual.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = StoreRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            phone = serializer.validated_data['phone']
            store_status = Store.Status.ACTIVE

            if not phone.startswith('08') or len(phone) < 10:
                store_status = Store.Status.PENDING_REVIEW

            store = Store.objects.create(
                user=user,
                store_name=serializer.validated_data['store_name'],
                phone=phone,
                address=serializer.validated_data['address'],
                status=store_status
            )

            if store_status == Store.Status.ACTIVE:
                user.role = user.Role.SELLER
                user.save()

            return Response({
                'status': 'success',
                'message': 'Pendaftaran toko berhasil diproses.',
                'store': StoreSerializer(store).data
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MyStoreView(APIView):
    """GET /stores/me/ — info toko milik user yang login (atau null)."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        store = getattr(request.user, 'store', None)
        if not store:
            return Response({'store': None}, status=status.HTTP_200_OK)
        return Response({'store': StoreSerializer(store).data}, status=status.HTTP_200_OK)


class StoreUserByStoreNameView(APIView):
    """GET /stores/user-by-name/?store_name=<name> — dapatkan user UUID penjual dari nama toko."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        store_name = request.query_params.get('store_name')
        if not store_name:
            return Response({'error': 'store_name query param required'}, status=status.HTTP_400_BAD_REQUEST)
        
        store = Store.objects.filter(store_name__iexact=store_name).first()
        if not store:
            return Response({'error': 'Toko tidak ditemukan'}, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'user_id': str(store.user.id),
            'store_name': store.store_name,
            'user_email': store.user.email,
        }, status=status.HTTP_200_OK)


# ============================================================
# ADMIN: Manajemen Toko / Seller
# ============================================================


class AdminStoreListView(APIView):
    """GET /stores/admin/ — daftar seluruh toko (hanya admin)."""
    permission_classes = [IsAdminRole]

    def get(self, request):
        stores = Store.objects.select_related('user').order_by('-created_at')
        status_filter = request.query_params.get('status')
        if status_filter:
            stores = stores.filter(status=status_filter)
        serializer = AdminStoreSerializer(stores, many=True)
        return Response({'data': serializer.data}, status=status.HTTP_200_OK)


class AdminStoreStatusView(APIView):
    """PATCH /stores/admin/<id>/status/ — ubah status toko (hanya admin)."""
    permission_classes = [IsAdminRole]

    VALID_STATUSES = {
        'active': Store.Status.ACTIVE,
        'pending_review': Store.Status.PENDING_REVIEW,
        'rejected': Store.Status.REJECTED,
        'suspended': Store.Status.SUSPENDED,
    }

    def patch(self, request, pk):
        try:
            store = Store.objects.select_related('user').get(pk=pk)
        except Store.DoesNotExist:
            return Response({'error': 'Toko tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        if new_status not in self.VALID_STATUSES:
            return Response(
                {'error': 'Status tidak valid. Pilih: active, pending_review, rejected, atau suspended.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        store.status = self.VALID_STATUSES[new_status]
        store.save(update_fields=['status'])

        # Sinkronkan role user: seller hanya jika toko aktif
        user = store.user
        if store.status == Store.Status.ACTIVE:
            user.role = 'seller'
        elif store.status == Store.Status.SUSPENDED and user.role == 'seller':
            # Turunkan role seller jika tokonya disuspend
            user.role = 'buyer'
        user.save(update_fields=['role'])

        return Response({
            'status': 'success',
            'message': f'Toko {store.store_name} kini berstatus: {store.status}.',
            'store': AdminStoreSerializer(store).data
        }, status=status.HTTP_200_OK)
