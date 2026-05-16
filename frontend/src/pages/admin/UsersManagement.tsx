import React, { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, Search, ShieldCheck, UserCheck, UserX, Plus, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { adminService } from '../../services/adminService';
import { AdminUser } from '../../types';
import { Input } from '../../components/ui/Input';

const UsersManagement = () => {
  const { t } = useLanguage();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  // ── Create user ───────────────────────────────────────────────────────────
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({ phone: '', full_name: '', password: '' });
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const load = useCallback(async (q?: string) => {
    setLoading(true);
    const res = await adminService.listUsers(q);
    if (res.success && res.data) setUsers(res.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => { load(search || undefined); }, 400);
    return () => clearTimeout(timer);
  }, [search, load]);

  const toggleField = async (user: AdminUser, field: 'is_active' | 'is_admin') => {
    setUpdating(user.id + field);
    const update = { [field]: !user[field] };
    const res = await adminService.updateUser(user.id, update);
    if (res.success) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, [field]: !user[field] } : u))
      );
      showToast(t('admin.user_updated'));
    }
    setUpdating(null);
  };

  const handleCreateUser = async () => {
    setCreateError('');
    if (!createForm.phone.trim() || !createForm.password.trim()) return;
    setCreateLoading(true);
    try {
      const res = await adminService.createUser({
        phone: createForm.phone.trim(),
        full_name: createForm.full_name.trim(),
        password: createForm.password.trim(),
      });
      if (res.success && res.data) {
        setUsers(prev => [res.data!, ...prev]);
        setCreateForm({ phone: '', full_name: '', password: '' });
        setShowCreateForm(false);
        showToast(t('admin.user_created'));
      } else {
        const detail = (res as any)?.error?.detail || '';
        if (String(detail).includes('phone_exists')) {
          setCreateError(t('admin.phone_exists'));
        } else {
          setCreateError(t('common.error'));
        }
      }
    } catch {
      setCreateError(t('common.error'));
    } finally {
      setCreateLoading(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm ' +
    'focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 ' +
    'placeholder:text-gray-400';

  return (
    <div className="space-y-5">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/admin">
          <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <ChevronLeft size={20} />
          </button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex-1">{t('admin.users')}</h1>
        <span className="text-sm text-gray-500">{users.length}</span>
        <button
          onClick={() => {
            setShowCreateForm(f => !f);
            setCreateForm({ phone: '', full_name: '', password: '' });
            setCreateError('');
          }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
            showCreateForm
              ? 'bg-gray-200 text-gray-700'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {showCreateForm ? <X size={15} /> : <Plus size={15} />}
          {t('admin.create_user')}
        </button>
      </div>

      {/* ── Create user form ───────────────────────────────────────────────── */}
      {showCreateForm && (
        <div className="bg-white rounded-2xl border border-purple-200 p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">{t('admin.create_user_title')}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('auth.phone')} *</label>
              <input
                className={inputClass}
                placeholder="05XXXXXXXX"
                dir="ltr"
                value={createForm.phone}
                onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('auth.full_name')}</label>
              <input
                className={inputClass}
                placeholder={t('auth.full_name_placeholder')}
                value={createForm.full_name}
                onChange={e => setCreateForm(f => ({ ...f, full_name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('auth.password')} *</label>
              <input
                className={inputClass}
                type="password"
                placeholder={t('auth.password_placeholder')}
                value={createForm.password}
                onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
              />
            </div>
          </div>

          {createError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {createError}
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleCreateUser}
              disabled={createLoading || !createForm.phone.trim() || !createForm.password.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {createLoading ? t('common.loading') : t('admin.create_user_title')}
            </button>
            <button
              onClick={() => { setShowCreateForm(false); setCreateError(''); }}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          className="ps-9"
          placeholder={t('admin.search_users')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-gray-400">{t('admin.no_users')}</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {users.map((user) => (
            <div key={user.id} className="flex items-center gap-4 px-5 py-4">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                {(user.full_name || user.phone).charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{user.full_name || '—'}</p>
                <p className="text-sm text-gray-400" dir="ltr">{user.phone}</p>
                <p className="text-xs text-gray-400">
                  {t('admin.registered_at')}: {formatDate(user.created_at)} · {user.event_count} events
                </p>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleField(user, 'is_admin')}
                  disabled={updating === user.id + 'is_admin'}
                  title={t('admin.is_admin_label')}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                    user.is_admin
                      ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  <ShieldCheck size={14} />
                  {t('admin.is_admin_label')}
                </button>

                <button
                  onClick={() => toggleField(user, 'is_active')}
                  disabled={updating === user.id + 'is_active'}
                  title={t('admin.is_active_label')}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                    user.is_active
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-red-100 text-red-500 hover:bg-red-200'
                  }`}
                >
                  {user.is_active ? <UserCheck size={14} /> : <UserX size={14} />}
                  {t('admin.is_active_label')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UsersManagement;
