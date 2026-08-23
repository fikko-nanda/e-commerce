import json
from asgiref.sync import async_to_sync
from channels.testing import WebsocketCommunicator
from django.contrib.auth import get_user_model
from django.test import TestCase, TransactionTestCase
from rest_framework_simplejwt.tokens import RefreshToken

from config.asgi import application
from .consumers import get_room_name, parse_room_name
from .models import Chat

User = get_user_model()


def _run(coro):
    async def runner():
        return await coro
    return async_to_sync(runner)()


class ChatRoomNameTests(TestCase):
    def test_room_name_symmetric(self):
        a = User.objects.create_user(email='a@t.com', password='x12345678', username='a')
        b = User.objects.create_user(email='b@t.com', password='x12345678', username='b')
        self.assertEqual(get_room_name(a.id, b.id), get_room_name(b.id, a.id))

    def test_parse_room_name(self):
        a = User.objects.create_user(email='a@t.com', password='x12345678', username='a')
        b = User.objects.create_user(email='b@t.com', password='x12345678', username='b')
        parsed = parse_room_name(get_room_name(a.id, b.id))
        self.assertEqual(sorted([str(a.id), str(b.id)]), parsed)
        self.assertIsNone(parse_room_name('chat_notuuid'))
        self.assertIsNone(parse_room_name('random_room'))


# TransactionTestCase: consumer memakai database_sync_to_async yang memanggil
# close_old_connections() — tidak kompatibel dengan atomic block milik TestCase.
class ChatWebSocketTests(TransactionTestCase):
    def setUp(self):
        self.buyer = User.objects.create_user(email='buyer@t.com', password='x12345678', username='buyer')
        self.seller = User.objects.create_user(email='seller@t.com', password='x12345678', username='seller')
        self.buyer_token = str(RefreshToken.for_user(self.buyer).access_token)
        self.seller_token = str(RefreshToken.for_user(self.seller).access_token)
        self.room = get_room_name(self.buyer.id, self.seller.id)

    def _connect(self, token, room=None):
        url = f"/ws/chat/{room or self.room}/"
        if token:
            url += f"?token={token}"
        comm = WebsocketCommunicator(application, url)
        connected, _ = _run(comm.connect())
        # jika gagal konek (consumer sudah close), jangan panggil disconnect —
        # task aplikasi sudah selesai dan disconnect akan melempar CancelledError
        return connected

    def test_connect_with_valid_jwt(self):
        self.assertTrue(self._connect(self.buyer_token))
        # koneksi masih terbuka — tutup via communicator kedua tidak perlu; disconnect ditanggil test lain

    def test_connect_without_token_rejected(self):
        self.assertFalse(self._connect(None))

    def test_connect_with_invalid_token_rejected(self):
        self.assertFalse(self._connect('bogus.token.here'))

    def test_connect_non_participant_rejected(self):
        other = User.objects.create_user(email='other@t.com', password='x12345678', username='other')
        other_token = str(RefreshToken.for_user(other).access_token)
        self.assertFalse(self._connect(other_token))

    def _scenario(self, room, token, coro):
        async def runner():
            comm = WebsocketCommunicator(application, f"/ws/chat/{room}/?token={token}")
            connected, _ = await comm.connect()
            assert connected, 'websocket harus terkoneksi'
            await coro(comm)
            await comm.disconnect()
        async_to_sync(runner)()

    def test_message_broadcast_and_saved(self):
        buyer_id, seller_id = str(self.buyer.id), str(self.seller.id)
        tokens = [self.buyer_token, self.seller_token]

        async def scenario():
            comms = []
            for token in tokens:
                comm = WebsocketCommunicator(application, f"/ws/chat/{self.room}/?token={token}")
                connected, _ = await comm.connect()
                assert connected
                comms.append(comm)

            await comms[0].send_json_to({'message': 'halo seller', 'receiver_id': seller_id})

            for comm in comms:
                data = json.loads(await comm.receive_from(timeout=5))
                self.assertEqual(data['message'], 'halo seller')
                self.assertEqual(data['sender_id'], buyer_id)
                self.assertEqual(data['receiver_id'], seller_id)

            for comm in comms:
                await comm.disconnect()

        async_to_sync(scenario)()
        chat = Chat.objects.get()
        self.assertEqual(chat.sender, self.buyer)
        self.assertEqual(chat.receiver, self.seller)
        self.assertEqual(chat.message, 'halo seller')

    def test_message_without_receiver_id_uses_other_participant(self):
        async def scenario(comm):
            await comm.send_json_to({'message': 'tanpa receiver'})
            data = json.loads(await comm.receive_from(timeout=5))
            self.assertEqual(data['receiver_id'], str(self.seller.id))

        self._scenario(self.room, self.buyer_token, scenario)
        self.assertTrue(Chat.objects.filter(message='tanpa receiver', receiver=self.seller).exists())

    def test_message_to_wrong_receiver_rejected(self):
        other = User.objects.create_user(email='x@t.com', password='x12345678', username='x')

        async def scenario(comm):
            await comm.send_json_to({'message': 'hai', 'receiver_id': str(other.id)})
            data = json.loads(await comm.receive_from(timeout=5))
            self.assertIn('error', data)

        self._scenario(self.room, self.buyer_token, scenario)
        self.assertEqual(Chat.objects.count(), 0)

    def test_message_to_self_rejected(self):
        async def scenario(comm):
            await comm.send_json_to({'message': 'ke diri sendiri', 'receiver_id': str(self.buyer.id)})
            data = json.loads(await comm.receive_from(timeout=5))
            self.assertIn('error', data)

        self._scenario(self.room, self.buyer_token, scenario)
        self.assertEqual(Chat.objects.count(), 0)

    def test_invalid_json_rejected(self):
        async def scenario(comm):
            await comm.send_to(text_data='not-json')
            data = json.loads(await comm.receive_from(timeout=5))
            self.assertIn('error', data)

        self._scenario(self.room, self.buyer_token, scenario)
