import React from 'react';
import { motion } from 'framer-motion';

interface MeshHeaderProps {
    title: string;
    subtitle: string;
    variant?: 'blue' | 'green';
}

export const MeshHeader: React.FC<MeshHeaderProps> = ({ title, subtitle, variant = 'blue' }) => {
    const gradientClass = variant === 'blue' ? 'mesh-gradient-blue' : 'mesh-gradient-green';

    return (
        <div className={`${gradientClass} text-white pt-16 pb-32 px-6 relative overflow-hidden`}>
            {/* Decorative background shapes */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-10 -mb-10 blur-2xl"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-4xl font-extrabold mb-3 tracking-tight">{title}</h1>
                    <p className="text-white/80 text-lg font-medium">{subtitle}</p>
                </motion.div>
            </div>
        </div>
    );
};
