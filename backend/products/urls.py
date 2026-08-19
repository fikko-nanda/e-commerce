from django.urls import path, include
from products.views import ProductListCreateView, ProductDetailView

urlpatterns = [
    path('', ProductListCreateView.as_view(), name='product-list'),
    path('<str:pk>/', ProductDetailView.as_view(), name='product-detail'),
]
