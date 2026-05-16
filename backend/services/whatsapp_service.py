import requests
from django.conf import settings


def _safe_print(msg: str) -> None:
    """Print msg safely on Windows terminals that don't support Unicode."""
    try:
        print(msg)
    except UnicodeEncodeError:
        print(msg.encode('ascii', 'replace').decode('ascii'))


class WhatsAppService:

    # ------------------------------------------------------------------ #
    #  Private helpers                                                     #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _format_phone(phone: str) -> str:
        """
        Normalise a KSA phone number to international WhatsApp format.

        Handles:
          0501234567     -> +966501234567
          966501234567   -> +966501234567
          00966501234567 -> +966501234567
          +966501234567  -> +966501234567  (unchanged)
        """
        phone = phone.strip().replace(' ', '').replace('-', '')
        if phone.startswith('00966'):
            phone = '+' + phone[2:]
        elif phone.startswith('966') and not phone.startswith('+'):
            phone = '+' + phone
        elif phone.startswith('0'):
            phone = '+966' + phone[1:]
        elif not phone.startswith('+'):
            phone = '+966' + phone
        return phone

    @staticmethod
    def _send(to: str, body: str) -> bool:
        """
        POST a free-form text message via Ultramsg.
        Returns True on HTTP 200, False on any error.
        """
        instance = settings.ULTRAMSG_INSTANCE_ID
        token = settings.ULTRAMSG_TOKEN

        if not instance or not token:
            _safe_print('[WhatsApp] ULTRAMSG_INSTANCE_ID or ULTRAMSG_TOKEN not configured.')
            return False

        try:
            resp = requests.post(
                f'https://api.ultramsg.com/{instance}/messages/chat',
                data={'token': token, 'to': to, 'body': body},
                timeout=10,
            )
            resp.raise_for_status()
            return True
        except Exception as exc:
            _safe_print(f'[WhatsApp] send failed to {to}: {exc}')
            return False

    # ------------------------------------------------------------------ #
    #  Public methods                                                      #
    # ------------------------------------------------------------------ #

    @classmethod
    def send_invitation(cls, phone, name, event_title, invite_url, language='ar'):
        if settings.MOCK_WHATSAPP:
            _safe_print(f"[MOCK WhatsApp] To: {phone} | {name} | Event: {event_title} | URL: {invite_url}")
            return True

        if language == 'ar':
            body = (
                f"\u064a\u0633\u0639\u062f\u0646\u0627 \u062f\u0639\u0648\u062a\u0643\u0645 \u0644\u062d\u0636\u0648\u0631 *{event_title}*\n"
                f"\u0639\u0632\u064a\u0632\u064a/\u0639\u0632\u064a\u0632\u062a\u064a {name}\u060c\n"
                f"\u064a\u0634\u0631\u0641\u0646\u0627 \u062a\u0634\u0631\u064a\u0641 \u062d\u0636\u0648\u0631\u0643\u0645 \u0627\u0644\u0643\u0631\u064a\u0645.\n\n"
                f"\u0644\u0644\u062a\u0623\u0643\u064a\u062f \u0639\u0644\u0649 \u0627\u0644\u062d\u0636\u0648\u0631 \u064a\u0631\u062c\u0649 \u0627\u0644\u0636\u063a\u0637 \u0639\u0644\u0649 \u0627\u0644\u0631\u0627\u0628\u0637:\n"
                f"{invite_url}"
            )
        else:
            body = (
                f"You're invited to *{event_title}*\n"
                f"Dear {name},\n"
                f"We are pleased to invite you to join us.\n\n"
                f"Please confirm your attendance:\n"
                f"{invite_url}"
            )

        return cls._send(cls._format_phone(phone), body)

    @classmethod
    def send_reminder(cls, phone, name, event_title, invite_url, message, language='ar'):
        if settings.MOCK_WHATSAPP:
            _safe_print(f"[MOCK Reminder] To: {phone} | {name} | Event: {event_title} | Msg: {message} | URL: {invite_url}")
            return True

        if language == 'ar':
            body = (
                f"\u062a\u0630\u0643\u064a\u0631: \u0623\u0646\u062a\u0645 \u0645\u062f\u0639\u0648\u0648\u0646 \u0644\u062d\u0636\u0648\u0631 *{event_title}*\n"
                + (f"{message}\n\n" if message else "\n")
                + f"\u0631\u0627\u0628\u0637 \u0627\u0644\u062f\u0639\u0648\u0629:\n{invite_url}"
            )
        else:
            body = (
                f"Reminder: You're invited to *{event_title}*\n"
                + (f"{message}\n\n" if message else "\n")
                + f"Invitation link:\n{invite_url}"
            )

        return cls._send(cls._format_phone(phone), body)

    @classmethod
    def send_guard_credentials(cls, phone, password, event_title):
        if settings.MOCK_WHATSAPP:
            _safe_print(f"[MOCK Guard Credentials] To: {phone} | Event: {event_title} | Password: {password}")
            return True

        body = (
            f"\u062a\u0645 \u062a\u0639\u064a\u064a\u0646\u0643 \u062d\u0627\u0631\u0633\u0627\u064b \u0644\u0641\u0639\u0627\u0644\u064a\u0629: *{event_title}*\n\n"
            f"\u0631\u0642\u0645 \u0627\u0644\u062c\u0648\u0627\u0644: {phone}\n"
            f"\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631: {password}\n\n"
            f"\u0633\u062c\u0651\u0644 \u062f\u062e\u0648\u0644\u0643 \u0645\u0646 \u062a\u0637\u0628\u064a\u0642 \u0627\u0644\u062f\u0639\u0648\u0627\u062a \u0644\u0645\u0633\u062d \u0631\u0645\u0648\u0632 QR \u0639\u0646\u062f \u0627\u0644\u0628\u0627\u0628."
        )

        return cls._send(cls._format_phone(phone), body)

    @classmethod
    def send_sms(cls, phone, name, event_title, invite_url, language='ar'):
        """SMS delivery — no SMS provider configured; falls back to WhatsApp."""
        if settings.MOCK_WHATSAPP:
            _safe_print(f"[MOCK SMS] To: {phone} | {name} | Event: {event_title} | URL: {invite_url}")
            return True

        _safe_print(f'[WhatsApp] SMS provider not configured. Falling back to WhatsApp for {phone}.')
        return cls.send_invitation(phone, name, event_title, invite_url, language)

    @classmethod
    def send_email_invitation(cls, phone, name, event_title, invite_url, language='ar'):
        """Email delivery — not yet implemented."""
        if settings.MOCK_WHATSAPP:
            _safe_print(f"[MOCK Email] To: {phone} | {name} | Event: {event_title} | URL: {invite_url}")
            return True

        _safe_print(f'[WhatsApp] Email provider not configured for {phone}.')
        return False
