import json
import uuid
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Chat

User = get_user_model()


def get_room_name(user1_id, user2_id):
    """Generate consistent room name from two user IDs (sorted)."""
    ids = sorted([str(user1_id), str(user2_id)])
    return f"chat_{ids[0]}_{ids[1]}"


def parse_room_name(room_name):
    """Extract the two participant UUIDs from a room name, or None if invalid."""
    if not room_name or not room_name.startswith('chat_'):
        return None
    parts = room_name[len('chat_'):].split('_')
    if len(parts) != 2:
        return None
    try:
        return sorted([str(uuid.UUID(p)) for p in parts])
    except (ValueError, AttributeError):
        return None


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        # group name == room name (sudah diawali 'chat_'; jangan tambah prefix lagi)
        self.room_group_name = self.room_name

        user = self.scope.get('user')
        self.user = user if user and not user.is_anonymous else None

        if not self.user:
            await self.close(code=4001)  # belum login / token tidak valid
            return

        # Validasi room: nama harus berisi dua UUID dan user harus salah satunya
        participants = parse_room_name(self.room_name)
        if not participants:
            await self.close(code=4003)  # format room tidak valid
            return
        self.other_user_id = None
        if str(self.user.id) not in participants:
            await self.close(code=4002)  # bukan peserta room
            return
        self.other_user_id = participants[0] if participants[1] == str(self.user.id) else participants[1]

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name') and hasattr(self, 'user') and self.user:
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({'error': 'Invalid JSON'}))
            return

        message = (data.get('message') or '').strip()
        receiver_id = data.get('receiver_id') or self.other_user_id

        if not message:
            await self.send(text_data=json.dumps({'error': 'message wajib diisi'}))
            return

        if not receiver_id:
            await self.send(text_data=json.dumps({'error': 'receiver_id wajib diisi'}))
            return

        sender_id = str(self.user.id)

        if str(receiver_id) == sender_id:
            await self.send(text_data=json.dumps({'error': 'Tidak bisa kirim pesan ke diri sendiri'}))
            return

        # Kalau room valid, pesan hanya boleh ke peserta lain di room ini
        if self.other_user_id and str(receiver_id) != self.other_user_id:
            await self.send(text_data=json.dumps({'error': 'receiver bukan peserta room ini'}))
            return

        try:
            chat = await self.save_message(sender_id, receiver_id, message)
        except User.DoesNotExist:
            await self.send(text_data=json.dumps({'error': 'Pengirim atau penerima tidak ditemukan'}))
            return
        except Exception:
            await self.send(text_data=json.dumps({'error': 'Gagal simpan pesan'}))
            return

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'id': str(chat.id),
                'message': message,
                'sender_id': sender_id,
                'sender_email': self.user.email,
                'receiver_id': str(receiver_id),
                'timestamp': chat.timestamp.isoformat(),
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'id': event.get('id'),
            'message': event['message'],
            'sender_id': event['sender_id'],
            'sender_email': event.get('sender_email', ''),
            'receiver_id': event.get('receiver_id', ''),
            'timestamp': event.get('timestamp'),
        }))

    @database_sync_to_async
    def save_message(self, sender_id, receiver_id, message):
        sender = User.objects.get(id=sender_id)
        receiver = User.objects.get(id=uuid.UUID(str(receiver_id)))
        return Chat.objects.create(sender=sender, receiver=receiver, message=message)
