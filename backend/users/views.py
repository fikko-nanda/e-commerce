from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate
from .serializers import UserSerializer

User = get_user_model()


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
    """Endpoint login manual — mengembalikan user + JWT."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({'error': 'Email dan password wajib diisi.'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, username=email, password=password)
        if not user:
            return Response({'error': 'Email atau password salah.'}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
        }, status=status.HTTP_200_OK)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Endpoint untuk profil user aktif"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class GoogleAuthView(APIView):
    """Endpoint untuk autentikasi via Google Login"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        google_id = request.data.get('google_id')

        if not email or not google_id:
            return Response(
                {'error': 'Email dan google_id wajib diisi'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # 1. Cari user berdasarkan email
        user = User.objects.filter(email=email).first()

        if user:
            # Jika user sudah ada tetapi belum punya google_id, update google_id-nya
            if not user.google_id:
                user.google_id = google_id
                user.save()
        else:
            # Jika user belum ada, buat username unik dari email
            base_username = email.split('@')[0]
            username = base_username
            counter = 1
            
            # Mencegah bentrok username jika sudah terpakai
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1

            # Tentukan default role (pastikan Enum Role tersedia di User model)
            default_role = getattr(User.Role, 'BUYER', 'BUYER') if hasattr(User, 'Role') else 'BUYER'

            user = User.objects.create(
                email=email,
                username=username,
                google_id=google_id,
                role=default_role
            )

        # 2. Generate Token JWT
        refresh = RefreshToken.for_user(user)
        return Response({
            'status': 'success',
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)