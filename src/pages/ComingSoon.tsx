import React from 'react';
import { Construction, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';

interface ComingSoonProps {
    title: string;
    description?: string;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({
    title,
    description = "Estamos trabalhando duro para trazer esta funcionalidade para você o mais rápido possível."
}) => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mb-6 text-amber-500">
                <Construction size={40} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{title}</h1>
            <p className="text-slate-500 max-w-md mb-8">
                {description}
            </p>
            <Button variant="outline" onClick={() => navigate(-1)} className="flex items-center">
                <ArrowLeft size={18} className="mr-2" /> Voltar
            </Button>
        </div>
    );
};
