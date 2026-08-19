from django.urls import path
from .views import RegisterSellerView

urlpatterns = [
    path('register/', RegisterSellerView.as_view(), name='seller_register'),
]