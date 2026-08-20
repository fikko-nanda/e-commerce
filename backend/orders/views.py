import time
import hashlib
import midtransclient
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from products.models import Product
from .models import Order
from .serializers import OrderCreateSerializer, OrderDetailSerializer


class CheckoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        shipping_address = request.data.get('shipping_address') or 'Alamat tidak diisi / Ambil di tempat'
        serializer = OrderCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        try:
            product = Product.objects.get(id=data['product_id'])
        except Product.DoesNotExist:
            return Response({'error': 'Produk tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)

        if product.stock < data['quantity']:
            return Response({'error': 'Stok produk tidak mencukupi.'}, status=status.HTTP_400_BAD_REQUEST)

        total_price = product.price * data['quantity']

        order = Order.objects.create(
            buyer=request.user,
            store=product.store,
            product=product,
            quantity=data['quantity'],
            total_price=total_price,
            payment_method=data['payment_method'],
            payment_status=Order.PaymentStatus.PENDING,
            shipping_address=shipping_address,
        )

        product.stock -= data['quantity']
        product.save()

        snap_token = None
        redirect_url = None

        if data['payment_method'] == Order.PaymentMethod.MIDTRANS:
            if not settings.MIDTRANS_SERVER_KEY:
                order.delete()
                product.stock += data['quantity']
                product.save()
                return Response({'error': 'Midtrans server key belum dikonfigurasi.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

            snap = midtransclient.Snap(
                is_production=settings.MIDTRANS_IS_PRODUCTION,
                server_key=settings.MIDTRANS_SERVER_KEY
            )

            # Suffix timestamp agar order_id Midtrans unik setiap checkout
            midtrans_order_id = f"{order.id}-{int(time.time())}"

            param = {
                "transaction_details": {
                    "order_id": midtrans_order_id,
                    "gross_amount": int(total_price)
                },
                "customer_details": {
                    "email": request.user.email,
                    "first_name": request.user.username,
                },
                "item_details": [{
                    "id": str(product.id),
                    "price": int(product.price),
                    "quantity": data['quantity'],
                    "name": product.name[:50]
                }]
            }

            try:
                transaction = snap.create_transaction(param)
                snap_token = transaction['token']
                redirect_url = transaction['redirect_url']
            except Exception as e:
                order.delete()
                product.stock += data['quantity']
                product.save()
                return Response({'error': f'Midtrans Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            'status': 'success',
            'order': OrderDetailSerializer(order, context={'request': request}).data,
            'snap_token': snap_token,
            'redirect_url': redirect_url
        }, status=status.HTTP_201_CREATED)


class MidtransWebhookView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        data = request.data

        order_id = data.get('order_id')
        status_code = data.get('status_code')
        gross_amount = data.get('gross_amount')
        signature_key = data.get('signature_key')
        transaction_status = data.get('transaction_status')
        fraud_status = data.get('fraud_status')

        # Verifikasi signature key Midtrans
        raw_signature = f"{order_id}{status_code}{gross_amount}{settings.MIDTRANS_SERVER_KEY}"
        calc_signature = hashlib.sha512(raw_signature.encode('utf-8')).hexdigest()

        if calc_signature != signature_key:
            return Response({'error': 'Invalid Signature Key'}, status=status.HTTP_400_BAD_REQUEST)

        real_order_id = order_id.rsplit('-', 1)[0] if '-' in str(order_id) else order_id

        try:
            order = Order.objects.get(id=real_order_id)
        except Order.DoesNotExist:
            return Response({'error': 'Order ID tidak ditemukan'}, status=status.HTTP_404_NOT_FOUND)

        if transaction_status in ['capture', 'settlement']:
            if fraud_status == 'challenge':
                order.payment_status = Order.PaymentStatus.PENDING
            else:
                order.payment_status = Order.PaymentStatus.PAID
        elif transaction_status in ['cancel', 'deny', 'expire']:
            if order.payment_status != Order.PaymentStatus.FAILED:
                order.product.stock += order.quantity
                order.product.save()
            order.payment_status = Order.PaymentStatus.FAILED
        elif transaction_status == 'pending':
            order.payment_status = Order.PaymentStatus.PENDING

        order.save()
        return Response({'status': 'OK'}, status=status.HTTP_200_OK)


class MyOrdersView(APIView):
    """GET /orders/ — daftar pesanan pembeli yang login + auto-sync status Midtrans."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(buyer=request.user).select_related('store', 'product').order_by('-created_at')

        # Auto-sync status ke Midtrans jika ada order yang masih PENDING
        if getattr(settings, 'MIDTRANS_SERVER_KEY', None):
            try:
                snap = midtransclient.Snap(
                    is_production=getattr(settings, 'MIDTRANS_IS_PRODUCTION', False),
                    server_key=settings.MIDTRANS_SERVER_KEY
                )

                for order in orders:
                    if order.payment_status == Order.PaymentStatus.PENDING and order.payment_method == Order.PaymentMethod.MIDTRANS:
                        try:
                            # 1. Coba pencarian status dengan UUID murni
                            status_resp = snap.transactions.notification(str(order.id))
                            trx_status = status_resp.get('transaction_status')
                            fraud_status = status_resp.get('fraud_status')

                            if trx_status in ['capture', 'settlement'] and fraud_status != 'challenge':
                                order.payment_status = Order.PaymentStatus.PAID
                                order.save()
                            elif trx_status in ['cancel', 'deny', 'expire']:
                                order.payment_status = Order.PaymentStatus.FAILED
                                order.save()
                        except Exception:
                            pass
            except Exception as e:
                print(f"Error Midtrans Sync: {str(e)}")

        serializer = OrderDetailSerializer(orders, many=True, context={'request': request})
        return Response({'data': serializer.data}, status=status.HTTP_200_OK)


class StoreOrdersView(APIView):
    """GET /orders/store-orders/ — daftar pesanan masuk ke toko seller."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, 'store'):
            return Response({'error': 'Anda tidak memiliki toko.'}, status=status.HTTP_403_FORBIDDEN)
        orders = Order.objects.filter(store=request.user.store).select_related('buyer', 'product').order_by('-created_at')
        serializer = OrderDetailSerializer(orders, many=True, context={'request': request})
        return Response({'data': serializer.data}, status=status.HTTP_200_OK)


class OrderDetailView(APIView):
    """GET /orders/<id>/ — detail order (buyer atau seller toko bersangkutan)."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        order = get_object_or_404(Order.objects.select_related('store', 'product', 'buyer'), pk=pk)
        if order.buyer != request.user and order.store.user != request.user:
            return Response({'error': 'Anda tidak berhak melihat pesanan ini.'}, status=status.HTTP_403_FORBIDDEN)
        return Response({'data': OrderDetailSerializer(order, context={'request': request}).data}, status=status.HTTP_200_OK)


class UpdateShippingView(APIView):
    """PATCH /orders/<id>/ship/ — seller update resi & status pengiriman."""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        order = get_object_or_404(Order.objects.select_related('store', 'product'), pk=pk)
        if order.store.user != request.user:
            return Response({'error': 'Anda tidak berhak mengubah pesanan ini.'}, status=status.HTTP_403_FORBIDDEN)

        courier_name = request.data.get('courier_name')
        tracking_number = request.data.get('tracking_number')
        shipping_status = request.data.get('shipping_status')

        if courier_name:
            order.courier_name = courier_name
        if tracking_number:
            order.tracking_number = tracking_number
        if shipping_status in [Order.ShippingStatus.SHIPPED, Order.ShippingStatus.DELIVERED]:
            order.shipping_status = shipping_status

        order.save()
        return Response({'status': 'success', 'data': OrderDetailSerializer(order, context={'request': request}).data}, status=status.HTTP_200_OK)


class OrderPayView(APIView):
    """POST /orders/<id>/pay/ — regenerate Midtrans snap token untuk order pending."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        order = get_object_or_404(Order.objects.select_related('store', 'product'), pk=pk)
        if order.buyer != request.user:
            return Response({'error': 'Pesanan bukan milik Anda.'}, status=status.HTTP_403_FORBIDDEN)

        if order.payment_status != Order.PaymentStatus.PENDING:
            return Response({'error': 'Pesanan ini tidak dalam status menunggu pembayaran.'}, status=status.HTTP_400_BAD_REQUEST)

        if order.payment_method != Order.PaymentMethod.MIDTRANS:
            return Response({'error': 'Hanya metode Midtrans yang dapat dibayar ulang.'}, status=status.HTTP_400_BAD_REQUEST)

        if not settings.MIDTRANS_SERVER_KEY:
            return Response({'error': 'Midtrans server key belum dikonfigurasi.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        snap = midtransclient.Snap(
            is_production=settings.MIDTRANS_IS_PRODUCTION,
            server_key=settings.MIDTRANS_SERVER_KEY
        )

        midtrans_order_id = f"{order.id}-{int(time.time())}"

        param = {
            "transaction_details": {
                "order_id": midtrans_order_id,
                "gross_amount": int(order.total_price)
            },
            "customer_details": {
                "email": request.user.email,
                "first_name": request.user.username,
            },
            "item_details": [{
                "id": str(order.product.id),
                "price": int(order.product.price),
                "quantity": order.quantity,
                "name": order.product.name[:50]
            }]
        }

        try:
            transaction = snap.create_transaction(param)
            return Response({
                'status': 'success',
                'snap_token': transaction['token'],
                'redirect_url': transaction['redirect_url']
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': f'Midtrans Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class OrderPaySuccessView(APIView):
    """POST /orders/<id>/success/ — Dipanggil frontend ketika pembayaran Snap sukses"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        order = get_object_or_404(Order, pk=pk, buyer=request.user)
        if order.payment_status == Order.PaymentStatus.PENDING:
            order.payment_status = Order.PaymentStatus.PAID
            order.save()
        return Response({
            'status': 'success',
            'data': OrderDetailSerializer(order, context={'request': request}).data
        }, status=status.HTTP_200_OK)