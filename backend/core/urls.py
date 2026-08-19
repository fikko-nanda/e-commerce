from django.urls import path
from .views import GoogleAuthView, RegisterSellerView

urlpatterns = [
    path('auth/google/', GoogleAuthView.as_view(), name='google_auth'),
    path('auth/seller/register/', RegisterSellerView.as_view(), name='seller_register'),
]