import qrcode
import io
from django.core.files.base import ContentFile
from django.conf import settings


class QRService:
    @classmethod
    def generate_qr(cls, data):
        qr = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(data)
        qr.make(fit=True)
        img = qr.make_image(fill_color='black', back_color='white')
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        return ContentFile(buffer.read())

    @classmethod
    def generate_invite_qr(cls, invitee):
        invite_url = f"{settings.FRONTEND_URL}/invite/{invitee.invite_token}"
        content = cls.generate_qr(invite_url)
        filename = f"qr_{invitee.invite_token}.png"
        invitee.qr_code_image.save(filename, content, save=False)
        return invitee
