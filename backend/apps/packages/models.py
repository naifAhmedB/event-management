import uuid
from django.db import models


class GuestPackage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name_ar = models.CharField(max_length=100)
    name_en = models.CharField(max_length=100)
    min_guests = models.PositiveIntegerField(default=0)
    max_guests = models.PositiveIntegerField()
    price_sar = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'packages_guestpackage'
        ordering = ['price_sar']

    def __str__(self):
        return f"{self.name_en} ({self.min_guests}-{self.max_guests} guests)"


class PromoCode(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True)
    discount_percent = models.PositiveIntegerField(default=0)
    max_uses = models.PositiveIntegerField(default=1)
    used_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'packages_promocode'

    def __str__(self):
        return f"{self.code} ({self.discount_percent}%)"
