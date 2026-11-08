export interface Property {
  id: string;
  landlord_id: string;
  title: string;
  description: string;
  city: string;
  province: string;
  university: string;
  address: string;
  monthly_rent: number;
  room_type: string;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  available_from: string;
  status: "active" | "unavailable";
  is_demo: boolean;
  created_at: string;
  property_images: { id: string; image_url: string; storage_path?: string }[];
}
export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: "student" | "landlord";
  preferred_timezone: string;
}
export interface Slot {
  id: string;
  start_time: string;
  end_time: string;
  viewing_type: "virtual" | "in-person";
  meeting_url?: string;
  removed?: boolean;
}
export interface Appointment extends Slot {
  status: "confirmed" | "cancelled" | "completed";
  property_id: string;
  title: string;
  address: string;
  student_name: string;
  student_email: string;
}
