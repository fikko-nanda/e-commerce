from rest_framework import serializers
from chats.models import Chat


class ChatSerializer(serializers.ModelSerializer):
    sender_name = serializers.ReadOnlyField(source='sender.email')
    receiver_name = serializers.ReadOnlyField(source='receiver.email')
    
    class Meta:
        model = Chat
        fields = ['id', 'sender', 'sender_name', 'receiver', 
                 'receiver_name', 'message', 'timestamp']
        read_only_fields = ['id', 'timestamp', 'sender']
    
    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Get sender from authenticated user
            sender = request.user
            
            # Check if receiver exists
            receiver_id = validated_data.get('receiver')
            try:
                receiver = User.objects.get(id=receiver_id)
            except User.DoesNotExist:
                raise serializers.ValidationError("Receiver tidak ditemukan")
            
            validated_data['sender'] = sender
            validated_data['receiver'] = receiver
        
        return super().create(validated_data)


class MessageListSerializer(serializers.ModelSerializer):
    """Simplified for listing messages"""
    sender_name = serializers.ReadOnlyField(source='sender.email')
    
    class Meta:
        model = Chat
        fields = ['id', 'sender_name', 'message', 'timestamp', 'read']
