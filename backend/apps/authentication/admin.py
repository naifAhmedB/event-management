from django.contrib import admin
from .models import OTPRecord


@admin.register(OTPRecord)
class OTPRecordAdmin(admin.ModelAdmin):
    list_display = ('phone', 'purpose', 'otp_method', 'is_verified', 'expires_at', 'created_at')
    list_filter = ('purpose', 'otp_method', 'is_verified')
    search_fields = ('phone',)
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at')
