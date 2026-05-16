from django.contrib import admin
from .models import Event, EventDesign, Invitee


@admin.register(EventDesign)
class EventDesignAdmin(admin.ModelAdmin):
    list_display = ('name_en', 'event_type', 'is_premade', 'owner')
    list_filter = ('event_type', 'is_premade')
    search_fields = ('name_en', 'name_ar')


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'owner', 'event_type', 'status', 'event_date', 'created_at')
    list_filter = ('status', 'event_type')
    search_fields = ('title', 'owner__phone', 'owner__full_name')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(Invitee)
class InviteeAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'event', 'response_status', 'message_sent', 'arrived')
    list_filter = ('response_status', 'message_sent', 'arrived')
    search_fields = ('name', 'phone', 'event__title')
    readonly_fields = ('id', 'invite_token', 'created_at')
