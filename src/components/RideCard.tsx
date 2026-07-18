import React from 'react';
import { Ride } from '../types';
import { MapPin, Clock, Star, Users, Cigarette, Music, MessageSquare, Dog, Car } from 'lucide-react';
import { LevelBadge } from './LevelBadge';

interface RideCardProps {
  ride: Ride;
  onClick: (ride: Ride) => void;
}

export const RideCard: React.FC<RideCardProps> = ({ ride, onClick }) => {
  return (
    <div
      onClick={() => onClick(ride)}
      className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-4 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">
            {ride.price.toLocaleString()} {ride.currency}
          </h3>
          <p className="text-xs text-slate-500 font-medium">por passageiro</p>
        </div>
        <div className="flex flex-col items-end">
             <span className="inline-flex items-center text-sm font-semibold text-slate-700 bg-slate-50 px-2 py-1 rounded-lg">
                <Users size={14} className="mr-1 text-blue-600" />
                {ride.availableSeats} lug.
             </span>
        </div>
      </div>

      <div className="relative pl-4 border-l-2 border-slate-200 space-y-6 my-4">
        <div className="relative">
          <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-slate-400 bg-white"></div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-slate-800">{ride.time}</span>
            <span className="text-slate-600">{ride.origin}</span>
          </div>
        </div>

        <div className="relative">
            <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-blue-600 bg-blue-600"></div>
            <div className="flex flex-col">
                <span className="text-sm text-slate-400 font-medium">{ride.duration} de viagem</span>
                <span className="text-slate-600">{ride.destination}</span>
            </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center space-x-3">
          <img
            src={ride.driver.avatar_url}
            alt={ride.driver.full_name || ride.driver.name}
            className="w-10 h-10 rounded-full object-cover border border-slate-200"
          />
          <div>
            <p className="text-sm font-medium text-slate-900 flex items-center">
              {ride.driver.full_name || ride.driver.name}
              {ride.driver.is_verified && (
                <span className="ml-1 text-blue-500">
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                </span>
              )}
              {ride.driver.experience_level && (
                <span className="ml-2">
                  <LevelBadge level={ride.driver.experience_level} />
                </span>
              )}
            </p>
            <div className="flex items-center text-xs text-slate-500">
              <Star size={12} className="text-amber-400 fill-current mr-1" />
              <span>{ride.driver.rating} <span className="text-slate-300 mx-1">•</span> {ride.driver.reviews_count} avaliações</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
            {ride.preferences && ride.preferences.smoking === false && <Cigarette size={14} className="text-slate-400" />}
            {ride.preferences?.music && <Music size={14} className="text-slate-400" />}
            {ride.preferences?.pets && <div title="Aceita animais"><Dog size={14} className="text-slate-400" /></div>}
            {ride.preferences?.chattiness === 'talkative' && <div title="Gosta de conversar"><MessageSquare size={14} className="text-slate-400" /></div>}
        </div>

        {ride.vehicle && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center text-xs text-slate-500">
                <Car className="mr-1 text-slate-400" size={12} />
                <span className="truncate max-w-[150px]">{ride.vehicle.make} {ride.vehicle.model} • {ride.vehicle.color}</span>
            </div>
        )}
      </div>
    </div>
  );
};
