from django.urls import path
from orders.views import CheckoutView, MyOrdersView, StoreOrdersView, OrderDetailView, CancelOrderView

urlpatterns = [
    path('checkout/', CheckoutView.as_view(), name='order-checkout'),
    path('', MyOrdersView.as_view(), name='order-list'),
    path('store-orders/', StoreOrdersView.as_view(), name='store-orders'),
    path('<str:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('<str:pk>/cancel/', CancelOrderView.as_view(), name='order-cancel'),
]
