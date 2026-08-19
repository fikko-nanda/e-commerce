import hashlib
import midtransclient
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from products.models import Product
from .models import Order
from .serializers import OrderCreateSerializer, OrderDetailSerializer


class CheckoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        product = Product.objects.get(id=data['product_id'])
        
        if product.stock < data['quantity']:
            return Response({'error': 'Stok produk tidak mencukupi.'}, status=status.HTTP_400_BAD_REQUEST)

        # Hitung Total Harga
        total_price = product.price * data['quantity']

        # 1. Buat Record Order di DB
        order = Order.objects.create(
            buyer=request.user,
            store=product.store,
            product=product,
            quantity=data['quantity'],
            total_price=total_price,
            payment_method=data['payment_method'],
            payment_status=Order.PaymentStatus.PENDING
        )

        # Potong stok produk
        product.stock -= data['quantity']
        product.save()

        # 2. Jika Payment Method = Midtrans, Generate Snap Token
        snap_token = None
        redirect_url = None

        if data['payment_method'] == Order.PaymentMethod.MIDTRANS:
            snap = midtransclient.Snap(
                is_production=settings.MIDTRANS_IS_PRODUCTION,
                server_key=settings.MIDTRANS_SERVER_KEY
            )

            param = {
                "transaction_details": {
                    "order_id": str(order.id),
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
                return Response({'error': f'Midtrans Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            'status': 'success',
            'order': OrderDetailSerializer(order).data,
            'snap_token': snap_token,
            'redirect_url': redirect_url
        }, status=status.HTTP_201_CREATED)


class MidtransWebhookView(APIView):
    permission_classes = [permissions.AllowAny]  # Harus public agar Midtrans bisa memanggil

    def post(self, request):
        data = request.data
        
        order_id = data.get('order_id')
        status_code = data.get('status_code')
        gross_amount = data.get('gross_amount')
        signature_key = data.get('signature_key')
        transaction_status = data.get('transaction_status')
        fraud_status = data.get('fraud_status')

        # 1. Validasi Signature Key demi Keamanan
        raw_signature = f"{order_id}{status_code}{gross_amount}{settings.MIDTRANS_SERVER_KEY}"
        calc_signature = hashlib.sha512(raw_signature.encode('utf-8')).hexdigest()

        if calc_signature != signature_key:
            return Response({'error': 'Invalid Signature Key'}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Cari Order di Database
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response({'error': 'Order ID tidak ditemukan'}, status=status.HTTP_404_NOT_FOUND)

        # 3. Update Status Pembayaran
        if transaction_status in ['capture', 'settlement']:
            if fraud_status == 'challenge':
                order.payment_status = Order.PaymentStatus.PENDING
            else:
                order.payment_status = Order.PaymentStatus.PAID
        elif transaction_status in ['cancel', 'deny', 'expire']:
            order.payment_status = Order.PaymentStatus.FAILED
            # Kembalikan stok produk jika gagal/batal
            order.product.stock += order.quantity
            order.product.save()
        elif transaction_status == 'pending':
            order.payment_status = Order.PaymentStatus.PENDING

        order.save()
        return Response({'status': 'OK'}, status=status.HTTP_200_OK)