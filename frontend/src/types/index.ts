export type EventType =
  | 'women_wedding'
  | 'graduation'
  | 'men_wedding'
  | 'newborn'
  | 'opening'
  | 'birthday';

export type EventStatus = 'draft' | 'payment_pending' | 'active' | 'completed';
export type ResponseStatus = 'waiting' | 'accepted' | 'declined';
export type MessageLanguage = 'ar' | 'en';
export type DeliveryMethod = 'whatsapp' | 'sms' | 'email';
export type OtpMethod = 'sms' | 'whatsapp';

export interface TextPosition {
  x: number; // percentage
  y: number; // percentage
  width?: number;
  height?: number;
  fontSize?: number;
  align?: 'left' | 'center' | 'right';
  color?: string;
}

export interface EventDesign {
  id: string;
  name_ar: string;
  name_en: string;
  event_type: EventType;
  design_image: string;
  thumbnail: string;
  is_premade: boolean;
  text_positions: {
    name: TextPosition;
    date: TextPosition;
    location: TextPosition;
    welcome: TextPosition;
  };
}

export interface GuestPackage {
  id: string;
  name_ar: string;
  name_en: string;
  min_guests: number;
  max_guests: number;
  price_sar: number;
}

export interface Guard {
  id: string;
  phone: string;
  full_name: string;
}

export interface Invitee {
  id?: string;
  name: string;
  phone: string;
  response_status?: ResponseStatus;
  arrived?: boolean;
  invite_token?: string;
  qr_code_image?: string;
  message_sent?: boolean;
  sent_at?: string;
  responded_at?: string;
  arrived_at?: string;
}

export interface EventCounters {
  waiting_count: number;
  accepted_count: number;
  declined_count: number;
  arrived_count: number;
}

export interface Event extends EventCounters {
  id: string;
  owner?: string;
  title: string;
  event_type: EventType;
  location_text: string;
  event_date: string;
  design?: EventDesign;
  custom_design_img?: string;
  card_text_name: string;
  card_text_date: string;
  card_text_location: string;
  card_text_welcome: string;
  package?: string;          // FK UUID (writable)
  package_detail?: GuestPackage; // nested read-only detail
  message_language: MessageLanguage;
  include_qr: boolean;
  delivery_method: DeliveryMethod;
  status: EventStatus;
  is_active: boolean;
  reminder_count: number;
  available_invitations?: number;
  total_price_sar: number;
  created_at: string;
  invitees?: Invitee[];
  guards_list?: Guard[];
}

export interface InvitePublicInfo {
  event_title: string;
  event_type: EventType;
  event_date: string;
  location_text: string;
  card_image: string;
  welcome_message: string;
  include_qr: boolean;
  response_status: ResponseStatus;
  qr_code_image?: string;
  invitee_name: string;
}

export interface ScanResult {
  valid: boolean;
  guest_name?: string;
  already_arrived?: boolean;
  message?: string;
}

export interface PromoValidation {
  valid: boolean;
  discount_type?: 'percent' | 'fixed';
  discount_value?: number;
  final_price?: number;
}

// ── Admin types ───────────────────────────────────────────────────────────────

export interface AdminPackage extends GuestPackage {
  is_active: boolean;
}

export interface PromoCode {
  id: string;
  code: string;
  discount_percent: number;
  max_uses: number;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface AdminUser {
  id: string;
  phone: string;
  full_name: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  event_count: number;
}

export interface AdminEvent {
  id: string;
  title: string;
  event_type: EventType;
  status: EventStatus;
  is_active: boolean;
  event_date: string;
  location_text: string;
  owner_id: string;
  owner_phone: string;
  owner_name: string;
  guest_count: number;
  created_at: string;
}

export interface AdminStats {
  total_users: number;
  total_events: number;
  active_events: number;
  total_packages: number;
}
