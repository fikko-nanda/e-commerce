from rest_framework import serializers
from .models import Chat

class ChatSerializer(serializers.ModelSerializer):
    sender_email = serializers.ReadOnlyField(source='sender.email')
    receiver_email = serializers.ReadOnlyField(source='receiver.email')
    class Meta:
        model = Chat
        fields = ['id','sender','sender_email','receiver','receiver_email','message','timestamp']
        read_only_fields = fields
