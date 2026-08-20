from django.urls import path
from .views import (
    RegisterSellerView, MyStoreView,
    AdminStoreListView, AdminStoreStatusView
)

urlpatterns = [
    path('register/', RegisterSellerView.as_view(), name='seller_register'),
    path('me/', MyStoreView.as_view(), name='my_store'),

    # Admin: Manajemen Toko / Seller
    path('admin/', AdminStoreListView.as_view(), name='admin_store_list'),
    path('admin/<uuid:pk>/status/', AdminStoreStatusView.as_view(), name='admin_store_status'),
]