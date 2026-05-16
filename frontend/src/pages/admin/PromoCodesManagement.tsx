import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Check, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { adminService } from '../../services/adminService';
import { PromoCode } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const EMPTY_FORM: Partial<PromoCode> = {
  code: '',
  discount_percent: 10,
  max_uses: 100,
  is_active: true,
  expires_at: null,
};

const PromoCodesManagement = () => {
  const { t } = useLanguage();
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<PromoCode>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const load = async () => {
    setLoading(true);
    const res = await adminService.listPromos();
    if (res.success && res.data) setPromos(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (promo: PromoCode) => {
    setEditingId(promo.id);
    setForm({ ...promo });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!form.code) return;
    setSaving(true);
    try {
      if (editingId) {
        await adminService.updatePromo(editingId, form);
      } else {
        await adminService.createPromo(form);
      }
      showToast(t('admin.promo_saved'));
      closeForm();
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await adminService.deletePromo(id);
    showToast(t('admin.promo_deleted'));
    setDeleteConfirm(null);
    await load();
  };

  const formatDate = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
      : '—';

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
        <h1 className="text-2xl font-bold text-gray-900 flex-1">{t('admin.promo_codes')}</h1>
        <Button onClick={openCreate} className="gap-2">
          <Plus size={16} />
          {t('admin.add_promo')}
        </Button>
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-purple-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">
            {editingId ? t('common.edit') : t('admin.add_promo')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('admin.promo_code')}</label>
              <Input
                value={form.code ?? ''}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="SAVE20"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('admin.discount_pct')}</label>
              <Input
                type="number"
                min={1}
                max={100}
                value={form.discount_percent ?? 10}
                onChange={(e) => setForm({ ...form, discount_percent: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('admin.max_uses')}</label>
              <Input
                type="number"
                min={1}
                value={form.max_uses ?? 100}
                onChange={(e) => setForm({ ...form, max_uses: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('admin.expires_at')}</label>
              <Input
                type="date"
                value={form.expires_at ? form.expires_at.split('T')[0] : ''}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value || null })}
              />
            </div>
            <div className="flex items-center gap-3 pt-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.is_active ?? true}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-4 h-4 accent-purple-600"
                />
                <span className="text-sm text-gray-700">{t('admin.is_active_label')}</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button onClick={handleSave} loading={saving} className="gap-2">
              <Check size={16} />
              {t('common.save')}
            </Button>
            <Button variant="outline" onClick={closeForm} className="gap-2">
              <X size={16} />
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
      ) : promos.length === 0 ? (
        <div className="text-center py-12 text-gray-400">{t('admin.no_promos')}</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {promos.map((promo) => (
            <div key={promo.id} className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-mono font-bold text-gray-900 text-sm tracking-wide">{promo.code}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      promo.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {promo.is_active ? t('admin.is_active_label') : '—'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  {promo.discount_percent}% off · {t('admin.used')}: {promo.used_count}/{promo.max_uses}
                </p>
                <p className="text-xs text-gray-400">
                  {t('admin.expires_at')}: {formatDate(promo.expires_at)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(promo)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                  title={t('common.edit')}
                >
                  <Pencil size={16} />
                </button>
                {deleteConfirm === promo.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(promo.id)}
                      className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      {t('common.confirm')}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(promo.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500"
                    title={t('common.delete')}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PromoCodesManagement;
