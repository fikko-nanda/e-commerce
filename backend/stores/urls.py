from django.urls import path, include
from rest_framework.routers import DefaultRouter
from stores.views import StoreViewSet, SellerStoreView

router = DefaultRouter()
router.register(r'', StoreViewSet, basename='store')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', SellerStoreView.as_view({'post': 'register'}), name='store-register'),
]
