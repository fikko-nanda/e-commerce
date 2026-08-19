from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import Store
from .serializers import StoreRegistrationSerializer

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
                'store_status': store.status
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)