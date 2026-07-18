export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          booking_code: string | null
          commission: number | null
          created_at: string | null
          currency: string | null
          driver_compensation: number | null
          expire_date: string | null
          file_number: string | null
          id: string
          message_contact_allowed: boolean | null
          passenger_id: string
          passenger_refund: number | null
          phone_contact_allowed: boolean | null
          ride_id: string
          seats_booked: number
          status: Database["public"]["Enums"]["booking_status"] | null
          total_price: number
          trip_is_passed: boolean | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          booking_code?: string | null
          commission?: number | null
          created_at?: string | null
          currency?: string | null
          driver_compensation?: number | null
          expire_date?: string | null
          file_number?: string | null
          id?: string
          message_contact_allowed?: boolean | null
          passenger_id: string
          passenger_refund?: number | null
          phone_contact_allowed?: boolean | null
          ride_id: string
          seats_booked?: number
          status?: Database["public"]["Enums"]["booking_status"] | null
          total_price: number
          trip_is_passed?: boolean | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          booking_code?: string | null
          commission?: number | null
          created_at?: string | null
          currency?: string | null
          driver_compensation?: number | null
          expire_date?: string | null
          file_number?: string | null
          id?: string
          message_contact_allowed?: boolean | null
          passenger_id?: string
          passenger_refund?: number | null
          phone_contact_allowed?: boolean | null
          ride_id?: string
          seats_booked?: number
          status?: Database["public"]["Enums"]["booking_status"] | null
          total_price?: number
          trip_is_passed?: boolean | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          booking_id: string | null
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          read_at: string | null
          receiver_id: string
          ride_id: string | null
          sender_id: string
        }
        Insert: {
          booking_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          receiver_id: string
          ride_id?: string | null
          sender_id: string
        }
        Update: {
          booking_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          receiver_id?: string
          ride_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birthdate: string | null
          created_at: string | null
          display_name: string | null
          driving_rating: number | null
          driving_reviews_count: number | null
          email: string
          email_verified: boolean | null
          experience_level: Database["public"]["Enums"]["experience_level"] | null
          first_name: string | null
          full_name: string | null
          gender: string | null
          id: string
          interests: string[] | null
          last_name: string | null
          license_number: string | null
          phone: string | null
          phone_verified: boolean | null
          rating: number | null
          response_rate: number | null
          reviews_count: number | null
          rides_offered: number | null
          rides_taken: number | null
          role: Database["public"]["Enums"]["user_role"] | null
          travel_preferences: Json | null
          updated_at: string | null
          verification_status: Database["public"]["Enums"]["verification_status"] | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birthdate?: string | null
          created_at?: string | null
          display_name?: string | null
          driving_rating?: number | null
          driving_reviews_count?: number | null
          email: string
          email_verified?: boolean | null
          experience_level?: Database["public"]["Enums"]["experience_level"] | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          interests?: string[] | null
          last_name?: string | null
          license_number?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          rating?: number | null
          response_rate?: number | null
          reviews_count?: number | null
          rides_offered?: number | null
          rides_taken?: number | null
          role?: Database["public"]["Enums"]["user_role"] | null
          travel_preferences?: Json | null
          updated_at?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"] | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birthdate?: string | null
          created_at?: string | null
          display_name?: string | null
          driving_rating?: number | null
          driving_reviews_count?: number | null
          email?: string
          email_verified?: boolean | null
          experience_level?: Database["public"]["Enums"]["experience_level"] | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          interests?: string[] | null
          last_name?: string | null
          license_number?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          rating?: number | null
          response_rate?: number | null
          reviews_count?: number | null
          rides_offered?: number | null
          rides_taken?: number | null
          role?: Database["public"]["Enums"]["user_role"] | null
          travel_preferences?: Json | null
          updated_at?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"] | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string | null
          id: string
          is_published: boolean | null
          moderation_status: string | null
          published_at: string | null
          rating: number | null
          reviewee_id: string
          reviewer_id: string
          role: string | null
          trip_id: string | null
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          moderation_status?: string | null
          published_at?: string | null
          rating?: number | null
          reviewee_id: string
          reviewer_id: string
          role?: string | null
          trip_id?: string | null
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          moderation_status?: string | null
          published_at?: string | null
          rating?: number | null
          reviewee_id?: string
          reviewer_id?: string
          role?: string | null
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      rides: {
        Row: {
          available_seats: number
          baggage_policy: string | null
          booking_mode: string | null
          created_at: string | null
          cross_border_alert: boolean | null
          departure_time: string
          description: string | null
          destination: string
          detour_allowed: string | null
          distance_km: number | null
          driver_id: string
          estimated_arrival: string | null
          frequency: string | null
          id: string
          instant_booking: boolean | null
          is_comfort: boolean | null
          luggage_size: string | null
          origin: string
          permanent_id: string | null
          price_per_seat: number
          price_with_commission: number | null
          schedule_flexibility: string | null
          status: Database["public"]["Enums"]["ride_status"] | null
          updated_at: string | null
          vehicle_id: string | null
          view_count: number | null
        }
        Insert: {
          available_seats: number
          baggage_policy?: string | null
          booking_mode?: string | null
          created_at?: string | null
          cross_border_alert?: boolean | null
          departure_time: string
          description?: string | null
          destination: string
          detour_allowed?: string | null
          distance_km?: number | null
          driver_id: string
          estimated_arrival?: string | null
          frequency?: string | null
          id?: string
          instant_booking?: boolean | null
          is_comfort?: boolean | null
          luggage_size?: string | null
          origin: string
          permanent_id?: string | null
          price_per_seat: number
          price_with_commission?: number | null
          schedule_flexibility?: string | null
          status?: Database["public"]["Enums"]["ride_status"] | null
          updated_at?: string | null
          vehicle_id?: string | null
          view_count?: number | null
        }
        Update: {
          available_seats?: number
          baggage_policy?: string | null
          booking_mode?: string | null
          created_at?: string | null
          cross_border_alert?: boolean | null
          departure_time?: string
          description?: string | null
          destination?: string
          detour_allowed?: string | null
          distance_km?: number | null
          driver_id?: string
          estimated_arrival?: string | null
          frequency?: string | null
          id?: string
          instant_booking?: boolean | null
          is_comfort?: boolean | null
          luggage_size?: string | null
          origin?: string
          permanent_id?: string | null
          price_per_seat?: number
          price_with_commission?: number | null
          schedule_flexibility?: string | null
          status?: Database["public"]["Enums"]["ride_status"] | null
          updated_at?: string | null
          vehicle_id?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rides_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rides_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          category: string | null
          color: string | null
          comfort_level: string | null
          comfort_stars: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          make: string
          model: string
          owner_id: string
          photo_url: string | null
          pictures: Json | null
          plate: string
          seats_capacity: number
          updated_at: string | null
          year: number | null
        }
        Insert: {
          category?: string | null
          color?: string | null
          comfort_level?: string | null
          comfort_stars?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          make: string
          model: string
          owner_id: string
          photo_url?: string | null
          pictures?: Json | null
          plate: string
          seats_capacity?: number
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          category?: string | null
          color?: string | null
          comfort_level?: string | null
          comfort_stars?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          make?: string
          model?: string
          owner_id?: string
          photo_url?: string | null
          pictures?: Json | null
          plate?: string
          seats_capacity?: number
          updated_at?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      waypoints: {
        Row: {
          address: string | null
          arrival_datetime: string | null
          city: string
          country_code: string | null
          created_at: string | null
          departure_datetime: string | null
          id: string
          order_index: number
          price_to_next: number | null
          ride_id: string
          type: string[]
        }
        Insert: {
          address?: string | null
          arrival_datetime?: string | null
          city: string
          country_code?: string | null
          created_at?: string | null
          departure_datetime?: string | null
          id?: string
          order_index: number
          price_to_next?: number | null
          ride_id: string
          type?: string[]
        }
        Update: {
          address?: string | null
          arrival_datetime?: string | null
          city?: string
          country_code?: string | null
          created_at?: string | null
          departure_datetime?: string | null
          id?: string
          order_index?: number
          price_to_next?: number | null
          ride_id?: string
          type?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "waypoints_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      booking_status: "pending" | "confirmed" | "rejected" | "cancelled"
      experience_level: "novice" | "intermediate" | "expert" | "ambassador"
      ride_status: "scheduled" | "active" | "completed" | "cancelled"
      user_role: "passenger" | "driver" | "admin"
      verification_status: "pending" | "verified" | "rejected" | "none"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export const Constants = {
  public: {
    Enums: {
      booking_status: ["pending", "confirmed", "rejected", "cancelled"],
      experience_level: ["novice", "intermediate", "expert", "ambassador"],
      ride_status: ["scheduled", "active", "completed", "cancelled"],
      user_role: ["passenger", "driver", "admin"],
      verification_status: ["pending", "verified", "rejected", "none"],
    },
  },
} as const
