from django.urls import path
from .views import (
    CheckoutView, MidtransWebhookView, MyOrdersView,
    StoreOrdersView, OrderDetailView, UpdateShippingView, OrderPayView,OrderPaySuccessView
)

urlpatterns = [
    path('', MyOrdersView.as_view(), name='my_orders'),
    path('checkout/', CheckoutView.as_view(), name='checkout'),
    path('notification/', MidtransWebhookView.as_view(), name='midtrans_notification'),
    path('store-orders/', StoreOrdersView.as_view(), name='store_orders'),
    path('<uuid:pk>/', OrderDetailView.as_view(), name='order_detail'),
    path('<uuid:pk>/ship/', UpdateShippingView.as_view(), name='update_shipping'),
    path('<uuid:pk>/pay/', OrderPayView.as_view(), name='order_pay'),
    path('<uuid:pk>/success/', OrderPaySuccessView.as_view(), name='order-success'),
]