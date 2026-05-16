import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { MessageLanguage, DeliveryMethod } from '../../types';
import { cn } from '../../lib/utils';

interface MessageSettingsFormProps {
  messageLanguage: MessageLanguage;
  includeQr: boolean;
  deliveryMethod: DeliveryMethod;
  onChange: (settings: { language?: MessageLanguage; qr?: boolean; delivery?: DeliveryMethod }) => void;
}

const MessageSettingsForm = ({
  messageLanguage,
  includeQr,
  deliveryMethod,
  onChange,
}: MessageSettingsFormProps) => {
  const { t } = useLanguage();

  const OptionButton = ({
    active,
    onClick,
    children,
  }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 py-3 px-4 rounded-xl border-2 text-sm font-medium transition-colors',
        active
          ? 'border-purple-500 bg-purple-50 text-purple-700'
          : 'border-gray-200 text-gray-600 hover:border-gray-300'
      )}
    >
      {children}
    </button>
  );

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('message_settings.title')}</h2>

      <div className="space-y-6">
        {/* Message language */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">{t('message_settings.language')}</label>
          <div className="flex gap-3">
            <OptionButton active={messageLanguage === 'ar'} onClick={() => onChange({ language: 'ar' })}>
              🇸🇦 {t('message_settings.arabic')}
            </OptionButton>
            <OptionButton active={messageLanguage === 'en'} onClick={() => onChange({ language: 'en' })}>
              🇺🇸 {t('message_settings.english')}
            </OptionButton>
          </div>
        </div>

        {/* Include QR */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">{t('message_settings.include_qr')}</label>
          <div className="flex gap-3">
            <OptionButton active={includeQr} onClick={() => onChange({ qr: true })}>
              ✅ {t('message_settings.include_qr_yes')}
            </OptionButton>
            <OptionButton active={!includeQr} onClick={() => onChange({ qr: false })}>
              ❌ {t('message_settings.include_qr_no')}
            </OptionButton>
          </div>
        </div>

        {/* Delivery method */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">{t('message_settings.delivery_method')}</label>
          <div className="flex gap-3">
            <OptionButton active={deliveryMethod === 'whatsapp'} onClick={() => onChange({ delivery: 'whatsapp' })}>
              💬 {t('message_settings.whatsapp')}
            </OptionButton>
            <OptionButton active={deliveryMethod === 'sms'} onClick={() => onChange({ delivery: 'sms' })}>
              📱 {t('message_settings.sms')}
            </OptionButton>
            <OptionButton active={deliveryMethod === 'email'} onClick={() => onChange({ delivery: 'email' })}>
              ✉️ {t('message_settings.email')}
            </OptionButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageSettingsForm;
