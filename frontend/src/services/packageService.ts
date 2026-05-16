import { get } from './api';
import { GuestPackage, EventDesign, EventType } from '../types';

export const packageService = {
  listPackages: () => get<GuestPackage[]>('/packages/'),
};

export const designService = {
  listDesigns: (eventType?: EventType) =>
    get<EventDesign[]>(`/designs/${eventType ? `?event_type=${eventType}` : ''}`),
};
