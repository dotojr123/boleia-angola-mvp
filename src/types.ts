export type ExperienceLevel = 'novice' | 'intermediate' | 'expert' | 'ambassador';

export type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected';

// Novos tipos v2.0
export type RideFrequency = 'UNIQUE' | 'DAILY' | 'WEEKLY' | 'WEEKDAYS';
export type BookingMode = 'manual' | 'auto';
export type LuggageSize = 'SMALL' | 'MEDIUM' | 'LARGE';
export type VehicleCategory = 'SEDAN' | 'TOURISM' | 'CONVERTIBLE' | 'WAGON' | 'SUV' | 'VAN' | 'SMALL_UTILITY' | 'BIG_UTILITY';
export type ComfortLevel = 'BASIC' | 'NORMAL' | 'COMFORT' | 'LUXURY';

export interface User {
  id: string;
  name?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  email?: string;
  rating: number;
  reviews_count: number;
  avatar_url: string;
  is_verified?: boolean;
  verification_status?: VerificationStatus;
  type?: 'DRIVER' | 'PASSENGER' | 'ADMIN';
  experience_level?: ExperienceLevel;
  interests?: string[];
  bio?: string;
  phone?: string;
  phone_verified?: boolean;
  email_verified?: boolean;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  birthdate?: string;
  rides_offered?: number;
  rides_taken?: number;
  response_rate?: number;
  travel_preferences?: RidePreferences;
  documents?: {
    id_card_url?: string;
    driving_license_url?: string;
  };
}

export interface RidePreferences {
  smoking: boolean;
  pets: boolean;
  music: boolean;
  chattiness: 'quiet' | 'medium' | 'talkative';
}

export type BaggagePolicy = 'small' | 'medium' | 'large';

export interface Vehicle {
  id: string;
  owner_id: string;
  make: string;
  model: string;
  year?: number;
  color?: string;
  plate: string;
  seats_capacity: number;
  photo_url?: string;
  category?: VehicleCategory;
  comfort_level?: ComfortLevel;
  comfort_stars?: number;
  pictures?: string[];
  is_verified?: boolean;
  comfort_features?: string[]; // ['ac', 'wifi', 'leather', 'large_trunk']
  specs?: {
    fuel_consumption?: string; // '8L/100km'
    engine_type?: string;     // 'Gasolina', 'Diesel'
  };
}

export interface Ride {
  id: string;
  driver: User;
  origin: string;
  destination: string;
  date: string;
  time: string;
  price: number;
  currency: string;
  availableSeats: number;
  duration: string;
  stops: string[];
  vehicle_id?: string;
  vehicle?: Vehicle;
  baggage_policy?: BaggagePolicy;
  preferences?: RidePreferences;
  // Novos campos v2.0
  permanent_id?: string;
  frequency?: RideFrequency;
  luggage_size?: LuggageSize;
  booking_mode?: BookingMode;
  distance_km?: number;
  view_count?: number;
  is_comfort?: boolean;
  instant_booking?: boolean;
}

export interface Waypoint {
  id: string;
  ride_id: string;
  order_index: number;
  type: string[];
  city: string;
  address?: string;
  country_code?: string;
  arrival_datetime?: string;
  departure_datetime?: string;
  price_to_next?: number;
}

export interface Booking {
  id: string;
  ride_id: string;
  passenger_id: string;
  seats_booked: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
  booking_code?: string;
  currency?: string;
  created_at?: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}


export interface ChatSession {
  id: string;
  partner: User;
  lastMessage: Message;
  unreadCount: number;
}

export type ViewState = 'HOME' | 'SEARCH' | 'PUBLISH' | 'PROFILE' | 'RIDE_DETAILS' | 'PROPOSAL' | 'AUTH' | 'CHAT';

export interface SearchFilters {
  origin: string;
  destination: string;
  date: string;
}
