// src/entities/index.ts - Exportações centralizadas

export { ProfileSchema, Profile, ProfileCreateInput, ProfileUpdateInput, ProfileValidator, createProfileDefaults } from './Profile';
export { VehicleSchema, Vehicle, VehicleCreateInput, VehicleUpdateInput, VehicleValidator, createVehicleDefaults } from './Vehicle';
export { RideSchema, Ride, RideCreateInput, RideUpdateInput, RideValidator, RideStateMachine, createRideDefaults } from './Ride';
export { BookingSchema, Booking, BookingCreateInput, BookingUpdateInput, BookingValidator, BookingStateMachine, createBookingDefaults } from './Booking';
export { ReviewSchema, Review, ReviewCreateInput, ReviewValidator, createReviewDefaults } from './Review';
export { AlertSchema, Alert, AlertCreateInput, AlertUpdateInput, AlertValidator, createAlertDefaults } from './Alert';
export { MessageSchema, Message, MessageCreateInput, MessageValidator, createMessageDefaults } from './Message';
export { NotificationSchema, Notification, NotificationCreateInput, createNotificationDefaults } from './Notification';

// Re-exportar tipos
export type { UserRole, VerificationStatus, RideStatus, BookingStatus, AlertStatus, AlertType, TravelPreference } from '../types';