import React from 'react';
import { EventType } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { getEventTypeIcon, getEventTypeColor } from '../../lib/utils';
import { cn } from '../../lib/utils';

const EVENT_TYPES: EventType[] = [
  'women_wedding',
  'graduation',
  'men_wedding',
  'newborn',
  'opening',
  'birthday',
];

interface EventTypeSelectorProps {
  selected: EventType | null;
  onSelect: (type: EventType) => void;
}

const EventTypeSelector = ({ selected, onSelect }: EventTypeSelectorProps) => {
  const { t } = useLanguage();

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('event_types.title')}</h2>
      <p className="text-gray-500 text-sm mb-6">{t('event_types.subtitle')}</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {EVENT_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className={cn(
              'relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all text-center',
              selected === type
                ? 'border-purple-500 bg-purple-50 shadow-md scale-105'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
            )}
          >
            {selected === type && (
              <div className="absolute top-2 end-2 w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            <span className="text-4xl">{getEventTypeIcon(type)}</span>
            <span className={cn(
              'text-sm font-medium',
              selected === type ? 'text-purple-700' : 'text-gray-700'
            )}>
              {t(`event_types.${type}`)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default EventTypeSelector;
