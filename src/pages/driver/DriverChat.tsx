import React from 'react';
import { Chat } from '../passenger/Chat';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DriverChat = () => {
    return (
        <div className="bg-slate-50 min-h-screen">
            <div className="bg-green-600 text-white pt-8 pb-12 px-6 shadow-lg mb-0 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <Link to="/dashboard/driver" className="flex items-center text-green-100 hover:text-white mb-4 transition-colors w-fit">
                        <ChevronLeft size={20} className="mr-1" />
                        <span className="font-medium text-sm">Voltar ao Painel</span>
                    </Link>
                    <h1 className="text-2xl font-bold">Mensagens dos Passageiros</h1>
                    <p className="text-sm text-green-100 opacity-90">Combine os detalhes da viagem diretamente com quem vai com você.</p>
                </div>
            </div>

            <div className="-mt-12 relative z-20">
                <Chat />
            </div>
        </div>
    );
};
