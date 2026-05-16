import random
import string
from django.conf import settings


class OtpService:
    @staticmethod
    def generate_code(length=6):
        # TODO: remove fixed code once WhatsApp/SMS account is fully set up
        return '123456'

    @classmethod
    def send_otp(cls, phone, method, code, purpose):
        if settings.MOCK_OTP:
            print(f"[MOCK OTP] Code: {code} => {phone} via {method} (purpose: {purpose})")
            return True

        from services.whatsapp_service import WhatsAppService, _safe_print

        # Arabic OTP message
        msg = (
            f"\u0631\u0645\u0632 \u0627\u0644\u062a\u062d\u0642\u0642 \u0627\u0644\u062e\u0627\u0635 \u0628\u0643 \u0647\u0648: *{code}*\n"
            f"\u0635\u0627\u0644\u062d \u0644\u0645\u062f\u0629 10 \u062f\u0642\u0627\u0626\u0642. \u0644\u0627 \u062a\u0634\u0627\u0631\u0643\u0647 \u0645\u0639 \u0623\u062d\u062f."
        )

        if method == 'whatsapp':
            return WhatsAppService._send(WhatsAppService._format_phone(phone), msg)

        # SMS fallback — no SMS provider configured yet
        _safe_print(f'[OTP] SMS provider not configured. Code for {phone}: {code}')
        return False
