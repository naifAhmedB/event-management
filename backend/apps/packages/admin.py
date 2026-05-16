from django.contrib import admin
from .models import GuestPackage, PromoCode


@admin.register(GuestPackage)
class GuestPackageAdmin(admin.ModelAdmin):
    list_display = ('name_en', 'min_guests', 'max_guests', 'price_sar', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name_en', 'name_ar')


@admin.register(PromoCode)
class PromoCodeAdmin(admin.ModelAdmin):
    list_display = ('code', 'discount_percent', 'used_count', 'max_uses', 'is_active', 'expires_at')
    list_filter = ('is_active',)
    search_fields = ('code',)
