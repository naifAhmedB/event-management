from django.conf import settings
from decimal import Decimal


class PaymentService:
    @classmethod
    def process_payment(cls, amount_sar, user, event_id):
        if settings.MOCK_PAYMENT:
            print(f"[MOCK Payment] Amount: {amount_sar} SAR | User: {user} | Event: {event_id} => SUCCESS")
            return {'success': True, 'transaction_id': f'MOCK-{event_id}'}
        # TODO: swap to HyperPay or Moyasar
        return {'success': False, 'error': 'Payment gateway not configured'}

    @classmethod
    def calculate_total(cls, package_price, promo_code=None):
        total = Decimal(str(package_price))
        if promo_code and promo_code.is_active:
            discount = total * Decimal(str(promo_code.discount_percent)) / Decimal('100')
            total -= discount
        return max(total, Decimal('0'))
