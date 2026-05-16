from rest_framework import serializers
from .models import Event, EventDesign, Invitee
from apps.packages.serializers import GuestPackageSerializer


class EventDesignSerializer(serializers.ModelSerializer):
    design_image_url = serializers.SerializerMethodField()

    class Meta:
        model = EventDesign
        fields = ('id', 'event_type', 'name_ar', 'name_en', 'design_image_url',
                  'is_premade', 'text_positions')

    def get_design_image_url(self, obj):
        request = self.context.get('request')
        if obj.design_image and request:
            return request.build_absolute_uri(obj.design_image.url)
        return None


class InviteeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invitee
        fields = ('id', 'name', 'phone', 'invite_token', 'response_status',
                  'message_sent', 'arrived', 'qr_code_image',
                  'sent_at', 'responded_at', 'arrived_at')
        read_only_fields = ('id', 'invite_token', 'qr_code_image',
                            'sent_at', 'responded_at', 'arrived_at')


class BulkInviteeSerializer(serializers.Serializer):
    invitees = serializers.ListField(
        child=serializers.DictField(child=serializers.CharField())
    )


class EventSerializer(serializers.ModelSerializer):
    invitees = InviteeSerializer(many=True, read_only=True)
    design_detail = EventDesignSerializer(source='design', read_only=True)
    package_detail = GuestPackageSerializer(source='package', read_only=True)
    waiting_count = serializers.SerializerMethodField()
    accepted_count = serializers.SerializerMethodField()
    declined_count = serializers.SerializerMethodField()
    arrived_count = serializers.SerializerMethodField()
    available_invitations = serializers.SerializerMethodField()
    guards_list = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = (
            'id', 'title', 'event_type', 'location_text', 'event_date',
            'design', 'design_detail',
            'card_text_name', 'card_text_date', 'card_text_location', 'card_text_welcome',
            'package', 'package_detail',
            'message_language', 'include_qr', 'delivery_method',
            'status', 'is_active', 'reminder_count',
            'total_price_sar',
            'waiting_count', 'accepted_count', 'declined_count', 'arrived_count',
            'available_invitations',
            'invitees',
            'guards_list',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'status', 'total_price_sar', 'reminder_count',
                            'created_at', 'updated_at')

    def get_guards_list(self, obj):
        return [
            {'id': str(g.pk), 'phone': g.phone, 'full_name': g.full_name}
            for g in obj.guards.all()
        ]

    def get_waiting_count(self, obj):
        return obj.invitees.filter(response_status='waiting').count()

    def get_accepted_count(self, obj):
        return obj.invitees.filter(response_status='accepted').count()

    def get_declined_count(self, obj):
        return obj.invitees.filter(response_status='declined').count()

    def get_arrived_count(self, obj):
        return obj.invitees.filter(arrived=True).count()

    def get_available_invitations(self, obj):
        if not obj.package:
            return None
        used = obj.invitees.count() + obj.reminder_count
        return max(0, obj.package.max_guests - used)


class AdminEventSerializer(serializers.ModelSerializer):
    owner_id = serializers.CharField(source='owner.id', read_only=True)
    owner_phone = serializers.CharField(source='owner.phone', read_only=True)
    owner_name = serializers.CharField(source='owner.full_name', read_only=True)
    guest_count = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = ('id', 'title', 'event_type', 'status', 'is_active',
                  'event_date', 'location_text',
                  'owner_id', 'owner_phone', 'owner_name', 'guest_count', 'created_at')

    def get_guest_count(self, obj):
        return obj.invitees.count()


class PublicEventSerializer(serializers.ModelSerializer):
    design_detail = EventDesignSerializer(source='design', read_only=True)

    class Meta:
        model = Event
        fields = (
            'id', 'title', 'event_type', 'location_text', 'event_date',
            'design_detail',
            'card_text_name', 'card_text_date', 'card_text_location', 'card_text_welcome',
            'message_language',
        )
