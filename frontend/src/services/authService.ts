import { post } from './api';
import { OtpMethod } from '../types';

export const authService = {
  login: (phone: string, password: string) =>
    post<{ access: string; refresh: string; user: { id: string; phone: string; full_name: string; is_admin: boolean } }>(
      '/auth/login/',
      { phone, password }
    ),

  requestOtp: (phone: string, method: OtpMethod, purpose: 'signup' | 'forgot_password') =>
    post<{ detail: string }>('/auth/signup/request-otp/', { phone, method, purpose }),

  verifyOtp: (phone: string, code: string, purpose: 'signup' | 'forgot_password') =>
    post<{ verified: boolean; mock_code?: string }>('/auth/signup/verify-otp/', { phone, code, purpose }),

  setPassword: (phone: string, code: string, password: string, full_name: string) =>
    post<{ access: string; refresh: string; user: { id: string; phone: string; full_name: string; is_admin: boolean } }>(
      '/auth/signup/set-password/',
      { phone, code, password, full_name }
    ),

  resetPassword: (phone: string, code: string, new_password: string) =>
    post<{ detail: string }>('/auth/reset-password/', { phone, code, new_password }),

  refreshToken: (refresh: string) =>
    post<{ access: string }>('/auth/token/refresh/', { refresh }),
};
