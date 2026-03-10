export interface Barber {
  id: string;
  full_name: string;
  description: string;
  photo_url: string | null;
  active: boolean;
  auto_accept: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  barber_id: string | null;
  name: string;
  duration_minutes: number;
  price: number | null;
  description: string;
  active: boolean;
  created_at: string;
}

export type BookingStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "auto_approved"
  | "cancelled";

export interface Booking {
  id: string;
  barber_id: string;
  service_id: string | null;
  client_name: string;
  client_email: string;
  client_phone: string;
  note: string;
  date: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  admin_note: string;
  created_at: string;
}

export interface TimeSlot {
  time: string;
  status: "free" | "booked" | "unavailable";
}

export interface AvailabilityResponse {
  date: string;
  barber_id: string;
  slots: TimeSlot[];
}

export interface Schedule {
  id: string;
  barber_id: string;
  weekday: number;
  is_working: boolean;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  break_start: string | null;
  break_end: string | null;
}

export interface BlockedDay {
  id: string;
  barber_id: string;
  date: string;
  reason: string;
}

export interface SiteContent {
  id: string;
  hero_title: string;
  hero_text: string;
  about_text: string;
  logo_url: string | null;
  contact_phone: string;
  contact_email: string;
  address: string;
  updated_at: string;
}

export interface BookingStats {
  today: number;
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}
