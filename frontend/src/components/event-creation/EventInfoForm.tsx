import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLanguage } from '../../contexts/LanguageContext';
import { packageService } from '../../services/packageService';
import { GuestPackage } from '../../types';
import { Input } from '../ui/Input';
import { formatPrice } from '../../lib/utils';

interface EventInfoData {
  eventTitle: string;
  locationText: string;
  eventDate: string;
}

interface EventInfoFormProps {
  defaultValues: EventInfoData;
  selectedPackage: GuestPackage | null;
  onSubmit: (data: EventInfoData, pkg: GuestPackage) => void;
  onValidityChange?: (valid: boolean) => void;
  formId?: string;
}

const EventInfoForm = ({ defaultValues, selectedPackage, onSubmit, onValidityChange, formId = 'event-info' }: EventInfoFormProps) => {
  const { t, language } = useLanguage();
  const [packages, setPackages] = useState<GuestPackage[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<GuestPackage | null>(selectedPackage);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EventInfoData>({ defaultValues });

  const watchedTitle = watch('eventTitle');
  const watchedLocation = watch('locationText');
  const watchedDate = watch('eventDate');

  useEffect(() => {
    const allFilled = !!(watchedTitle && watchedLocation && watchedDate);
    onValidityChange?.(allFilled && !!selectedPkg);
  }, [watchedTitle, watchedLocation, watchedDate, selectedPkg]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await packageService.listPackages();
        if (res.success && res.data) {
          setPackages(res.data);
          if (!selectedPkg && res.data.length > 0) {
            setSelectedPkg(res.data[0]);
          }
        }
      } catch {
        // Mock packages for MVP
        const mock: GuestPackage[] = [
          { id: '1', name_ar: 'الباقة المجانية', name_en: 'Free Package', min_guests: 0, max_guests: 3, price_sar: 0 },
          { id: '2', name_ar: 'الباقة الفضية', name_en: 'Silver Package', min_guests: 35, max_guests: 250, price_sar: 35 },
          { id: '3', name_ar: 'الباقة الذهبية', name_en: 'Gold Package', min_guests: 80, max_guests: 550, price_sar: 80 },
        ];
        setPackages(mock);
        if (!selectedPkg) setSelectedPkg(mock[0]);
      }
    };
    load();
  }, []);

  const handleFormSubmit = (data: EventInfoData) => {
    if (!selectedPkg) return;
    onSubmit(data, selectedPkg);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('events.create_event')}</h2>

      <form id={formId} onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
        <Input
          label={t('events.event_title')}
          placeholder={language === 'ar' ? 'حفل زفاف...' : 'Wedding ceremony...'}
          error={errors.eventTitle?.message}
          {...register('eventTitle', { required: t('common.required') })}
        />

        <Input
          label={t('events.event_location')}
          placeholder={language === 'ar' ? 'قاعة الأفراح - الرياض' : 'Grand Hall - Riyadh'}
          error={errors.locationText?.message}
          {...register('locationText', { required: t('common.required') })}
        />

        <Input
          label={t('events.event_date')}
          type="datetime-local"
          error={errors.eventDate?.message}
          {...register('eventDate', { required: t('common.required') })}
        />

        {/* Package selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">{t('packages.title')}</label>
          <div className="space-y-2">
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                type="button"
                onClick={() => {
                  setSelectedPkg(pkg);
                  const allFilled = !!(watchedTitle && watchedLocation && watchedDate);
                  onValidityChange?.(allFilled);
                }}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-colors text-start ${
                  selectedPkg?.id === pkg.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {language === 'ar' ? pkg.name_ar : pkg.name_en}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t('packages.guests_range', { min: pkg.min_guests, max: pkg.max_guests })}
                  </p>
                </div>
                <div className={`text-lg font-bold ${selectedPkg?.id === pkg.id ? 'text-purple-600' : 'text-gray-700'}`}>
                  {pkg.price_sar === 0 ? t('packages.free') : formatPrice(pkg.price_sar, language)}
                </div>
              </button>
            ))}
          </div>
          {!selectedPkg && (
            <p className="text-xs text-red-500">{t('common.required')}</p>
          )}
        </div>
      </form>
    </div>
  );
};

export default EventInfoForm;
