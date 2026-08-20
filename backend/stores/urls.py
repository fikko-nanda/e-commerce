from django.urls import path
from .views import RegisterSellerView, MyStoreView

urlpatterns = [
    path('register/', RegisterSellerView.as_view(), name='seller_register'),
    path('me/', MyStoreView.as_view(), name='my_store'),
]