import React from 'react';
import { motion } from 'framer-motion';

interface PremiumCardProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    noPad?: boolean;
}

export const PremiumCard: React.FC<PremiumCardProps> = ({ children, className = '', delay = 0, noPad = false }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay, ease: "easeOut" }}
            className={`glass-card ${!noPad ? 'p-6' : ''} rounded-3xl ${className}`}
        >
            {children}
        </motion.div>
    );
};
