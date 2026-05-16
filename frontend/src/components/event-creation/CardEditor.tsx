import React from 'react';
import { CardTexts } from '../../store/eventCreationStore';
import { EventDesign } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { getEventTypeIcon } from '../../lib/utils';

interface CardEditorProps {
  design: EventDesign | null;
  customPreview: string | null;
  cardTexts: CardTexts;
  onChange: (field: keyof CardTexts, value: string) => void;
}

const CardEditor = ({ design, customPreview, cardTexts, onChange }: CardEditorProps) => {
  const { t, language } = useLanguage();
  const dir = language === 'ar' ? 'rtl' : 'ltr';

  const handleDateChange = (rawValue: string) => {
    if (!rawValue) {
      onChange('date', '');
      return;
    }
    const formatted = new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }).format(new Date(rawValue));
    onChange('date', formatted);
  };

  const fields: { key: keyof CardTexts; label: string; placeholder: string; multiline?: boolean; isDate?: boolean }[] = [
    { key: 'welcome', label: t('card_editor.welcome_message'), placeholder: t('card_editor.welcome_placeholder'), multiline: true },
    { key: 'name', label: t('card_editor.honoree_name'), placeholder: t('card_editor.honoree_placeholder') },
    { key: 'date', label: t('card_editor.event_date'), placeholder: t('card_editor.date_placeholder'), isDate: true },
    { key: 'location', label: t('card_editor.event_location'), placeholder: t('card_editor.location_placeholder') },
  ];

  const bgImage = customPreview || design?.design_image;

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('card_editor.title')}</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Card preview */}
        <div className="order-2 lg:order-1">
          <p className="text-sm font-medium text-gray-500 mb-3 text-center">{t('review.card_preview')}</p>
          <div
            className="relative mx-auto w-full max-w-xs aspect-[3/4] rounded-2xl overflow-hidden shadow-xl border border-gray-200"
            style={bgImage ? { backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
          >
            {!bgImage && (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100" />
            )}

            {/* Text overlays */}
            {design && bgImage && (
              <div className="absolute inset-0" dir={dir}>
                {Object.entries(design.text_positions).map(([field, pos]) => {
                  const text = cardTexts[field as keyof CardTexts];
                  if (!text) return null;
                  return (
                    <div
                      key={field}
                      className="absolute"
                      style={{
                        left: `${pos.x}%`,
                        top: `${pos.y}%`,
                        transform: 'translate(-50%, -50%)',
                        fontSize: `${pos.fontSize || 14}px`,
                        color: pos.color || '#1a1a1a',
                        textAlign: pos.align || 'center',
                        maxWidth: '80%',
                        fontFamily: 'var(--font-family)',
                        textShadow: '0 1px 3px rgba(255,255,255,0.8)',
                      }}
                    >
                      {text}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Placeholder content when no design image */}
            {!bgImage && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center" dir={dir}>
                <div className="text-5xl mb-4">{getEventTypeIcon('women_wedding')}</div>
                {cardTexts.welcome && <p className="text-xs text-gray-500 mb-3 italic">{cardTexts.welcome}</p>}
                {cardTexts.name && <p className="text-base font-bold text-gray-800">{cardTexts.name}</p>}
                {cardTexts.date && <p className="text-xs text-gray-600 mt-2">📅 {cardTexts.date}</p>}
                {cardTexts.location && <p className="text-xs text-gray-600">📍 {cardTexts.location}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Text inputs */}
        <div className="order-1 lg:order-2 space-y-4">
          {fields.map(({ key, label, placeholder, multiline, isDate }) => (
            <div key={key} className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">{label}</label>
              {multiline ? (
                <textarea
                  value={cardTexts[key]}
                  onChange={(e) => onChange(key, e.target.value)}
                  placeholder={placeholder}
                  dir={dir}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none placeholder:text-gray-400"
                />
              ) : isDate ? (
                <div className="space-y-1">
                  <input
                    type="date"
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                  {cardTexts.date && (
                    <p className="text-xs text-gray-500 px-1">{cardTexts.date}</p>
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  value={cardTexts[key]}
                  onChange={(e) => onChange(key, e.target.value)}
                  placeholder={placeholder}
                  dir={dir}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 placeholder:text-gray-400"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CardEditor;
