import os
from django.contrib.auth import authenticate, get_user_model
from google.auth.transport import requests
from google.oauth2 import id_token
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from core.permissions import IsAdminRole
from .serializers import UserSerializer, AdminUserSerializer

User = get_user_model()


def verify_google_token_and_get_user(raw_token):
    """
    Helper function untuk memverifikasi Google ID Token secara aman di sisi server
    dan mengembalikan instance User (membuat baru jika belum ada).
    """
    client_id = os.getenv('GOOGLE_CLIENT_ID')
    if not client_id:
        raise ValueError('Konfigurasi GOOGLE_CLIENT_ID belum diatur di server.')

    # Verifikasi token dengan Google API Library
    id_info = id_token.verify_oauth2_token(
        raw_token,
        requests.Request(),
        client_id
    )

    # Validasi audience & issuer
    if id_info.get('aud') != client_id:
        raise ValueError('Token audience tidak cocok dengan Client ID.')
    
    if id_info.get('iss') not in ['accounts.google.com', 'https://accounts.google.com']:
        raise ValueError('Token issuer tidak valid.')

    email = id_info.get('email')
    if not email:
        raise ValueError('Token Google tidak mengandung informasi email.')

    google_id = id_info.get('sub')

    # Cari user berdasarkan email
    user = User.objects.filter(email=email).first()

    if user:
        # Perbarui google_id jika belum terhubung / berubah
        if getattr(user, 'google_id', None) != google_id:
            user.google_id = google_id
            user.save(update_fields=['google_id'])
    else:
        # Buat username unik dari bagian email sebelum @
        base_username = email.split('@')[0]
        username = base_username
        counter = 1

        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        default_role = getattr(User.Role, 'BUYER', 'BUYER') if hasattr(User, 'Role') else 'BUYER'

        user = User.objects.create(
            email=email,
            username=username,
            google_id=google_id,
            role=default_role
        )

    return user


class RegisterView(APIView):
    """Endpoint untuk pendaftaran user manual — mengembalikan user + JWT."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserSerializer(user).data,
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """Endpoint login — mendukung kredensial manual (email/password) maupun Google token."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        google_token = request.data.get('google_token') or request.data.get('token')

        # 1. Alur Login via Google Token
        if google_token:
            try:
                user = verify_google_token_and_get_user(google_token)
                if not user.is_active:
                    return Response(
                        {'error': 'Akun Anda telah ditangguhkan. Silakan hubungi admin.'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                refresh = RefreshToken.for_user(user)
                return Response({
                    'status': 'success',
                    'user': UserSerializer(user).data,
                    'access_token': str(refresh.access_token),
                    'refresh_token': str(refresh),
                }, status=status.HTTP_200_OK)
            except ValueError as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({'error': f'Terjadi kesalahan server: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # 2. Alur Login Manual (Email & Password)
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({'error': 'Email dan password wajib diisi.'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, username=email, password=password)
        if not user:
            return Response({'error': 'Email atau password salah.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response(
                {'error': 'Akun Anda telah ditangguhkan. Silakan hubungi admin.'},
                status=status.HTTP_403_FORBIDDEN
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
        }, status=status.HTTP_200_OK)


class GoogleAuthView(APIView):
    """Endpoint terpisah khusus autentikasi via Google ID Token."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get('token') or request.data.get('google_token')

        if not token:
            return Response({'error': 'Google token wajib diisi.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = verify_google_token_and_get_user(token)
            if not user.is_active:
                return Response(
                    {'error': 'Akun Anda telah ditangguhkan. Silakan hubungi admin.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            refresh = RefreshToken.for_user(user)

            return Response({
                'status': 'success',
                'user': UserSerializer(user).data,
                'access_token': str(refresh.access_token),
                'refresh_token': str(refresh),
            }, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': f'Terjadi kesalahan server: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Endpoint untuk mengambil dan memperbarui profil user aktif."""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


# ============================================================
# ADMIN: Manajemen User
# ============================================================


class AdminUserListView(APIView):
    """GET /auth/admin/users/ — daftar seluruh user (hanya admin)."""
    permission_classes = [IsAdminRole]

    def get(self, request):
        users = User.objects.all().order_by('-date_joined')
        role = request.query_params.get('role')
        if role:
            users = users.filter(role=role)
        serializer = AdminUserSerializer(users, many=True)
        return Response({'data': serializer.data}, status=status.HTTP_200_OK)


class AdminUserSuspendView(APIView):
    """PATCH /auth/admin/users/<id>/suspend/ — toggle status aktif user (hanya admin)."""
    permission_classes = [IsAdminRole]

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)

        if user == request.user:
            return Response(
                {'error': 'Admin tidak dapat menangguhkan akun sendiri.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Menerima 'is_active' (bool) atau 'action' ('suspend'/'unsuspend')
        action = request.data.get('action')
        is_active = request.data.get('is_active')

        if action:
            if action == 'suspend':
                user.is_active = False
            elif action == 'unsuspend':
                user.is_active = True
            else:
                return Response(
                    {'error': 'Action harus berupa "suspend" atau "unsuspend".'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        elif isinstance(is_active, bool):
            user.is_active = is_active
        else:
            return Response(
                {'error': 'Kirim "action" (suspend/unsuspend) atau "is_active" (boolean).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.save(update_fields=['is_active'])
        return Response({
            'status': 'success',
            'message': f'User {user.email} berhasil {"ditangguhkan" if not user.is_active else "diaktifkan kembali"}.',
            'user': AdminUserSerializer(user).data
        }, status=status.HTTP_200_OK)
