import React, { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, Search, Users, ChevronDown, Plus, Edit2, Trash2, Check, X, ArrowLeftRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '../../contexts/LanguageContext';
import { adminService } from '../../services/adminService';
import { AdminEvent, AdminUser, Invitee, EventStatus } from '../../types';
import { Input } from '../../components/ui/Input';

const STATUS_COLORS: Record<EventStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  payment_pending: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
};

const RESPONSE_COLORS: Record<string, string> = {
  waiting: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
};

const AllEventsPage = () => {
  const { t, language } = useLanguage();

  // ── Events ────────────────────────────────────────────────────────────────
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // ── Owner filter ──────────────────────────────────────────────────────────
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);
  const [ownerSearch, setOwnerSearch] = useState('');

  // ── Guest management ──────────────────────────────────────────────────────
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [eventInvitees, setEventInvitees] = useState<Record<string, Invitee[]>>({});
  const [inviteesLoading, setInviteesLoading] = useState<string | null>(null);
  const [editInviteeId, setEditInviteeId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '', phone: '', response_status: 'waiting', arrived: false,
  });
  const [deleteInviteeId, setDeleteInviteeId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', phone: '' });
  const [actionLoading, setActionLoading] = useState(false);

  // ── Reassign owner ────────────────────────────────────────────────────────
  const [reassignEvent, setReassignEvent] = useState<AdminEvent | null>(null);
  const [reassignSearch, setReassignSearch] = useState('');
  const [reassignLoading, setReassignLoading] = useState(false);

  // ── Load events ───────────────────────────────────────────────────────────
  const load = useCallback(async (q?: string, st?: string, owners?: string[]) => {
    setLoading(true);
    const res = await adminService.listEvents({
      search: q || undefined,
      status: st || undefined,
      owners: owners?.length ? owners : undefined,
    });
    if (res.success && res.data) setEvents(res.data);
    setLoading(false);
  }, []);

  // Load users for dropdown on mount
  useEffect(() => {
    adminService.listUsers().then(res => {
      if (res.success && res.data) setAllUsers(res.data);
    });
    load();
  }, [load]);

  // Debounced filter effect
  useEffect(() => {
    const timer = setTimeout(() => {
      load(search || undefined, statusFilter || undefined, selectedOwners);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, statusFilter, selectedOwners, load]);

  // ── Load invitees for an event ────────────────────────────────────────────
  const loadInvitees = useCallback(async (eventId: string, force = false) => {
    if (!force && eventInvitees[eventId] !== undefined) return;
    setInviteesLoading(eventId);
    const res = await adminService.listEventInvitees(eventId);
    if (res.success && res.data) {
      setEventInvitees(prev => ({ ...prev, [eventId]: res.data! }));
    }
    setInviteesLoading(null);
  }, [eventInvitees]);

  const handleExpandEvent = (eventId: string) => {
    if (expandedEventId === eventId) {
      setExpandedEventId(null);
    } else {
      setExpandedEventId(eventId);
      setEditInviteeId(null);
      setDeleteInviteeId(null);
      setShowAddForm(false);
      setAddForm({ name: '', phone: '' });
      loadInvitees(eventId);
    }
  };

  // ── Guest CRUD ────────────────────────────────────────────────────────────
  const handleAddInvitee = async (eventId: string) => {
    if (!addForm.name.trim() || !addForm.phone.trim()) return;
    setActionLoading(true);
    try {
      const res = await adminService.createEventInvitee(eventId, {
        name: addForm.name.trim(),
        phone: addForm.phone.trim(),
      });
      if (res.success) {
        toast.success(t('admin.guest_added'));
        setAddForm({ name: '', phone: '' });
        setShowAddForm(false);
        await loadInvitees(eventId, true);
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  const startEdit = (inv: Invitee) => {
    setEditInviteeId(inv.id!);
    setEditForm({
      name: inv.name,
      phone: inv.phone,
      response_status: inv.response_status ?? 'waiting',
      arrived: inv.arrived ?? false,
    });
    setDeleteInviteeId(null);
  };

  const handleSaveEdit = async (eventId: string, invId: string) => {
    setActionLoading(true);
    try {
      const res = await adminService.updateEventInvitee(eventId, invId, {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        response_status: editForm.response_status,
        arrived: editForm.arrived,
      });
      if (res.success) {
        toast.success(t('admin.guest_updated'));
        setEditInviteeId(null);
        await loadInvitees(eventId, true);
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteInvitee = async (eventId: string, invId: string) => {
    setActionLoading(true);
    try {
      await adminService.deleteEventInvitee(eventId, invId);
      toast.success(t('admin.guest_deleted'));
      setDeleteInviteeId(null);
      await loadInvitees(eventId, true);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  // ── Reassign owner ────────────────────────────────────────────────────────
  const handleAssignOwner = async (eventId: string, newOwnerId: string) => {
    setReassignLoading(true);
    try {
      const res = await adminService.assignEventOwner(eventId, newOwnerId);
      if (res.success && res.data) {
        setEvents(prev => prev.map(ev => ev.id === eventId ? res.data! : ev));
        setReassignEvent(null);
        setReassignSearch('');
        toast.success(t('admin.owner_assigned'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setReassignLoading(false);
    }
  };

  const filteredReassignUsers = allUsers.filter(u => {
    if (!reassignSearch.trim()) return true;
    const q = reassignSearch.toLowerCase();
    return u.full_name?.toLowerCase().includes(q) || u.phone.includes(reassignSearch);
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });

  const statuses = [
    { value: '', label: t('admin.filter_all') },
    { value: 'draft', label: t('events.status.draft') },
    { value: 'payment_pending', label: t('events.status.payment_pending') },
    { value: 'active', label: t('events.status.active') },
    { value: 'completed', label: t('events.status.completed') },
  ];

  const filteredUsers = allUsers.filter(u => {
    if (!ownerSearch.trim()) return true;
    const q = ownerSearch.toLowerCase();
    return (u.full_name?.toLowerCase().includes(q) || u.phone.includes(ownerSearch));
  });

  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm ' +
    'focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 ' +
    'placeholder:text-gray-400';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Reassign owner modal ──────────────────────────────────────────── */}
      {reassignEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => { setReassignEvent(null); setReassignSearch(''); }}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{t('admin.reassign_owner')}</h3>
              <button
                onClick={() => { setReassignEvent(null); setReassignSearch(''); }}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Event title */}
            <p className="text-sm text-gray-600 truncate font-medium">{reassignEvent.title}</p>

            {/* Current owner */}
            <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-xl px-3 py-2">
              <div className="w-7 h-7 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-bold text-xs flex-shrink-0">
                {(reassignEvent.owner_name || reassignEvent.owner_phone).charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-purple-500">{t('admin.current_owner')}</p>
                <p className="text-sm font-medium text-purple-800 truncate">
                  {reassignEvent.owner_name || reassignEvent.owner_phone}
                </p>
              </div>
            </div>

            {/* Search */}
            <input
              autoFocus
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 placeholder:text-gray-400"
              placeholder={t('common.search') + '...'}
              value={reassignSearch}
              onChange={e => setReassignSearch(e.target.value)}
            />

            {/* User list */}
            <div className="max-h-52 overflow-y-auto -mx-1 space-y-0.5">
              {filteredReassignUsers.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">{t('admin.no_users')}</p>
              ) : (
                filteredReassignUsers.map(user => {
                  const isCurrent = user.id === reassignEvent.owner_id;
                  return (
                    <button
                      key={user.id}
                      onClick={() => !isCurrent && handleAssignOwner(reassignEvent.id, user.id)}
                      disabled={reassignLoading || isCurrent}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-start transition-colors ${
                        isCurrent
                          ? 'bg-purple-50 cursor-default'
                          : 'hover:bg-gray-50 cursor-pointer'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                        isCurrent ? 'bg-purple-200 text-purple-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {(user.full_name || user.phone).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isCurrent ? 'text-purple-700' : 'text-gray-800'}`}>
                          {user.full_name || user.phone}
                        </p>
                        <p className="text-xs text-gray-400" dir="ltr">{user.phone}</p>
                      </div>
                      {isCurrent && (
                        <Check size={14} className="text-purple-500 flex-shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/admin">
          <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <ChevronLeft size={20} />
          </button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex-1">{t('admin.all_events')}</h1>
        <span className="text-sm text-gray-500">{events.length}</span>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">

        {/* Search bar + User filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              className="ps-9"
              placeholder={t('admin.search_users')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Owner multi-select dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowOwnerDropdown(!showOwnerDropdown)}
              className={`flex items-center gap-2 h-10 px-3 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap ${
                selectedOwners.length > 0
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
              }`}
            >
              <Users size={15} />
              {selectedOwners.length > 0
                ? t('admin.selected_users').replace('{{count}}', String(selectedOwners.length))
                : t('admin.filter_by_user')}
              <ChevronDown size={14} />
            </button>

            {showOwnerDropdown && (
              <>
                {/* Backdrop */}
                <div className="fixed inset-0 z-10" onClick={() => setShowOwnerDropdown(false)} />
                {/* Panel */}
                <div className="absolute end-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg w-64 max-h-72 overflow-hidden flex flex-col">
                  {/* Search inside dropdown */}
                  <div className="p-2 border-b border-gray-100">
                    <input
                      autoFocus
                      className="w-full text-sm px-2 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-purple-400 placeholder:text-gray-400"
                      placeholder={t('common.search') + '...'}
                      value={ownerSearch}
                      onChange={e => setOwnerSearch(e.target.value)}
                    />
                  </div>
                  {/* User list */}
                  <div className="overflow-y-auto flex-1">
                    {filteredUsers.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">{t('admin.no_users')}</p>
                    ) : (
                      filteredUsers.map(user => (
                        <label
                          key={user.id}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedOwners.includes(user.id)}
                            onChange={(e) => {
                              setSelectedOwners(prev =>
                                e.target.checked
                                  ? [...prev, user.id]
                                  : prev.filter(id => id !== user.id)
                              );
                            }}
                            className="accent-purple-600 w-4 h-4 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 truncate">
                              {user.full_name || user.phone}
                            </p>
                            <p className="text-xs text-gray-400" dir="ltr">{user.phone}</p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                  {/* Clear footer */}
                  {selectedOwners.length > 0 && (
                    <div className="p-2 border-t border-gray-100 flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {selectedOwners.length} {t('admin.selected')}
                      </span>
                      <button
                        onClick={() => setSelectedOwners([])}
                        className="text-xs text-red-500 hover:text-red-700 font-medium"
                      >
                        {t('admin.clear_filter')}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Status chips */}
        <div className="flex gap-2 flex-wrap">
          {statuses.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === s.value
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Event list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 text-gray-400">{t('admin.no_events_admin')}</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {events.map((ev, idx) => (
            <div key={ev.id} className={idx > 0 ? 'border-t border-gray-100' : ''}>

              {/* ── Event row ──────────────────────────────────────────── */}
              <div className="flex items-center gap-4 px-5 py-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-900 truncate">{ev.title}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[ev.status]}`}
                    >
                      {t(`events.status.${ev.status}`)}
                    </span>
                    {ev.status === 'active' && !ev.is_active && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">
                        {t('events.deactivated_badge')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {t('admin.event_owner')}: {ev.owner_name || ev.owner_phone}
                    {' · '}
                    <span dir="ltr">{ev.owner_phone}</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDate(ev.event_date)} · {ev.location_text}
                  </p>
                </div>

                {/* Guest count + action buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-center min-w-[2.5rem]">
                    <p className="text-lg font-bold text-gray-700">
                      {eventInvitees[ev.id] !== undefined
                        ? eventInvitees[ev.id].length
                        : ev.guest_count}
                    </p>
                    <p className="text-xs text-gray-400">{t('events.guests')}</p>
                  </div>
                  {/* Change owner */}
                  <button
                    onClick={() => { setReassignEvent(ev); setReassignSearch(''); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                    title={t('admin.reassign_owner')}
                  >
                    <ArrowLeftRight size={13} />
                    {t('admin.reassign_owner')}
                  </button>
                  {/* Manage guests */}
                  <button
                    onClick={() => handleExpandEvent(ev.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      expandedEventId === ev.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                    }`}
                  >
                    <Users size={13} />
                    {t('admin.manage_guests')}
                  </button>
                </div>
              </div>

              {/* ── Guest management panel ─────────────────────────────── */}
              {expandedEventId === ev.id && (
                <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 space-y-3">

                  {/* Panel header */}
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800 text-sm">
                      {t('admin.guest_management')}
                    </h3>
                    <button
                      onClick={() => {
                        setShowAddForm(f => !f);
                        setAddForm({ name: '', phone: '' });
                        setEditInviteeId(null);
                      }}
                      className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium"
                    >
                      <Plus size={14} />
                      {t('admin.add_guest')}
                    </button>
                  </div>

                  {/* Add guest form */}
                  {showAddForm && (
                    <div className="bg-white rounded-xl border border-purple-200 p-3 space-y-2">
                      <div className="flex gap-2">
                        <input
                          className={inputClass + ' flex-1'}
                          placeholder={t('invitees.guest_name')}
                          value={addForm.name}
                          onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                        />
                        <input
                          className={inputClass + ' flex-1'}
                          placeholder={t('invitees.mobile')}
                          dir="ltr"
                          value={addForm.phone}
                          onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddInvitee(ev.id)}
                          disabled={actionLoading || !addForm.name.trim() || !addForm.phone.trim()}
                          className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium disabled:opacity-50 hover:bg-purple-700 transition-colors"
                        >
                          {t('common.save')}
                        </button>
                        <button
                          onClick={() => { setShowAddForm(false); setAddForm({ name: '', phone: '' }); }}
                          className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          {t('common.cancel')}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Invitees list */}
                  {inviteesLoading === ev.id ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : !eventInvitees[ev.id] || eventInvitees[ev.id].length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">
                      {t('admin.no_invitees')}
                    </p>
                  ) : (
                    <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
                      {eventInvitees[ev.id].map((inv: Invitee) => (
                        <div key={inv.id} className="px-4 py-3">
                          {editInviteeId === inv.id ? (
                            /* ── Edit form ── */
                            <div className="space-y-2">
                              {/* Row 1: name + phone */}
                              <div className="flex gap-2">
                                <input
                                  className={inputClass + ' flex-1'}
                                  placeholder={t('invitees.guest_name')}
                                  value={editForm.name}
                                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                />
                                <input
                                  className={inputClass + ' flex-1'}
                                  placeholder={t('invitees.mobile')}
                                  dir="ltr"
                                  value={editForm.phone}
                                  onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                                />
                              </div>
                              {/* Row 2: status + arrived + actions */}
                              <div className="flex items-center gap-2 flex-wrap">
                                {/* Response status select */}
                                <select
                                  className={inputClass + ' flex-1 min-w-[8rem]'}
                                  value={editForm.response_status}
                                  onChange={e => setEditForm(f => ({ ...f, response_status: e.target.value }))}
                                >
                                  <option value="waiting">{t('events.waiting')}</option>
                                  <option value="accepted">{t('events.accepted')}</option>
                                  <option value="declined">{t('events.declined')}</option>
                                </select>
                                {/* Arrived toggle */}
                                <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0 select-none">
                                  <input
                                    type="checkbox"
                                    checked={editForm.arrived}
                                    onChange={e => setEditForm(f => ({ ...f, arrived: e.target.checked }))}
                                    className="accent-blue-600 w-4 h-4"
                                  />
                                  <span className="text-xs text-gray-600">{t('events.arrived')}</span>
                                </label>
                                {/* Save / Cancel */}
                                <div className="flex gap-1 ms-auto flex-shrink-0">
                                  <button
                                    onClick={() => handleSaveEdit(ev.id, inv.id!)}
                                    disabled={actionLoading}
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium disabled:opacity-50 hover:bg-green-700 transition-colors"
                                  >
                                    <Check size={12} />
                                    {t('common.save')}
                                  </button>
                                  <button
                                    onClick={() => setEditInviteeId(null)}
                                    className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                                  >
                                    <X size={12} />
                                    {t('common.cancel')}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* ── Normal row ── */
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs flex-shrink-0">
                                {inv.name.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {inv.name}
                                </p>
                                <p className="text-xs text-gray-400" dir="ltr">{inv.phone}</p>
                              </div>
                              {/* Status badge */}
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                                  inv.arrived
                                    ? 'bg-blue-100 text-blue-700'
                                    : RESPONSE_COLORS[inv.response_status ?? 'waiting']
                                }`}
                              >
                                {inv.arrived
                                  ? t('events.arrived')
                                  : t(`events.${inv.response_status ?? 'waiting'}`)}
                              </span>
                              {/* Action buttons */}
                              {deleteInviteeId === inv.id ? (
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button
                                    onClick={() => handleDeleteInvitee(ev.id, inv.id!)}
                                    disabled={actionLoading}
                                    className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                                  >
                                    {t('common.confirm')}
                                  </button>
                                  <button
                                    onClick={() => setDeleteInviteeId(null)}
                                    className="px-2 py-1 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100"
                                  >
                                    {t('common.cancel')}
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button
                                    onClick={() => startEdit(inv)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                                    title={t('common.edit')}
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDeleteInviteeId(inv.id!);
                                      setEditInviteeId(null);
                                    }}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                    title={t('common.delete')}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllEventsPage;
