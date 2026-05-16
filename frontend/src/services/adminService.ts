import { get, post, patch, del } from './api';
import { AdminPackage, AdminUser, AdminEvent, AdminStats, PromoCode, Invitee } from '../types';

export const adminService = {
  // Stats
  getStats: () => get<AdminStats>('/admin/stats/'),

  // Packages
  listPackages: () => get<AdminPackage[]>('/admin/packages/'),
  createPackage: (data: Partial<AdminPackage>) => post<AdminPackage>('/admin/packages/', data),
  updatePackage: (id: string, data: Partial<AdminPackage>) =>
    patch<AdminPackage>(`/admin/packages/${id}/`, data),
  deletePackage: (id: string) => del(`/admin/packages/${id}/`),

  // Promo codes
  listPromos: () => get<PromoCode[]>('/admin/promos/'),
  createPromo: (data: Partial<PromoCode>) => post<PromoCode>('/admin/promos/', data),
  updatePromo: (id: string, data: Partial<PromoCode>) =>
    patch<PromoCode>(`/admin/promos/${id}/`, data),
  deletePromo: (id: string) => del(`/admin/promos/${id}/`),

  // Users
  listUsers: (search?: string) =>
    get<AdminUser[]>(`/admin/users/${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  createUser: (data: { phone: string; full_name: string; password: string }) =>
    post<AdminUser>('/admin/users/create/', data),
  updateUser: (id: string, data: { is_active?: boolean; is_admin?: boolean }) =>
    patch<AdminUser>(`/admin/users/${id}/`, data),

  // Events
  listEvents: (params?: { status?: string; search?: string; owners?: string[] }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.search) q.set('search', params.search);
    params?.owners?.forEach(id => q.append('owner', id));
    const qs = q.toString();
    return get<AdminEvent[]>(`/admin/events/${qs ? `?${qs}` : ''}`);
  },

  // Assign event owner
  assignEventOwner: (eventId: string, ownerId: string) =>
    patch<AdminEvent>(`/admin/events/${eventId}/assign/`, { owner_id: ownerId }),

  // Event invitees (admin)
  listEventInvitees: (eventId: string) =>
    get<Invitee[]>(`/admin/events/${eventId}/invitees/`),
  createEventInvitee: (eventId: string, data: { name: string; phone: string }) =>
    post<Invitee>(`/admin/events/${eventId}/invitees/`, data),
  updateEventInvitee: (
    eventId: string,
    invId: string,
    data: { name?: string; phone?: string; response_status?: string; arrived?: boolean }
  ) => patch<Invitee>(`/admin/events/${eventId}/invitees/${invId}/`, data),
  deleteEventInvitee: (eventId: string, invId: string) =>
    del(`/admin/events/${eventId}/invitees/${invId}/`),
};
