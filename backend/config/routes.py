from django.urls import re_path
from chats.consumers import ChatConsumer

websocket_urlpatterns = [
    re_path(r'ws/chats/$', ChatConsumer.as_asgi()),
]
