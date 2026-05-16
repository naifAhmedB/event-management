import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Sparkles } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { eventService } from '../../services/eventService';
import { Event } from '../../types';
import { Button } from '../../components/ui/Button';
import EventCard from '../../components/events/EventCard';

const SkeletonCard = () => (
  <div className="rounded-2xl overflow-hidden bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_2px_8px_-1px_rgba(124,58,237,.06)]">
    <div className="h-36 skeleton" />
    <div className="p-4 space-y-3">
      <div className="h-3 skeleton w-1/4 rounded-full" />
      <div className="h-4 skeleton w-2/3 rounded-full" />
      <div className="h-3 skeleton w-1/2 rounded-full" />
      <div className="grid grid-cols-4 gap-1.5 pt-1">
        {[0,1,2,3].map((j) => <div key={j} className="h-11 skeleton rounded-xl" />)}
      </div>
      <div className="h-8 skeleton rounded-xl mt-2" />
    </div>
  </div>
);

const MyEventsPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventService.listEvents().then((res) => {
      if (res.success && res.data) setEvents(Array.isArray(res.data) ? res.data : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in">

      {/* ── Page header ───────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight tracking-tight">{t('events.my_events')}</h1>
          {!loading && events.length > 0 && (
            <p className="text-sm text-gray-400 mt-1 font-medium">
              {events.length} {events.length === 1 ? 'event' : 'events'}
            </p>
          )}
        </div>
        <Button onClick={() => navigate('/events/create')} className="gap-2">
          <Plus size={16} />
          {t('events.create_event')}
        </Button>
      </div>

      {/* ── Content ───────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0,1,2].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 text-center animate-scale-in">
          <div className="relative mb-8">
            <div className="w-28 h-28 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/65 shadow-[0_8px_32px_rgba(124,58,237,.12),0_0_0_1px_rgba(255,255,255,.7)_inset] flex items-center justify-center">
              <span className="text-5xl">📨</span>
            </div>
            <div className="absolute -top-2 -end-2 w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-[0_4px_12px_rgba(124,58,237,.35)]">
              <Sparkles size={15} className="text-white" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">{t('events.no_events')}</h2>
          <p className="text-gray-400 mb-8 max-w-xs leading-relaxed font-medium">{t('events.no_events_desc')}</p>
          <Button onClick={() => navigate('/events/create')} size="lg" className="gap-2">
            <Plus size={16} />
            {t('events.create_first')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
          {events.map((event) => (
            <div key={event.id} className="animate-fade-in">
              <EventCard event={event} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyEventsPage;
