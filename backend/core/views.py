from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, Store
from .serializers import UserSerializer, StoreRegistrationSerializer


# 1. Google OAuth Simulasi / Login Instan (Buyer)
class GoogleAuthView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        google_id = request.data.get('google_id')

        if not email or not google_id:
            return Response({'error': 'Email dan google_id wajib diisi'}, status=status.HTTP_400_BAD_REQUEST)

        # Get or Create User
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email.split('@')[0],
                'google_id': google_id,
                'role': User.Role.BUYER
            }
        )

        # Generate JWT Token
        refresh = RefreshToken.for_user(user)
        return Response({
            'status': 'success',
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
            'user': UserSerializer(user).data
        })


# 2. Hybrid Onboarding Seller
class RegisterSellerView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user

        if hasattr(user, 'store'):
            return Response({'error': 'Anda sudah terdaftar sebagai penjual.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = StoreRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            # Algoritma Pengecekan Otomatis (Hybrid Onboarding)
            phone = serializer.validated_data['phone']
            store_status = Store.Status.ACTIVE

            # Jika nomor HP terdeteksi anomali/mencurigakan -> Pending Review Admin
            if not phone.startswith('08') or len(phone) < 10:
                store_status = Store.Status.PENDING_REVIEW

            store = Store.objects.create(
                user=user,
                store_name=serializer.validated_data['store_name'],
                phone=phone,
                address=serializer.validated_data['address'],
                status=store_status
            )

            # Ubah role user menjadi SELLER jika disetujui otomatis
            if store_status == Store.Status.ACTIVE:
                user.role = User.Role.SELLER
                user.save()

            return Response({
                'status': 'success',
                'message': 'Pendaftaran toko berhasil diproses.',
                'store_status': store.status
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)