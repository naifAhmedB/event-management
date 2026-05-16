import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface SetPasswordForm {
  password: string;
  confirm_password: string;
}

const SetPasswordPage = () => {
  const { t } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isReset = searchParams.get('mode') === 'reset';
  const [loading, setLoading] = useState(false);

  const phone = sessionStorage.getItem(isReset ? 'fp_phone' : 'signup_phone') || '';
  const code = sessionStorage.getItem(isReset ? 'fp_code' : 'signup_code') || '';
  const name = sessionStorage.getItem('signup_name') || '';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SetPasswordForm>();

  const password = watch('password');

  const onSubmit = async (data: SetPasswordForm) => {
    setLoading(true);
    try {
      if (isReset) {
        const res = await authService.resetPassword(phone, code, data.password);
        if (res.success) {
          toast.success('تم تغيير كلمة المرور بنجاح');
          sessionStorage.clear();
          navigate('/login');
        } else {
          toast.error(res.message || t('common.error'));
        }
      } else {
        const res = await authService.setPassword(phone, code, data.password, name);
        if (res.success && res.data) {
          login(res.data.access, res.data.refresh, res.data.user);
          sessionStorage.clear();
          navigate('/events');
        } else {
          toast.error(res.message || t('common.error'));
        }
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-3xl">🔑</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {isReset ? t('auth.reset_password') : t('auth.set_password')}
          </h2>
          <p className="text-sm text-gray-500 mb-6">{t('auth.set_password_desc')}</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label={t('auth.password')}
              type="password"
              placeholder={t('auth.password_placeholder')}
              error={errors.password?.message}
              {...register('password', {
                required: t('common.required'),
                minLength: { value: 8, message: t('common.min_length', { min: 8 }) },
              })}
            />

            <Input
              label={t('auth.confirm_password')}
              type="password"
              placeholder={t('auth.password_placeholder')}
              error={errors.confirm_password?.message}
              {...register('confirm_password', {
                required: t('common.required'),
                validate: (v) => v === password || t('common.password_mismatch'),
              })}
            />

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              {isReset ? t('auth.reset_password') : t('auth.set_password')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SetPasswordPage;
