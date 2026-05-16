import uuid
from django.db import models
from django.utils import timezone
from datetime import timedelta


class OTPRecord(models.Model):
    METHOD_CHOICES = [('sms', 'SMS'), ('whatsapp', 'WhatsApp')]
    PURPOSE_CHOICES = [('signup', 'Signup'), ('forgot_password', 'Forgot Password')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone = models.CharField(max_length=20)
    otp_code = models.CharField(max_length=6)
    otp_method = models.CharField(max_length=10, choices=METHOD_CHOICES, default='sms')
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES)
    is_verified = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'authentication_otprecord'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=10)
        super().save(*args, **kwargs)

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"OTP for {self.phone} ({self.purpose})"
