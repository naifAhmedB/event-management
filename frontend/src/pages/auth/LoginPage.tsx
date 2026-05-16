import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface LoginForm {
  phone: string;
  password: string;
}

const LoginPage = () => {
  const { t } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/events';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const res = await authService.login(data.phone, data.password);
      if (res.success && res.data) {
        login(res.data.access, res.data.refresh, res.data.user);
        navigate(from, { replace: true });
      } else {
        toast.error(res.message || t('auth.login_errors.invalid'));
      }
    } catch {
      toast.error(t('auth.login_errors.invalid'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">

      {/* ── Background ────────────────────────────────── */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-700 via-purple-600 to-indigo-700" />

      {/* Layered blobs */}
      <div className="absolute top-0 start-0 w-[500px] h-[500px] rounded-full bg-white/10 -translate-x-1/3 -translate-y-1/3 blur-3xl" />
      <div className="absolute bottom-0 end-0 w-[400px] h-[400px] rounded-full bg-indigo-500/20 translate-x-1/3 translate-y-1/3 blur-3xl" />
      <div className="absolute top-1/2 start-1/2 w-64 h-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-400/10 blur-3xl" />

      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[.15]"
        style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* ── Card ──────────────────────────────────────── */}
      <div className="relative w-full max-w-md animate-scale-in">

        {/* Logo */}
        <div className="text-center mb-7">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center mx-auto mb-4 shadow-[0_8px_32px_rgba(0,0,0,.20),0_0_0_1px_rgba(255,255,255,.25)_inset]">
            <span className="text-3xl">📨</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{t('app.name')}</h1>
          <p className="text-white/55 text-sm mt-1.5 font-medium">Event Invitation Manager</p>
        </div>

        {/* Form card — glass */}
        <div className="bg-white/85 backdrop-blur-xl rounded-2xl shadow-[0_32px_80px_-12px_rgba(0,0,0,.30),0_0_0_1px_rgba(255,255,255,.70)_inset] border border-white/70 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1 tracking-tight">{t('auth.login')}</h2>
          <p className="text-sm text-gray-400 mb-6 font-medium">Welcome back — sign in to continue</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

            <Input
              label={t('auth.password')}
              placeholder={t('auth.password_placeholder')}
              type="password"
              error={errors.password?.message}
              {...register('password', {
                required: t('common.required'),
                minLength: { value: 6, message: t('common.min_length', { min: 6 }) },
              })}
            />

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-purple-600 hover:text-purple-700 font-semibold hover:underline transition-colors">
                {t('auth.forgot_password')}
              </Link>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              {t('auth.login')}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100/80 text-center text-sm text-gray-500">
            {t('auth.no_account')}{' '}
            <Link to="/signup" className="text-purple-600 font-bold hover:underline transition-colors">
              {t('auth.sign_up_link')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
