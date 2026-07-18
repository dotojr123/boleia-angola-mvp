import React from 'react';
import { Award, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { ExperienceLevel } from '../types';

interface LevelBadgeProps {
  level: ExperienceLevel;
  showIcon?: boolean;
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({ level, showIcon = true }) => {
  const config = {
    novice: {
      label: 'Novato',
      color: 'bg-slate-100 text-slate-600 border-slate-200',
      icon: Award
    },
    intermediate: {
      label: 'Especialista',
      color: 'bg-blue-50 text-blue-600 border-blue-100',
      icon: Zap
    },
    expert: {
      label: 'Expert',
      color: 'bg-purple-50 text-purple-600 border-purple-100',
      icon: ShieldCheck
    },
    ambassador: {
      label: 'Embaixador',
      color: 'bg-amber-50 text-amber-600 border-amber-200',
      icon: Sparkles
    }
  };

  const { label, color, icon: Icon } = config[level] || config.novice;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${color}`}>
      {showIcon && <Icon size={12} className="mr-1" />}
      {label}
    </span>
  );
};
