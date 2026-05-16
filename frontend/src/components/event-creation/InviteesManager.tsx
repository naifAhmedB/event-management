import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Trash2, UserPlus, Upload, Download } from 'lucide-react';
import { Invitee } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../lib/utils';

interface InviteesManagerProps {
  invitees: Invitee[];
  onAdd: (invitee: Invitee) => void;
  onRemove: (phone: string) => void;
  onBulkAdd: (invitees: Invitee[]) => void;
}

const InviteesManager = ({ invitees, onAdd, onRemove, onBulkAdd }: InviteesManagerProps) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'manual' | 'excel'>('manual');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [excelPreview, setExcelPreview] = useState<{ name: string; phone: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    let valid = true;
    if (!name.trim()) { setNameError(t('common.required')); valid = false; } else setNameError('');
    if (!phone.trim()) { setPhoneError(t('common.required')); valid = false; }
    else if (!/^(05|5|\+9665)\d{8}$/.test(phone)) { setPhoneError(t('common.invalid_phone')); valid = false; }
    else setPhoneError('');
    if (!valid) return;

    onAdd({ name: name.trim(), phone: phone.trim() });
    setName('');
    setPhone('');
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const wb = XLSX.read(event.target?.result, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<{ Name?: string; Phone?: string; الاسم?: string; الجوال?: string }>(ws);
      const parsed = data.map((row) => ({
        name: String(row.Name || row['الاسم'] || '').trim(),
        phone: String(row.Phone || row['الجوال'] || '').trim(),
      })).filter((r) => r.name && r.phone);
      setExcelPreview(parsed);
    };
    reader.readAsArrayBuffer(file);
    // Reset input
    e.target.value = '';
  };

  const confirmExcelImport = () => {
    onBulkAdd(excelPreview.map((r) => ({ name: r.name, phone: r.phone })));
    setExcelPreview([]);
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([['Name', 'Phone', 'الاسم', 'الجوال'], ['Ahmed Ali', '0501234567', 'أحمد علي', '0501234567']]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Guests');
    XLSX.writeFile(wb, 'guests_template.xlsx');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{t('invitees.title')}</h3>
        <span className="text-sm text-gray-500">
          {t('invitees.total')}: <strong>{invitees.length}</strong>
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        {(['manual', 'excel'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'pb-2.5 px-4 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            {tab === 'manual' ? t('invitees.add_manual') : t('invitees.add_excel')}
          </button>
        ))}
      </div>

      {activeTab === 'manual' && (
        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder={t('invitees.guest_name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={nameError}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Input
              placeholder={t('invitees.mobile')}
              type="tel"
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={phoneError}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <Button onClick={handleAdd} variant="outline" className="w-full gap-2">
            <UserPlus size={16} />
            {t('invitees.add_guest')}
          </Button>
        </div>
      )}

      {activeTab === 'excel' && (
        <div className="space-y-3 mb-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2 flex-1"
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={16} />
              {t('invitees.upload_file')}
            </Button>
            <Button variant="ghost" className="gap-2" onClick={downloadTemplate}>
              <Download size={16} />
              {t('invitees.download_template')}
            </Button>
          </div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcelUpload} />

          {excelPreview.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 flex items-center justify-between">
                <span>{t('invitees.upload_preview')} ({excelPreview.length})</span>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {excelPreview.slice(0, 10).map((row, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2 border-t border-gray-100 text-sm">
                    <span className="flex-1 font-medium">{row.name}</span>
                    <span className="text-gray-500 dir-ltr">{row.phone}</span>
                  </div>
                ))}
                {excelPreview.length > 10 && (
                  <div className="px-4 py-2 text-xs text-gray-400 text-center">
                    +{excelPreview.length - 10} more
                  </div>
                )}
              </div>
              <div className="p-3 bg-gray-50 border-t border-gray-200">
                <Button onClick={confirmExcelImport} className="w-full" size="sm">
                  {t('invitees.confirm_upload')} ({excelPreview.length})
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invitees list */}
      {invitees.length > 0 ? (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            {invitees.map((inv, i) => (
              <div
                key={inv.phone}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 text-sm',
                  i > 0 && 'border-t border-gray-100'
                )}
              >
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs flex-shrink-0">
                  {inv.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{inv.name}</p>
                  <p className="text-gray-400 text-xs dir-ltr">{inv.phone}</p>
                </div>
                <button
                  onClick={() => onRemove(inv.phone)}
                  className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400 text-sm">
          <div className="text-3xl mb-2">👥</div>
          {t('invitees.no_guests')}
        </div>
      )}
    </div>
  );
};

export default InviteesManager;
