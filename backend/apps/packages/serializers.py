from rest_framework import serializers
from .models import GuestPackage, PromoCode


class GuestPackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = GuestPackage
        fields = ('id', 'name_ar', 'name_en', 'min_guests', 'max_guests', 'price_sar')


class AdminPackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = GuestPackage
        fields = ('id', 'name_ar', 'name_en', 'min_guests', 'max_guests', 'price_sar', 'is_active')


class PromoCodeSerializer(serializers.Serializer):
    code = serializers.CharField()
    event_id = serializers.UUIDField(required=False)


class AdminPromoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromoCode
        fields = ('id', 'code', 'discount_percent', 'max_uses', 'used_count',
                  'is_active', 'expires_at', 'created_at')
        read_only_fields = ('id', 'used_count', 'created_at')
