import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from django.contrib.auth import get_user_model


User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        
        # Group name based on user ID
        if self.user.is_authenticated:
            self.room_group_name = f'user_{self.user.id}'
            
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            
            await self.accept()
        else:
            await self.close()
    
    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get('message', '')
        receiver_id = data.get('receiver_id')
        
        if not message or not receiver_id:
            await self.send(text_data=json.dumps({
                'error': 'Message and receiver_id required'
            }))
            return
        
        # Create chat in database
        try:
            receiver = await sync_to_async(User.objects.get)(id=receiver_id)
        except User.DoesNotExist:
            await self.send(text_data=json.dumps({
                'error': 'Receiver not found'
            }))
            return
        
        chat = await sync_to_async(Chat.objects.create)(
            sender=self.user,
            receiver=receiver,
            message=message
        )
        
        # Send to receiver's group
        receiver_group = f'user_{receiver_id}'
        await self.channel_layer.group_send(
            receiver_group,
            {
                'type': 'chat_message',
                'sender_id': str(self.user.id),
                'sender_email': self.user.email,
                'message': message,
                'chat_id': str(chat.id),
            }
        )
    
    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'sender_id': event['sender_id'],
            'sender_email': event['sender_email'],
            'message': event['message'],
            'chat_id': event['chat_id'],
        }))
