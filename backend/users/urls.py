from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import RegisterView, UserProfileView, GoogleAuthView

urlpatterns = [
    # Auth Standard & JWT
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Social Login & Profile
    path('google/', GoogleAuthView.as_view(), name='google_auth'),
    path('me/', UserProfileView.as_view(), name='user_profile'),
]