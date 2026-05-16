import uuid
from django.db import models
from django.conf import settings


class EventDesign(models.Model):
    EVENT_TYPE_CHOICES = [
        ('women_wedding', 'Women Wedding'),
        ('graduation', 'Graduation'),
        ('men_wedding', 'Men Wedding'),
        ('newborn', 'New Born'),
        ('opening', 'Opening'),
        ('birthday', 'Birthday'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event_type = models.CharField(max_length=20, choices=EVENT_TYPE_CHOICES)
    name_ar = models.CharField(max_length=100, blank=True)
    name_en = models.CharField(max_length=100, blank=True)
    design_image = models.ImageField(upload_to='designs/', null=True, blank=True)
    is_premade = models.BooleanField(default=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='custom_designs'
    )
    text_positions = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'events_eventdesign'

    def __str__(self):
        return f"{self.name_en or self.event_type} ({'premade' if self.is_premade else 'custom'})"


class Event(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('payment_pending', 'Payment Pending'),
        ('active', 'Active'),
        ('completed', 'Completed'),
    ]
    DELIVERY_CHOICES = [('whatsapp', 'WhatsApp'), ('sms', 'SMS'), ('email', 'Email')]
    LANGUAGE_CHOICES = [('ar', 'Arabic'), ('en', 'English')]
    EVENT_TYPE_CHOICES = EventDesign.EVENT_TYPE_CHOICES

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='events'
    )
    title = models.CharField(max_length=200)
    event_type = models.CharField(max_length=20, choices=EVENT_TYPE_CHOICES)
    location_text = models.CharField(max_length=300, blank=True)
    event_date = models.DateTimeField(null=True, blank=True)
    design = models.ForeignKey(
        EventDesign, null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='events'
    )
    card_text_name = models.CharField(max_length=200, blank=True)
    card_text_date = models.CharField(max_length=100, blank=True)
    card_text_location = models.CharField(max_length=300, blank=True)
    card_text_welcome = models.CharField(max_length=500, blank=True)
    package = models.ForeignKey(
        'packages.GuestPackage', null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='events'
    )
    message_language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES, default='ar')
    include_qr = models.BooleanField(default=True)
    delivery_method = models.CharField(max_length=10, choices=DELIVERY_CHOICES, default='whatsapp')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    is_active = models.BooleanField(default=True)
    reminder_count = models.IntegerField(default=0)
    guards = models.ManyToManyField(
        settings.AUTH_USER_MODEL, blank=True, related_name='guard_events'
    )
    promo_code = models.ForeignKey(
        'packages.PromoCode', null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='events'
    )
    total_price_sar = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'events_event'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.owner})"


class Invitee(models.Model):
    RESPONSE_CHOICES = [
        ('waiting', 'Waiting'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='invitees')
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20)
    invite_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    qr_code_image = models.ImageField(upload_to='qr_codes/', null=True, blank=True)
    message_sent = models.BooleanField(default=False)
    response_status = models.CharField(max_length=10, choices=RESPONSE_CHOICES, default='waiting')
    arrived = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    arrived_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'events_invitee'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.event.title})"
