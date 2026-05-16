import { get, post, patch, del, apiCall } from './api';
import { Event, Invitee, ScanResult, PromoValidation } from '../types';

export const eventService = {
  listEvents: () => get<Event[]>('/events/'),

  getEvent: (id: string) => get<Event>(`/events/${id}/`),

  createEvent: (data: Partial<Event>) =>
    post<Event>('/events/', data),

  updateEvent: (id: string, data: Partial<Event>) =>
    patch<Event>(`/events/${id}/`, data),

  deleteEvent: (id: string) => del(`/events/${id}/`),

  getInvitees: (eventId: string) =>
    get<Invitee[]>(`/events/${eventId}/invitees/`),

  addInvitees: (eventId: string, invitees: { name: string; phone: string }[]) =>
    post<Invitee[]>(`/events/${eventId}/invitees/`, invitees),

  removeInvitee: (eventId: string, inviteeId: string) =>
    del(`/events/${eventId}/invitees/${inviteeId}/`),

  downloadTemplate: () =>
    apiCall<Blob>('/events/invitee-template/', {
      method: 'GET',
      headers: { Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    }),

  checkout: (eventId: string, promoCode?: string) =>
    post<{ success: boolean; payment_url?: string; mock?: boolean }>(
      `/events/${eventId}/checkout/`,
      { promo_code: promoCode || null }
    ),

  scanQr: (eventId: string, token: string) =>
    post<ScanResult>(`/events/${eventId}/scan/`, { token }),

  validatePromo: (code: string, eventId: string) =>
    post<PromoValidation>('/packages/promo/validate/', { code, event_id: eventId }),

  toggleActive: (eventId: string, isActive: boolean) =>
    patch<Event>(`/events/${eventId}/`, { is_active: isActive }),

  remind: (eventId: string, message?: string) =>
    post<{ sent: number; available_invitations: number | null }>(
      `/events/${eventId}/remind/`, { message: message ?? '' }
    ),

  addGuard: (eventId: string, phone: string) =>
    post<{ success: boolean; phone: string }>(`/events/${eventId}/guards/`, { phone }),

  removeGuard: (eventId: string, guardId: string) =>
    del(`/events/${eventId}/guards/${guardId}/`),
};
