// src/types/index.ts - Tipos globais TypeScript estritos

export type UserRole = 'passenger' | 'driver' | 'admin';
export type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected';
export type ExperienceLevel = 'Principiante' | 'Intermediário' | 'Experiente' | 'Embaixador';

export type RideStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';
export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled';
export type AlertStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';
export type AlertType = 'hostile' | 'unsafe' | 'fraud' | 'other';

export interface TravelPreference {
  pets?: boolean;
  music?: boolean;
  smoking?: boolean;
  chatchiness?: 'quiet' | 'medium' | 'chatty';
}

// Enums como const for type safety
export const RideStatusEnum: Record<RideStatus, RideStatus> = {
  scheduled: 'scheduled',
  active: 'active',
  completed: 'completed',
  cancelled: 'cancelled',
};

export const BookingStatusEnum: Record<BookingStatus, BookingStatus> = {
  pending: 'pending',
  confirmed: 'confirmed',
  rejected: 'rejected',
  cancelled: 'cancelled',
};

export const AlertStatusEnum: Record<AlertStatus, AlertStatus> = {
  pending: 'pending',
  reviewed: 'reviewed',
  resolved: 'resolved',
  dismissed: 'dismissed',
};

export const AlertTypeEnum: Record<AlertType, AlertType> = {
  hostile: 'hostile',
  unsafe: 'unsafe',
  fraud: 'fraud',
  other: 'other',
};