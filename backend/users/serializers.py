from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6, required=False)
    name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'role', 'google_id', 'name', 'phone', 'address', 'password']
        read_only_fields = ['id', 'google_id']

    def create(self, validated_data):
        # Ekstrak password agar di-hash dengan aman menggunakan set_password()
        password = validated_data.pop('password', None)
        user = User.objects.create(**validated_data)
        
        if password:
            user.set_password(password)
            user.save()
            
        return user