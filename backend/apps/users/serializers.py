from rest_framework import serializers
from .models import CustomUser


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'phone', 'full_name', 'is_admin', 'created_at')
        read_only_fields = ('id', 'created_at')


class AdminUserSerializer(serializers.ModelSerializer):
    event_count = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ('id', 'phone', 'full_name', 'is_admin', 'is_active', 'created_at', 'event_count')
        read_only_fields = ('id', 'phone', 'created_at', 'event_count')

    def get_event_count(self, obj):
        return obj.events.count()
