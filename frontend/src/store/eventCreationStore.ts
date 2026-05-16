import { create } from 'zustand';
import { EventType, EventDesign, GuestPackage, Invitee, MessageLanguage, DeliveryMethod } from '../types';

export interface CardTexts {
  name: string;
  date: string;
  location: string;
  welcome: string;
}

interface EventCreationState {
  // Current wizard step (0-5)
  step: number;

  // Step 0: Event type
  eventType: EventType | null;

  // Step 1: Design
  selectedDesign: EventDesign | null;
  customDesignFile: File | null;
  customDesignPreview: string | null;

  // Step 2: Card editor texts
  cardTexts: CardTexts;

  // Step 3: Event info
  eventTitle: string;
  locationText: string;
  eventDate: string;
  selectedPackage: GuestPackage | null;
  invitees: Invitee[];

  // Step 4: Message settings
  messageLanguage: MessageLanguage;
  includeQr: boolean;
  deliveryMethod: DeliveryMethod;

  // Step 5: Review
  promoCode: string;

  // Saved event ID from backend (after first save)
  savedEventId: string | null;

  // Actions
  setStep: (step: number) => void;
  setEventType: (type: EventType) => void;
  setSelectedDesign: (design: EventDesign | null) => void;
  setCustomDesignFile: (file: File | null, preview: string | null) => void;
  setCardTexts: (texts: Partial<CardTexts>) => void;
  setEventInfo: (info: { title?: string; location?: string; date?: string; pkg?: GuestPackage | null }) => void;
  setInvitees: (invitees: Invitee[]) => void;
  addInvitee: (invitee: Invitee) => void;
  removeInvitee: (phone: string) => void;
  setMessageSettings: (settings: { language?: MessageLanguage; qr?: boolean; delivery?: DeliveryMethod }) => void;
  setPromoCode: (code: string) => void;
  setSavedEventId: (id: string) => void;
  reset: () => void;
}

const initialCardTexts: CardTexts = {
  name: '',
  date: '',
  location: '',
  welcome: '',
};

export const useEventCreationStore = create<EventCreationState>((set) => ({
  step: 0,
  eventType: null,
  selectedDesign: null,
  customDesignFile: null,
  customDesignPreview: null,
  cardTexts: initialCardTexts,
  eventTitle: '',
  locationText: '',
  eventDate: '',
  selectedPackage: null,
  invitees: [],
  messageLanguage: 'ar',
  includeQr: true,
  deliveryMethod: 'whatsapp',
  promoCode: '',
  savedEventId: null,

  setStep: (step) => set({ step }),
  setEventType: (type) => set({ eventType: type }),
  setSelectedDesign: (design) => set({ selectedDesign: design }),
  setCustomDesignFile: (file, preview) => set({ customDesignFile: file, customDesignPreview: preview }),
  setCardTexts: (texts) => set((s) => ({ cardTexts: { ...s.cardTexts, ...texts } })),
  setEventInfo: (info) =>
    set((s) => ({
      eventTitle: info.title ?? s.eventTitle,
      locationText: info.location ?? s.locationText,
      eventDate: info.date ?? s.eventDate,
      selectedPackage: info.pkg !== undefined ? info.pkg : s.selectedPackage,
    })),
  setInvitees: (invitees) => set({ invitees }),
  addInvitee: (invitee) =>
    set((s) => ({
      invitees: [...s.invitees.filter((i) => i.phone !== invitee.phone), invitee],
    })),
  removeInvitee: (phone) =>
    set((s) => ({ invitees: s.invitees.filter((i) => i.phone !== phone) })),
  setMessageSettings: (settings) =>
    set((s) => ({
      messageLanguage: settings.language ?? s.messageLanguage,
      includeQr: settings.qr !== undefined ? settings.qr : s.includeQr,
      deliveryMethod: settings.delivery ?? s.deliveryMethod,
    })),
  setPromoCode: (code) => set({ promoCode: code }),
  setSavedEventId: (id) => set({ savedEventId: id }),
  reset: () =>
    set({
      step: 0,
      eventType: null,
      selectedDesign: null,
      customDesignFile: null,
      customDesignPreview: null,
      cardTexts: initialCardTexts,
      eventTitle: '',
      locationText: '',
      eventDate: '',
      selectedPackage: null,
      invitees: [],
      messageLanguage: 'ar',
      includeQr: true,
      deliveryMethod: 'whatsapp',
      promoCode: '',
      savedEventId: null,
    }),
}));
