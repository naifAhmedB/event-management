import React, { useState } from 'react';
import { Calendar, MapPin, Users, MessageSquare, QrCode, Send } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useEventCreationStore } from '../../store/eventCreationStore';
import { formatDate, formatPrice } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { eventService } from '../../services/eventService';
import { toast } from 'sonner';

interface ReviewPaymentProps {
  onSuccess: () => void;
}

const ReviewPayment = ({ onSuccess }: ReviewPaymentProps) => {
  const { t, language } = useLanguage();
  const store = useEventCreationStore();
  const [promoInput, setPromoInput] = useState(store.promoCode);
  const [promoApplied, setPromoApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);

  const pkg = store.selectedPackage;
  const basePrice = pkg?.price_sar || 0;
  const finalPrice = Math.max(0, basePrice - discount);

  const handleApplyPromo = async () => {
    if (!promoInput.trim() || !store.savedEventId) return;
    try {
      const res = await eventService.validatePromo(promoInput, store.savedEventId);
      if (res.success && res.data?.valid) {
        const d = res.data;
        const disc = d.discount_type === 'percent'
          ? basePrice * (d.discount_value! / 100)
          : d.discount_value || 0;
        setDiscount(disc);
        setPromoApplied(true);
        store.setPromoCode(promoInput);
        toast.success('تم تطبيق كود الخصم!');
      } else {
        toast.error('كود الخصم غير صحيح');
      }
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleCheckout = async () => {
    if (!store.savedEventId) return;
    setLoading(true);
    try {
      const res = await eventService.checkout(store.savedEventId, promoApplied ? promoInput : undefined);
      if (res.success) {
        toast.success(t('payment.invitations_sent'));
        onSuccess();
      } else {
        toast.error(res.message || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const rows = [
    { icon: Calendar, label: t('review.event_title'), value: store.eventTitle },
    { icon: Calendar, label: t('review.event_date'), value: store.eventDate ? formatDate(store.eventDate, language) : '-' },
    { icon: MapPin, label: t('review.event_location'), value: store.locationText },
    { icon: Users, label: t('review.total_guests'), value: `${store.invitees.length} ${t('events.guests')}` },
    {
      icon: Users,
      label: t('review.package'),
      value: pkg ? (language === 'ar' ? pkg.name_ar : pkg.name_en) : '-',
    },
    {
      icon: MessageSquare,
      label: t('review.message_language'),
      value: store.messageLanguage === 'ar' ? t('message_settings.arabic') : t('message_settings.english'),
    },
    {
      icon: QrCode,
      label: t('review.send_qr'),
      value: store.includeQr ? t('common.yes') : t('common.no'),
    },
    {
      icon: Send,
      label: t('review.delivery'),
      value: store.deliveryMethod === 'whatsapp' ? t('message_settings.whatsapp') : t('message_settings.sms'),
    },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('review.title')}</h2>

      {/* Summary */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-100 mb-6">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3 px-4 py-3">
            <Icon size={16} className="text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-500 flex-1">{label}</span>
            <span className="text-sm font-medium text-gray-900">{value}</span>
          </div>
        ))}
      </div>

      {/* Promo code */}
      {basePrice > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('review.promo_code')}</label>
          <div className="flex gap-2">
            <Input
              placeholder="PROMO123"
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
              dir="ltr"
              className="flex-1"
              disabled={promoApplied}
            />
            <Button variant="outline" onClick={handleApplyPromo} disabled={promoApplied}>
              {t('review.apply')}
            </Button>
          </div>
        </div>
      )}

      {/* Total price */}
      <div className="bg-purple-50 rounded-xl p-4 mb-6 flex items-center justify-between">
        <span className="font-semibold text-gray-900">{t('review.total_price')}</span>
        <span className="text-2xl font-bold text-purple-700">
          {finalPrice === 0 ? t('packages.free') : formatPrice(finalPrice, language)}
        </span>
      </div>

      {/* Checkout button */}
      <Button
        className="w-full"
        size="lg"
        loading={loading}
        onClick={handleCheckout}
        disabled={!store.savedEventId}
      >
        {finalPrice === 0 ? t('review.free_proceed') : t('review.proceed_payment')}
      </Button>
    </div>
  );
};

export default ReviewPayment;
