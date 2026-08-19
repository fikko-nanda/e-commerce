from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg
from users.models import User
from stores.models import Store
from stores.serializers import (
    StoreSerializer, 
    StoreDetailSerializer, 
    StoreRegistrationSerializer,
    StoreUpdateSerializer
)


class IsSellerOrReadOnly(permissions.BasePermission):
    """Custom permission to only allow sellers to create/edit"""
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role == 'SELLER'
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user == request.user


# ViewSets for Stores API
class StoreViewSet(viewsets.ModelViewSet):
    queryset = Store.objects.select_related('user').all()
    serializer_class = StoreSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'destroy']:
            self.permission_classes = [permissions.IsAuthenticated]
        else:
            self.permission_classes = [permissions.AllowAny]
        return super().get_permissions()
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return StoreDetailSerializer
        elif self.action == 'update':
            return StoreUpdateSerializer
        return StoreSerializer
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """Get current user's store"""
        if not hasattr(request.user, 'store'):
            return Response(
                {"error": "Anda belum memiliki toko"},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = StoreDetailSerializer(request.user.store)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def register(self, request):
        """Register a new store as seller"""
        serializer = StoreRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            
            if serializer.validated_data['user_email'] != user.email:
                return Response({"error": "Email tidak cocok dengan user yang login"}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            if hasattr(user, 'store'):
                return Response({"error": "Anda sudah memiliki toko"}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            store = serializer.save(user=user, status='PENDING_REVIEW')
            return Response({
                'id': store.id,
                'message': 'Toko terdaftar dan menunggu review admin',
                'store_name': store.store_name
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SellerStoreView(viewsets.ModelViewSet):
    """Get/update own store as seller"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Store.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        return StoreSerializer
