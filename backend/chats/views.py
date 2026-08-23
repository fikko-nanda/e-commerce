from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.db.models import Q
from django.contrib.auth import get_user_model
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Chat
from .serializers import ChatSerializer

User = get_user_model()


def get_room_name(user1_id, user2_id):
    ids = sorted([str(user1_id), str(user2_id)])
    return f"chat_{ids[0]}_{ids[1]}"

class ChatListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        store_name = request.query_params.get('store')
        with_user_id = request.query_params.get('with_user_id')
        qs = Chat.objects.filter(
            Q(sender=request.user) | Q(receiver=request.user)
        ).select_related('sender', 'receiver')

        # Ambil satu percakapan dengan user tertentu
        if with_user_id:
            try:
                other = User.objects.get(id=with_user_id)
            except (User.DoesNotExist, ValueError):
                return Response({'error': 'with_user_id tidak valid'}, status=status.HTTP_400_BAD_REQUEST)
            qs = qs.filter(Q(sender=other) | Q(receiver=other))
        elif store_name:
            try:
                from stores.models import Store
                store = Store.objects.filter(store_name__iexact=store_name).first()
                if store:
                    qs = qs.filter(Q(sender=store.user) | Q(receiver=store.user))
            except Exception:
                pass

        qs = qs.order_by('timestamp')[:200]
        return Response({'data': ChatSerializer(qs, many=True).data})


class ChatCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        message = request.data.get('message', '').strip()
        
        # Tangkap semua kemungkinan key dari frontend (receiver, receiver_id, atau store_name)
        receiver_input = (
            request.data.get('receiver') or 
            request.data.get('receiver_id') or 
            request.data.get('store_name')
        )

        if not message:
            return Response({'error': 'message wajib diisi'}, status=status.HTTP_400_BAD_REQUEST)

        if not receiver_input:
            return Response({'error': 'receiver wajib diisi'}, status=status.HTTP_400_BAD_REQUEST)

        receiver = None

        # 1. Cari berdasarkan ID User (UUID / Integer)
        try:
            receiver = User.objects.filter(id=receiver_input).first()
        except Exception:
            pass

        # 2. Cari berdasarkan Email (pencarian persis / exact)
        if not receiver:
            receiver = User.objects.filter(email__iexact=str(receiver_input)).first()

        # 3. Cari berdasarkan Nama Toko (Store)
        if not receiver:
            try:
                from stores.models import Store
                # Cek pencarian persis nama toko
                store = Store.objects.filter(store_name__iexact=str(receiver_input)).first()
                
                # Jika tidak ketemu, coba hilangkan karakter underscore (reverse slugify)
                if not store and '_' in str(receiver_input):
                    normal_name = str(receiver_input).replace('_', ' ')
                    store = Store.objects.filter(store_name__iexact=normal_name).first()
                
                if store:
                    receiver = store.user
            except Exception:
                pass

        # 4. Fallback: Cari berdasarkan Email mengandung substring / Username
        if not receiver:
            receiver = User.objects.filter(
                Q(email__icontains=str(receiver_input)) | Q(username__iexact=str(receiver_input))
            ).first()

        # Gagal menemukan receiver
        if not receiver:
            return Response({'error': 'receiver tidak ditemukan'}, status=status.HTTP_400_BAD_REQUEST)

        # Mencegah kirim chat ke diri sendiri
        if receiver == request.user:
            return Response({'error': 'tidak dapat mengirim pesan ke diri sendiri'}, status=status.HTTP_400_BAD_REQUEST)

        # Buat objek Chat
        chat = Chat.objects.create(
            sender=request.user,
            receiver=receiver,
            message=message
        )

        # Push ke WebSocket group agar receiver dapat pesan real-time
        try:
            room = get_room_name(request.user.id, receiver.id)
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                room,
                {
                    'type': 'chat_message',
                    'id': str(chat.id),
                    'message': message,
                    'sender_id': str(request.user.id),
                    'sender_email': request.user.email,
                    'receiver_id': str(receiver.id),
                    'timestamp': chat.timestamp.isoformat(),
                }
            )
        except Exception:
            pass  # WebSocket push bersifat best-effort

        return Response({'data': ChatSerializer(chat).data}, status=status.HTTP_201_CREATED)


class ChatRoomNameView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        other_user_id = request.query_params.get('user_id')
        if not other_user_id:
            return Response({'error': 'user_id query param required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            other_user = User.objects.get(id=other_user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        if other_user == request.user:
            return Response({'error': 'Cannot chat with yourself'}, status=status.HTTP_400_BAD_REQUEST)

        room_name = get_room_name(request.user.id, other_user.id)
        ws_url = f"ws://{request.get_host()}/ws/chat/{room_name}/"

        return Response({
            'room_name': room_name,
            'ws_url': ws_url,
            'other_user': {
                'id': str(other_user.id),
                'email': other_user.email,
                'username': other_user.username,
            }
        })