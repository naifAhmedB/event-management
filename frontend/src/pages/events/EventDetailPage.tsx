import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, QrCode, Users, Calendar, MapPin, Search, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '../../contexts/LanguageContext';
import { eventService } from '../../services/eventService';
import { Event, Guard, Invitee } from '../../types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatDate } from '../../lib/utils';

const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Fix 6: search
  const [searchQuery, setSearchQuery] = useState('');

  // Fix 5: upgrade modal
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Guard deletion: id of the guard pending confirmation
  const [guardToDelete, setGuardToDelete] = useState<string | null>(null);

  // QR popup
  const [qrInvitee, setQrInvitee] = useState<Invitee | null>(null);

  // Inline panel state
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [showAddGuard, setShowAddGuard] = useState(false);
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestPhone, setNewGuestPhone] = useState('');
  const [reminderMessage, setReminderMessage] = useState('');
  const [guardPhone, setGuardPhone] = useState('');

  const load = async () => {
    if (!id) return;
    try {
      const res = await eventService.getEvent(id);
      if (res.success && res.data) setEvent(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  // Fix 4: compute effective available invitations — fallback to package_detail if API returns null/undefined
  const effectiveAvailable = event
    ? (event.available_invitations != null
        ? event.available_invitations
        : event.package_detail
          ? Math.max(0, event.package_detail.max_guests - (event.invitees?.length ?? 0) - event.reminder_count)
          : undefined)
    : undefined;

  // Fix 1: reload after toggle so all fields (including is_active) are fresh
  const handleToggleActive = async () => {
    if (!event || !id) return;
    const wasActive = event.is_active;
    setActionLoading(true);
    try {
      const res = await eventService.toggleActive(id, !wasActive);
      if (res.success) {
        await load();
        toast.success(wasActive ? t('events.event_deactivated') : t('events.event_activated'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddGuest = async () => {
    if (!id || !newGuestName.trim() || !newGuestPhone.trim()) return;
    setActionLoading(true);
    try {
      await eventService.addInvitees(id, [{ name: newGuestName.trim(), phone: newGuestPhone.trim() }]);
      setNewGuestName('');
      setNewGuestPhone('');
      setShowAddGuest(false);
      await load();
      toast.success(t('invitees.add_guest'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveGuard = async (guardId: string) => {
    if (!id) return;
    setActionLoading(true);
    try {
      await eventService.removeGuard(id, guardId);
      setGuardToDelete(null);
      await load();
      toast.success(t('events.guard_removed'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  // Fix 5: check slot limit before sending reminder
  const handleSendReminder = async () => {
    if (!id || !event) return;

    if (event.waiting_count === 0) {
      toast.info(t('events.no_waiting_guests'));
      return;
    }

    if (effectiveAvailable !== undefined && event.waiting_count > effectiveAvailable) {
      setShowUpgradeModal(true);
      return;
    }

    setActionLoading(true);
    try {
      const res = await eventService.remind(id, reminderMessage);
      if (res.success && res.data) {
        toast.success(t('events.reminder_sent').replace('{{count}}', String(res.data.sent)));
        setShowReminder(false);
        setReminderMessage('');
        await load();
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddGuard = async () => {
    if (!id || !guardPhone.trim()) return;
    setActionLoading(true);
    try {
      const res = await eventService.addGuard(id, guardPhone.trim());
      if (res.success) {
        toast.success(t('events.guard_added'));
        setShowAddGuard(false);
        setGuardPhone('');
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-48 bg-gray-200 rounded-2xl" />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">{t('common.error')}</p>
        <Button variant="link" onClick={() => navigate('/events')}>{t('wizard.back')}</Button>
      </div>
    );
  }

  const counters = [
    { label: t('events.waiting'), value: event.waiting_count, color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
    { label: t('events.accepted'), value: event.accepted_count, color: 'bg-green-50 border-green-200 text-green-700' },
    { label: t('events.declined'), value: event.declined_count, color: 'bg-red-50 border-red-200 text-red-700' },
    { label: t('events.arrived'), value: event.arrived_count, color: 'bg-blue-50 border-blue-200 text-blue-700' },
  ];

  const statusMap: Record<string, 'waiting' | 'accepted' | 'declined'> = {
    waiting: 'waiting',
    accepted: 'accepted',
    declined: 'declined',
  };

  const inputClass = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 placeholder:text-gray-400";

  // Fix 6: filter guest list by search query (wildcard, case-insensitive)
  const filteredInvitees = (event.invitees ?? []).filter((inv: Invitee) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return inv.name.toLowerCase().includes(q) || inv.phone.includes(searchQuery);
  });

  // Fix 2: build reminder info text with substituted values
  const reminderInfoText = t('events.reminder_info')
    .replace('{{waiting}}', String(event.waiting_count))
    .replace('{{available}}', effectiveAvailable !== undefined ? String(effectiveAvailable) : '—');

  // Fix 5: build limit-reached text
  const limitReachedText = t('events.reminder_limit_reached')
    .replace('{{max}}', String(event.package_detail?.max_guests ?? effectiveAvailable ?? 0));

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* QR code popup */}
      {qrInvitee && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setQrInvitee(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-xl text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-gray-900 text-base truncate">{qrInvitee.name}</h3>
              <button
                onClick={() => setQrInvitee(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-gray-500" dir="ltr">{qrInvitee.phone}</p>
            <div className="flex justify-center p-4 bg-gray-50 rounded-xl border border-gray-100">
              <QRCodeSVG
                value={`${window.location.origin}/invite/${qrInvitee.invite_token}`}
                size={200}
                level="M"
                includeMargin={false}
              />
            </div>
            <p className="text-xs text-gray-400">امسح الرمز عند الباب</p>
          </div>
        </div>
      )}

      {/* Fix 5: Upgrade modal overlay */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="font-bold text-gray-900 text-lg">{t('events.upgrade_package')}</h3>
            <p className="text-sm text-gray-600">{limitReachedText}</p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUpgradeModal(false)}
              >
                {t('common.close')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/events')}>
          <ArrowLeft size={18} className="rtl:rotate-180" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{event.title}</h1>
          <p className="text-sm text-gray-500">{t(`event_types.${event.event_type}`)}</p>
        </div>
        {/* Fix 2: single badge — deactivated replaces active when is_active=false */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {event.status === 'active' ? (
            <Badge variant={event.is_active ? 'active' : 'deactivated'}>
              {event.is_active ? t('events.status.active') : t('events.deactivated_badge')}
            </Badge>
          ) : (
            <Badge variant={event.status as 'draft' | 'completed' | 'payment_pending'}>
              {t(`events.status.${event.status}`)}
            </Badge>
          )}
          {event.status === 'active' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleActive}
              disabled={actionLoading}
            >
              {event.is_active ? t('events.deactivate') : t('events.activate')}
            </Button>
          )}
        </div>
      </div>

      {/* Event info */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar size={15} className="text-gray-400" />
          {formatDate(event.event_date, language)}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin size={15} className="text-gray-400" />
          {event.location_text}
        </div>
        {event.status === 'active' && (
          <Button
            className="w-full gap-2 mt-3"
            onClick={() => navigate(`/scanner?event=${event.id}`)}
          >
            <QrCode size={16} />
            {t('events.scan_qr')}
          </Button>
        )}
      </div>

      {/* Counters */}
      {event.status !== 'draft' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {counters.map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl border p-4 text-center ${color}`}>
              <div className="text-3xl font-bold">{value ?? 0}</div>
              <div className="text-sm mt-1">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Fix 4: Available invitations — uses effectiveAvailable which has package_detail fallback */}
      {effectiveAvailable !== undefined && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl px-5 py-3 flex justify-between items-center">
          <span className="text-sm text-purple-700">{t('events.available_invitations')}</span>
          <span className="font-bold text-purple-800">{effectiveAvailable}</span>
        </div>
      )}

      {/* Action buttons */}
      {event.status === 'active' && event.is_active && (
        <div className="flex gap-3 flex-wrap">
          {(effectiveAvailable ?? 0) > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setShowAddGuest(!showAddGuest); setShowReminder(false); setShowAddGuard(false); }}
            >
              + {t('events.add_guest')}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setShowReminder(!showReminder); setShowAddGuest(false); setShowAddGuard(false); }}
          >
            🔔 {t('events.send_reminder')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setShowAddGuard(!showAddGuard); setShowAddGuest(false); setShowReminder(false); }}
          >
            🛡 {t('events.add_guard')}
          </Button>
        </div>
      )}

      {/* Add guest panel */}
      {showAddGuest && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
          <h3 className="font-semibold text-gray-900">{t('events.add_guest')}</h3>
          <div className="flex gap-3">
            <input
              className={inputClass + ' flex-1'}
              placeholder={t('invitees.guest_name')}
              value={newGuestName}
              onChange={(e) => setNewGuestName(e.target.value)}
            />
            <input
              className={inputClass + ' flex-1'}
              placeholder={t('invitees.mobile')}
              value={newGuestPhone}
              dir="ltr"
              onChange={(e) => setNewGuestPhone(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleAddGuest}
              disabled={actionLoading || !newGuestName.trim() || !newGuestPhone.trim()}
            >
              {t('invitees.add_guest')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowAddGuest(false)}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      )}

      {/* Fix 2: Reminder panel — shows slot-deduction warning */}
      {showReminder && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
          <h3 className="font-semibold text-gray-900">{t('events.send_reminder')}</h3>
          <p className="text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-2 leading-relaxed">
            {reminderInfoText}
          </p>
          <textarea
            className={inputClass + ' resize-none'}
            rows={3}
            placeholder={t('events.reminder_message')}
            value={reminderMessage}
            onChange={(e) => setReminderMessage(e.target.value)}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSendReminder} disabled={actionLoading}>
              🔔 {t('events.send_reminder')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowReminder(false)}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      )}

      {/* Fix 3: Add guard panel — shows auto-account info */}
      {showAddGuard && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
          <h3 className="font-semibold text-gray-900">{t('events.add_guard')}</h3>
          <p className="text-xs bg-blue-50 border border-blue-200 text-blue-700 rounded-lg px-3 py-2 leading-relaxed">
            {t('events.guard_info')}
          </p>
          <input
            className={inputClass}
            placeholder={t('events.guard_phone')}
            value={guardPhone}
            dir="ltr"
            onChange={(e) => setGuardPhone(e.target.value)}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAddGuard} disabled={actionLoading || !guardPhone.trim()}>
              🛡 {t('events.add_guard')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowAddGuard(false)}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      )}

      {/* Fix 3: Guards list — above guest list */}
      {event.guards_list && event.guards_list.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <span className="text-base">🛡</span>
            <h2 className="font-semibold text-gray-900">{t('events.add_guard')}</h2>
            <span className="ms-auto text-sm text-gray-400">
              {event.guards_list.length}
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {event.guards_list.map((guard: Guard) => (
              <div key={guard.id} className="flex gap-3 px-5 py-4 items-center">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                  {guard.full_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{guard.full_name}</p>
                  <p className="text-xs text-gray-400" dir="ltr">{guard.phone}</p>
                </div>
                {/* Inline delete confirmation */}
                {guardToDelete === guard.id ? (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => handleRemoveGuard(guard.id)}
                      disabled={actionLoading}
                    >
                      {t('common.confirm')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs"
                      onClick={() => setGuardToDelete(null)}
                    >
                      {t('common.cancel')}
                    </Button>
                  </div>
                ) : (
                  <button
                    className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    onClick={() => setGuardToDelete(guard.id)}
                    title={t('common.delete')}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fix 6: Guest list with search + timeline */}
      {event.invitees && event.invitees.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 space-y-3">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-gray-400" />
              <h2 className="font-semibold text-gray-900">{t('invitees.title')}</h2>
              <span className="ms-auto text-sm text-gray-400">
                {event.invitees.length} {t('events.guests')}
              </span>
            </div>
            {/* Search input */}
            <div className="relative">
              <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full rounded-lg border border-gray-200 bg-gray-50 ps-8 pe-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 placeholder:text-gray-400"
                placeholder={t('events.search_guests')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {filteredInvitees.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">
                {t('common.search')}…
              </div>
            ) : (
              filteredInvitees.map((inv: Invitee) => (
                <div key={inv.id || inv.phone} className="flex gap-3 px-5 py-4">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm flex-shrink-0">
                    {inv.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{inv.name}</p>
                    <p className="text-xs text-gray-400" dir="ltr">{inv.phone}</p>
                    {/* Timeline */}
                    <div className="mt-2 flex flex-col gap-0.5 text-xs text-gray-500">
                      <span>
                        📨 {t('events.sent_at')}: {inv.sent_at ? formatDate(inv.sent_at, language) : t('events.no_timestamp')}
                      </span>
                      {inv.response_status && inv.response_status !== 'waiting' && (
                        <span>
                          {inv.response_status === 'accepted' ? '✅' : '❌'} {t(`events.${inv.response_status}`)}
                          {inv.responded_at ? ` · ${formatDate(inv.responded_at, language)}` : ''}
                        </span>
                      )}
                      {inv.arrived && (
                        <span>
                          🚪 {t('events.arrived_at')}: {inv.arrived_at ? formatDate(inv.arrived_at, language) : t('events.no_timestamp')}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Status badge + QR icon */}
                  <div className="flex-shrink-0 flex flex-col items-end gap-2">
                    {inv.arrived ? (
                      <Badge variant="arrived">{t('events.arrived')}</Badge>
                    ) : (
                      <Badge variant={statusMap[inv.response_status ?? 'waiting'] ?? 'waiting'}>
                        {t(`events.${inv.response_status ?? 'waiting'}`)}
                      </Badge>
                    )}
                    {inv.invite_token && (
                      <button
                        onClick={() => setQrInvitee(inv)}
                        className="p-1 rounded-md text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                        title="عرض رمز QR"
                      >
                        <QrCode size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetailPage;
