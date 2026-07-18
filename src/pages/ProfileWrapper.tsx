import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DriverProfile } from './driver/DriverProfile';
import { PassengerProfile } from './passenger/PassengerProfile';
import { Loader2 } from 'lucide-react';

export const ProfileWrapper = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        }
    }, [user, loading, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
        );
    }

    if (!user) return null;

    if (user.type === 'DRIVER') {
        return <DriverProfile />;
    }

    return <PassengerProfile />;
};
