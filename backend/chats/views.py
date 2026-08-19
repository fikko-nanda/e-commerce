from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.db.models import Q
from users.models import User
from chats.models import Chat


class IsAuthenticatedOrReadOnly(permissions.BasePermission):
    """Allow read for anyone, but require auth for write"""
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated


class ChatViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'list':
            from chats.serializers import MessageListSerializer
            return MessageListSerializer
        return ChatSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        # Show all chats where user is sender or receiver
        queryset = Chat.objects.filter(
            Q(sender=user) | Q(receiver=user)
        ).select_related('sender', 'receiver').order_by('-timestamp')
        
        return queryset
    
    def perform_create(self, serializer):
        user = self.request.user
        
        # Get receiver from data
        receiver_id = self.request.data.get('receiver')
        if not receiver_id:
            raise serializers.ValidationError("Receiver ID diperlukan")
        
        try:
            receiver = User.objects.get(id=receiver_id)
        except User.DoesNotExist:
            raise serializers.ValidationError("Receiver tidak ditemukan")
        
        serializer.save(sender=user, receiver=receiver)
    
    @action(detail=True, methods=['patch'])
    def read(self, request, *args, **kwargs):
        chat = self.get_object()
        chat.read = True
        chat.save()
        return Response({'message': 'Pesan ditandai sebagai dibaca'})


# WebSocket consumer untuk real-time chat
class ChatConsumer:
    async def connect(self):
        self.room_group_name = f'chat_{self.scope["user"].id}'
        
        # Accept websocket connection
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        # Leave group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel
        )
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data['message']
        receiver_id = data['receiver_id']
        
        # Create database chat
        sender = self.scope['user']
        receiver = await sync_to_async(User.objects.get)(id=receiver_id)
        
        chat = await sync_to_async(Chat.objects.create)(
            sender=sender,
            receiver=receiver,
            message=message,
        )
        
        # Send message to both groups
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'sender_id': sender.id,
                'receiver_id': receiver_id,
                'chat_id': chat.id,
            }
        )
    
    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message'],
            'sender_id': event['sender_id'],
            'receiver_id': event['receiver_id'],
            'chat_id': event['chat_id'],
        }))
