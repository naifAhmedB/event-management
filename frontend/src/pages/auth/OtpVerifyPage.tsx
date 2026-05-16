import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '../../contexts/LanguageContext';
import { authService } from '../../services/authService';
import { Button } from '../../components/ui/Button';

const OtpVerifyPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const purpose = (searchParams.get('purpose') || 'signup') as 'signup' | 'forgot_password';

  const phone = sessionStorage.getItem(purpose === 'signup' ? 'signup_phone' : 'fp_phone') || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    text.split('').forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);
    const lastIndex = Math.min(text.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleSubmit = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      toast.error('أدخل الرمز كاملاً');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.verifyOtp(phone, code, purpose);
      if (res.success && res.data?.verified) {
        if (purpose === 'signup') {
          sessionStorage.setItem('signup_code', code);
          navigate('/signup/set-password');
        } else {
          sessionStorage.setItem('fp_code', code);
          navigate('/forgot-password/reset');
        }
      } else {
        toast.error('الرمز غير صحيح أو منتهي الصلاحية');
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const method = sessionStorage.getItem(purpose === 'signup' ? 'signup_method' : 'fp_method') as 'sms' | 'whatsapp' || 'whatsapp';
    setResending(true);
    try {
      await authService.requestOtp(phone, method, purpose);
      toast.success(method === 'whatsapp' ? t('auth.otp_sent_whatsapp') : t('auth.otp_sent_sms'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-3xl">🔐</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('auth.verify_code')}</h2>
          <p className="text-sm text-gray-500 mb-6">
            {t('auth.enter_otp')} <span className="font-medium text-gray-700 dir-ltr">{phone}</span>
          </p>

          {/* OTP inputs */}
          <div className="flex gap-2 justify-center mb-6" dir="ltr">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                className="w-12 h-12 text-center text-xl font-bold rounded-lg border-2 border-gray-300 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-colors"
              />
            ))}
          </div>

          <Button onClick={handleSubmit} className="w-full mb-4" size="lg" loading={loading}>
            {t('auth.verify_code')}
          </Button>

          <button
            onClick={handleResend}
            disabled={resending}
            className="w-full text-sm text-purple-600 hover:underline disabled:opacity-50"
          >
            {resending ? t('common.loading') : t('auth.resend_code')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OtpVerifyPage;
