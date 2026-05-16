import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useLanguage } from '../../contexts/LanguageContext';
import { authService } from '../../services/authService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { OtpMethod } from '../../types';

interface SignupForm {
  phone: string;
  full_name: string;
  method: OtpMethod;
}

const SignupPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<OtpMethod>('whatsapp');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>();

  const onSubmit = async (data: SignupForm) => {
    setLoading(true);
    try {
      const res = await authService.requestOtp(data.phone, selectedMethod, 'signup');
      if (res.success) {
        // Store phone + name in sessionStorage for the OTP step
        sessionStorage.setItem('signup_phone', data.phone);
        sessionStorage.setItem('signup_name', data.full_name);
        sessionStorage.setItem('signup_method', selectedMethod);
        toast.success(
          selectedMethod === 'whatsapp' ? t('auth.otp_sent_whatsapp') : t('auth.otp_sent_sms')
        );
        navigate('/signup/verify');
      } else {
        toast.error(res.message || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const methods = [
    { value: 'whatsapp' as OtpMethod, label: t('auth.otp_whatsapp'), icon: '💬' },
    { value: 'sms' as OtpMethod, label: t('auth.otp_sms'), icon: '📱' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-3xl">📨</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('app.name')}</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('auth.signup')}</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label={t('auth.full_name')}
              placeholder={t('auth.full_name_placeholder')}
              error={errors.full_name?.message}
              {...register('full_name', { required: t('common.required') })}
            />

            <Input
              label={t('auth.phone')}
              placeholder={t('auth.phone_placeholder')}
              type="tel"
              dir="ltr"
              error={errors.phone?.message}
              {...register('phone', {
                required: t('common.required'),
                pattern: {
                  value: /^(05|5|\+9665)\d{8}$/,
                  message: t('common.invalid_phone'),
                },
              })}
            />

            {/* OTP Method */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{t('auth.otp_method')}</label>
              <div className="grid grid-cols-2 gap-3">
                {methods.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setSelectedMethod(m.value)}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                      selectedMethod === m.value
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span>{m.icon}</span>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              {t('auth.send_code')}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {t('auth.have_account')}{' '}
            <Link to="/login" className="text-purple-600 font-medium hover:underline">
              {t('auth.login_link')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
