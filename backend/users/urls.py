from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, UserProfileView, GoogleAuthView,
    AdminUserListView, AdminUserSuspendView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', LoginView.as_view(), name='auth_login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('google/', GoogleAuthView.as_view(), name='google_auth'),
    path('me/', UserProfileView.as_view(), name='user_profile'),

    # Admin: Manajemen User
    path('admin/users/', AdminUserListView.as_view(), name='admin_user_list'),
    path('admin/users/<uuid:pk>/suspend/', AdminUserSuspendView.as_view(), name='admin_user_suspend'),
]