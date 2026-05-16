import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, QrCode, ChevronRight } from 'lucide-react';
import { Event } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatDate, getEventTypeIcon, getEventTypeColor } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

interface EventCardProps {
  event: Event;
}

const typeGradient: Record<string, string> = {
  women_wedding: 'from-pink-300/70   via-rose-200/50    to-fuchsia-300/60',
  men_wedding:   'from-indigo-300/70 via-violet-200/50  to-purple-300/60',
  graduation:    'from-blue-300/70   via-sky-200/50     to-cyan-300/60',
  newborn:       'from-yellow-300/70 via-amber-200/50   to-orange-200/60',
  birthday:      'from-orange-300/70 via-amber-200/50   to-yellow-300/60',
  opening:       'from-green-300/70  via-emerald-200/50 to-teal-300/60',
};

const defaultGradient = 'from-violet-300/70 via-purple-200/50 to-indigo-300/60';

const EventCard = ({ event }: EventCardProps) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const gradient = typeGradient[event.event_type] ?? defaultGradient;

  const counters = [
    { label: t('events.waiting'),  value: event.waiting_count,  bg: 'bg-amber-50/80',   text: 'text-amber-700',   border: 'border-amber-200/50' },
    { label: t('events.accepted'), value: event.accepted_count, bg: 'bg-emerald-50/80', text: 'text-emerald-700', border: 'border-emerald-200/50' },
    { label: t('events.declined'), value: event.declined_count, bg: 'bg-red-50/80',     text: 'text-red-600',     border: 'border-red-200/50' },
    { label: t('events.arrived'),  value: event.arrived_count,  bg: 'bg-sky-50/80',     text: 'text-sky-700',     border: 'border-sky-200/50' },
  ];

  return (
    <div className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_-8px_rgba(124,58,237,.18),0_4px_12px_-2px_rgba(0,0,0,.10)] bg-white/75 backdrop-blur-xl border border-white/65 shadow-[0_2px_8px_-1px_rgba(124,58,237,.07),0_1px_3px_0_rgba(0,0,0,.05),0_0_0_1px_rgba(255,255,255,.7)_inset]">

      {/* ── Header image ───────────────────────────────── */}
      <div className={cn('relative h-36 flex items-center justify-center overflow-hidden bg-gradient-to-br', gradient)}>

        {/* Frosted glass overlay on gradient headers */}
        {!event.design?.design_image && !event.custom_design_img && (
          <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
        )}

        {event.design?.design_image || event.custom_design_img ? (
          <img
            src={event.design?.design_image || event.custom_design_img}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <>
            {/* Decorative rings */}
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <div className="w-48 h-48 rounded-full border-2 border-white" />
              <div className="absolute w-32 h-32 rounded-full border border-white" />
              <div className="absolute w-20 h-20 rounded-full border border-white/60" />
            </div>
            <span className="relative z-10 text-5xl drop-shadow-lg">{getEventTypeIcon(event.event_type)}</span>
          </>
        )}

        {/* Status badge — glass pill */}
        <div className="absolute top-2.5 end-2.5">
          <Badge variant={event.status as 'draft' | 'active' | 'completed' | 'payment_pending'}>
            {t(`events.status.${event.status}`)}
          </Badge>
        </div>

        {/* Deactivated dim overlay */}
        {!event.is_active && (
          <div className="absolute inset-0 bg-gray-900/30 backdrop-blur-[1px] flex items-end justify-start p-2">
            <span className="text-[10px] font-semibold text-white/80 bg-black/30 px-2 py-0.5 rounded-full">
              {t('events.deactivated')}
            </span>
          </div>
        )}
      </div>

      {/* ── Body ────────────────────────────────────────── */}
      <div className="p-4">

        {/* Event type pill */}
        <span className={cn('inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border mb-2.5 backdrop-blur-sm', getEventTypeColor(event.event_type))}>
          {getEventTypeIcon(event.event_type)}&ensp;{t(`event_types.${event.event_type}`)}
        </span>

        {/* Title */}
        <h3 className="font-bold text-gray-900 text-[15px] mb-2.5 line-clamp-1 leading-snug tracking-tight">{event.title}</h3>

        {/* Date & Location */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-5 h-5 rounded-md bg-violet-100/70 flex items-center justify-center flex-shrink-0">
              <Calendar size={11} className="text-violet-500" />
            </div>
            <span className="font-medium text-gray-700">{formatDate(event.event_date, language)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-5 h-5 rounded-md bg-violet-100/70 flex items-center justify-center flex-shrink-0">
              <MapPin size={11} className="text-violet-500" />
            </div>
            <span className="line-clamp-1 text-gray-500">{event.location_text}</span>
          </div>
        </div>

        {/* Counters */}
        {event.status !== 'draft' && (
          <div className="grid grid-cols-4 gap-1.5 mb-4">
            {counters.map(({ label, value, bg, text, border }) => (
              <div key={label} className={cn('rounded-xl p-2 text-center border backdrop-blur-sm', bg, text, border)}>
                <div className="text-xl font-bold leading-none mb-0.5 tracking-tight">{value}</div>
                <div className="text-[10px] leading-tight opacity-75 font-medium">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1 group/btn"
            onClick={() => navigate(`/events/${event.id}`)}
          >
            {t('events.view_details')}
            <ChevronRight size={13} className="opacity-40 group-hover/btn:translate-x-0.5 group-hover/btn:opacity-70 transition-all duration-200" />
          </Button>
          {event.status === 'active' && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate(`/scanner?event=${event.id}`)}
              className="gap-1.5"
            >
              <QrCode size={13} />
              {t('events.scan_qr')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCard;
