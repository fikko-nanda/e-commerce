from django.urls import path
from .views import ChatListView, ChatCreateView, ChatRoomNameView

urlpatterns = [
    path('', ChatListView.as_view(), name='chat-list'),
    path('send/', ChatCreateView.as_view(), name='chat-send'),
    path('room-name/', ChatRoomNameView.as_view(), name='chat-room-name'),
]
