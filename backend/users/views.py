from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from django.contrib.auth import get_user_model
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from .serializers import UserSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """Endpoint untuk pendaftaran user manual"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Endpoint untuk profil user aktif"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class GoogleAuthView(APIView):
    """Endpoint autentikasi Google OAuth 2.0 (Google Identity Services).

    Frontend mengirim credential (ID Token JWT) yang diterbitkan Google,
    backend memverifikasi tanda tangannya memakai kunci publik Google
    via google-auth. Hanya email yang sudah diverifikasi yang diterima.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        credential = request.data.get('token') or request.data.get('credential')

        if not credential:
            return Response(
                {'error': 'Token Google wajib diisi'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not settings.GOOGLE_CLIENT_ID:
            return Response(
                {'error': 'GOOGLE_CLIENT_ID belum dikonfigurasi di backend'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Verifikasi: signature, kedaluwarsa, dan aud (client_id) dicek otomatis
        try:
            info = id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )
        except ValueError as e:
            return Response(
                {'error': f'Token Google tidak valid: {e}'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        google_id = info.get('sub')
        email = (info.get('email') or '').strip().lower()

        if not email or not google_id:
            return Response(
                {'error': 'Email atau google_id tidak ada di token'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not info.get('email_verified'):
            return Response(
                {'error': 'Email Google belum diverifikasi'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 1. Cari user berdasarkan google_id (source of truth)
        user = User.objects.filter(google_id=google_id).first()

        # 2. Fallback: cocokkan email, hanya jika google_id belum dipakai user lain
        if user is None:
            existing = User.objects.filter(email=email).first()
            if existing:
                if existing.google_id:
                    return Response(
                        {'error': 'Akun ini sudah terhubung dengan akun Google lain'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                # Link google_id ke akun email yang sama (identitas terverifikasi Google)
                user = existing
                user.google_id = google_id
                user.save(update_fields=['google_id'])
            else:
                # Buat user baru, username unik dari email
                base_username = (email.split('@')[0][:30] or 'user').lower()
                username = base_username
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}{counter}"
                    counter += 1
                user = User.objects.create(
                    email=email,
                    username=username,
                    google_id=google_id,
                    role=User.Role.BUYER,
                )

        # 3. Generate token JWT
        refresh = RefreshToken.for_user(user)
        return Response({
            'status': 'success',
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
            'user': UserSerializer(user).data,
        }, status=status.HTTP_200_OK)