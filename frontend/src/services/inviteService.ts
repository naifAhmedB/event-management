import { apiCall } from './api';
import { InvitePublicInfo, ResponseStatus } from '../types';

// Public endpoints — no auth token needed
export const inviteService = {
  getInvite: (token: string) =>
    apiCall<InvitePublicInfo>(`/invite/${token}/`, { method: 'GET' }),

  respond: (token: string, response: ResponseStatus) =>
    apiCall<{ success: boolean; qr_code_url?: string; location?: string }>(
      `/invite/${token}/respond/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      }
    ),
};
