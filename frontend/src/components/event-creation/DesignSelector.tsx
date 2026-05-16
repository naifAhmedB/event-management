import React, { useEffect, useState, useRef } from 'react';
import { Check, Upload, Image } from 'lucide-react';
import { EventDesign, EventType } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { designService } from '../../services/packageService';
import { cn } from '../../lib/utils';

interface DesignSelectorProps {
  eventType: EventType;
  selectedDesign: EventDesign | null;
  customPreview: string | null;
  onSelectDesign: (design: EventDesign) => void;
  onUploadCustom: (file: File, preview: string) => void;
}

const DesignSelector = ({
  eventType,
  selectedDesign,
  customPreview,
  onSelectDesign,
  onUploadCustom,
}: DesignSelectorProps) => {
  const { t, language } = useLanguage();
  const [designs, setDesigns] = useState<EventDesign[]>([]);
  const [activeTab, setActiveTab] = useState<'premade' | 'custom'>('premade');
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadDesigns = async () => {
      setLoading(true);
      try {
        const res = await designService.listDesigns(eventType);
        if (res.success && res.data) {
          setDesigns(res.data);
        }
      } catch {
        // Use mock designs for MVP
        setDesigns(getMockDesigns(eventType));
      } finally {
        setLoading(false);
      }
    };
    loadDesigns();
  }, [eventType]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onUploadCustom(file, url);
    setActiveTab('custom');
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('design.title')}</h2>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {(['premade', 'custom'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'pb-3 px-4 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            {tab === 'premade' ? t('design.premade') : t('design.my_design')}
          </button>
        ))}
      </div>

      {activeTab === 'premade' && (
        <>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-[3/4] bg-gray-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {designs.map((design) => (
                <button
                  key={design.id}
                  onClick={() => onSelectDesign(design)}
                  className={cn(
                    'relative rounded-xl overflow-hidden border-2 transition-all',
                    selectedDesign?.id === design.id && !customPreview
                      ? 'border-purple-500 shadow-lg scale-105'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="aspect-[3/4] bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                    {design.design_image ? (
                      <img src={design.design_image} alt={language === 'ar' ? design.name_ar : design.name_en} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-4">
                        <div className="text-4xl mb-2">🎴</div>
                        <p className="text-xs text-gray-500">{language === 'ar' ? design.name_ar : design.name_en}</p>
                      </div>
                    )}
                  </div>
                  {selectedDesign?.id === design.id && !customPreview && (
                    <div className="absolute top-2 end-2 w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center shadow">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                  <div className="p-2 text-xs text-center font-medium text-gray-600">
                    {language === 'ar' ? design.name_ar : design.name_en}
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'custom' && (
        <div className="space-y-4">
          {customPreview ? (
            <div className="relative max-w-xs mx-auto">
              <img src={customPreview} alt="Custom design" className="w-full rounded-xl border-2 border-purple-500 shadow-lg" />
              <button
                onClick={() => fileRef.current?.click()}
                className="mt-3 w-full py-2 text-sm text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors"
              >
                {t('design.upload_design')}
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full aspect-[3/2] border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-purple-400 hover:bg-purple-50/50 transition-colors"
            >
              <Upload size={32} className="text-gray-400" />
              <div className="text-center">
                <p className="font-medium text-gray-700">{t('design.upload_design')}</p>
                <p className="text-sm text-gray-400">{t('design.upload_desc')}</p>
              </div>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}
    </div>
  );
};

// Mock designs for MVP when backend isn't available
function getMockDesigns(eventType: EventType): EventDesign[] {
  const colors = {
    women_wedding: 'from-pink-200 to-rose-300',
    graduation: 'from-blue-200 to-indigo-300',
    men_wedding: 'from-indigo-200 to-purple-300',
    newborn: 'from-yellow-200 to-orange-200',
    opening: 'from-green-200 to-teal-300',
    birthday: 'from-orange-200 to-pink-300',
  };

  return Array.from({ length: 4 }, (_, i) => ({
    id: `mock-${i}`,
    name_ar: `تصميم ${i + 1}`,
    name_en: `Design ${i + 1}`,
    event_type: eventType,
    design_image: '',
    thumbnail: '',
    is_premade: true,
    text_positions: {
      name: { x: 50, y: 30, align: 'center' as const, fontSize: 24, color: '#1a1a1a' },
      date: { x: 50, y: 55, align: 'center' as const, fontSize: 16, color: '#444' },
      location: { x: 50, y: 65, align: 'center' as const, fontSize: 14, color: '#666' },
      welcome: { x: 50, y: 20, align: 'center' as const, fontSize: 14, color: '#555' },
    },
  }));
}

export default DesignSelector;
