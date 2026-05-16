import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Check, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { adminService } from '../../services/adminService';
import { AdminPackage } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const EMPTY_FORM: Partial<AdminPackage> = {
  name_ar: '',
  name_en: '',
  min_guests: 0,
  max_guests: 10,
  price_sar: 0,
  is_active: true,
};

const PackagesManagement = () => {
  const { t, language } = useLanguage();
  const [packages, setPackages] = useState<AdminPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<AdminPackage>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const load = async () => {
    setLoading(true);
    const res = await adminService.listPackages();
    if (res.success && res.data) setPackages(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (pkg: AdminPackage) => {
    setEditingId(pkg.id);
    setForm({ ...pkg });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!form.name_ar || !form.name_en) return;
    setSaving(true);
    try {
      if (editingId) {
        await adminService.updatePackage(editingId, form);
      } else {
        await adminService.createPackage(form);
      }
      showToast(t('admin.package_saved'));
      closeForm();
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await adminService.deletePackage(id);
    showToast(t('admin.package_deleted'));
    setDeleteConfirm(null);
    await load();
  };

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
        <h1 className="text-2xl font-bold text-gray-900 flex-1">{t('admin.packages')}</h1>
        <Button onClick={openCreate} className="gap-2">
          <Plus size={16} />
          {t('admin.add_package')}
        </Button>
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-purple-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">
            {editingId ? t('admin.edit_package') : t('admin.add_package')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('admin.package_name_ar')}</label>
              <Input
                value={form.name_ar ?? ''}
                onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
                placeholder="الباقة المجانية"
                dir="rtl"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('admin.package_name_en')}</label>
              <Input
                value={form.name_en ?? ''}
                onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                placeholder="Free Package"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('admin.min_guests')}</label>
              <Input
                type="number"
                value={form.min_guests ?? 0}
                onChange={(e) => setForm({ ...form, min_guests: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('admin.max_guests')}</label>
              <Input
                type="number"
                value={form.max_guests ?? 0}
                onChange={(e) => setForm({ ...form, max_guests: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('admin.price')}</label>
              <Input
                type="number"
                value={form.price_sar ?? 0}
                onChange={(e) => setForm({ ...form, price_sar: Number(e.target.value) })}
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
                <span className="text-sm text-gray-700">{t('admin.is_active_pkg')}</span>
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
      ) : packages.length === 0 ? (
        <div className="text-center py-12 text-gray-400">{t('admin.no_packages')}</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {packages.map((pkg) => (
            <div key={pkg.id} className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">
                  {language === 'ar' ? pkg.name_ar : pkg.name_en}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {pkg.name_ar} · {pkg.name_en}
                </p>
                <p className="text-sm text-gray-500">
                  {t('packages.guests_range', { min: pkg.min_guests, max: pkg.max_guests })}
                </p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-purple-700">
                  {pkg.price_sar === 0 ? t('packages.free') : `${pkg.price_sar} ${t('common.sar')}`}
                </p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${pkg.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {pkg.is_active ? t('admin.is_active_label') : '—'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(pkg)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                  title={t('admin.edit_package')}
                >
                  <Pencil size={16} />
                </button>
                {deleteConfirm === pkg.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(pkg.id)}
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
                    onClick={() => setDeleteConfirm(pkg.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500"
                    title={t('admin.delete_package')}
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

export default PackagesManagement;
