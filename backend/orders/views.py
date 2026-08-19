import logging
from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from orders.models import Order
from orders.serializers import OrderCreateSerializer, OrderDetailSerializer, OrderListSerializer

logger = logging.getLogger(__name__)


class CheckoutView(generics.CreateAPIView):
    """Create new order/checkout"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OrderCreateSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            order = serializer.save()
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        response_data = {
            'order_id': order.id,
            'message': 'Order berhasil dibuat'
        }

        # Generate Midtrans Snap token untuk pembayaran via gateway
        if order.payment_method == 'midtrans':
            snap_token = self._create_snap_token(order)
            if snap_token:
                response_data['snap_token'] = snap_token
            else:
                response_data['message'] = (
                    'Order dibuat, tetapi token pembayaran Midtrans gagal digenerate. '
                    'Pastikan MIDTRANS_SERVER_KEY dan MIDTRANS_CLIENT_KEY sudah diisi di .env'
                )

        return Response(response_data, status=status.HTTP_201_CREATED)

    def _create_snap_token(self, order):
        """Generate Snap token via Midtrans API. Return None kalau gagal."""
        from midtransclient import Snap

        if not (settings.MIDTRANS_SERVER_KEY and settings.MIDTRANS_CLIENT_KEY):
            return None

        try:
            snap = Snap(
                is_production=settings.MIDTRANS_IS_PRODUCTION,
                server_key=settings.MIDTRANS_SERVER_KEY,
                client_key=settings.MIDTRANS_CLIENT_KEY,
            )

            param = {
                "transaction_details": {
                    "order_id": str(order.id),
                    "gross_amount": int(order.total_price),
                },
                "credit_card": {
                    "secure": True
                },
                "customer_details": {
                    "first_name": order.buyer.username,
                    "email": order.buyer.email,
                },
                "item_details": [{
                    "id": str(order.product.id),
                    "price": int(order.product.price),
                    "quantity": order.quantity,
                    "name": order.product.name[:50],
                }],
            }

            transaction = snap.create_transaction(param)
            return transaction['token']
        except Exception:
            logger.exception('Gagal generate Snap token untuk order %s', order.id)
            return None


class MyOrdersView(generics.ListAPIView):
    """Get all orders by current buyer"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OrderListSerializer
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'store'):
            # If user is seller, show their store's orders
            return Order.objects.filter(store=user.store).select_related('product', 'store')
        else:
            # Regular buyer
            return Order.objects.filter(buyer=user).select_related('product', 'store')


class StoreOrdersView(generics.ListAPIView):
    """Get orders from seller's store"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OrderListSerializer
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'store'):
            return Order.objects.filter(store=user.store).select_related('product', 'store')
        return Order.objects.none()


class OrderDetailView(generics.RetrieveAPIView):
    """Get single order detail"""
    queryset = Order.objects.select_related('product', 'store', 'buyer')
    serializer_class = OrderDetailSerializer


class CancelOrderView(generics.UpdateAPIView):
    """Cancel order by buyer (if not paid)"""
    queryset = Order.objects.all()
    serializer_class = OrderDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def update(self, request, *args, **kwargs):
        order = self.get_object()
        
        # Check ownership
        if order.buyer != request.user and not hasattr(request.user, 'store'):
            return Response({'error': 'Anda tidak bisa cancel order ini'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        # Can only cancel pending orders
        if order.payment_status != 'PENDING':
            return Response({'error': 'Tidak bisa cancel order yang sudah dibayar'},
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Mark as cancelled
        order.payment_status = 'EXPIRED'
        order.shipping_status = 'PENDING'
        order.save()
        
        # Restore stock
        order.product.stock += order.quantity
        order.product.save()
        
        return Response({'message': 'Order berhasil dibatalkan'})
