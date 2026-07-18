import React from 'react';
import { Star, ThumbsUp, MessageSquare, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

export const DriverReviews = () => {
    const { user } = useAuth();

    // Mock Reviews
    const reviews = [
        { id: 1, author: 'Maria Silva', rating: 5, comment: 'Viagem excelente! Motorista muito educado e pontual.', date: 'Há 2 dias', avatar: 'https://ui-avatars.com/api/?name=Maria+Silva' },
        { id: 2, author: 'João Paulo', rating: 5, comment: 'Carro muito limpo e confortável. Recomendo!', date: 'Há 5 dias', avatar: 'https://ui-avatars.com/api/?name=Joao+Paulo' },
        { id: 3, author: 'Ana Costa', rating: 4, comment: 'Tudo certo, mas o ar condicionado estava muito frio.', date: 'Há 1 semana', avatar: 'https://ui-avatars.com/api/?name=Ana+Costa' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                <Link to="/dashboard/driver" className="flex items-center text-slate-500 hover:text-blue-600 mb-6 transition-colors">
                    <ChevronLeft size={20} className="mr-1" />
                    <span className="font-medium">Voltar ao Painel</span>
                </Link>
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Avaliações</h1>
                    <p className="text-slate-500">O que os passageiros dizem sobre você.</p>
                </div>

                {/* Rating Overview */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm mb-8 flex items-center justify-between">
                    <div>
                        <div className="text-5xl font-bold text-slate-900 mb-2 flex items-center">
                            4.9 <Star className="text-amber-400 fill-current ml-2" size={32} />
                        </div>
                        <p className="text-slate-500 text-sm">Baseado em 42 avaliações</p>
                    </div>
                    <div className="flex space-x-4">
                        <div className="text-center">
                            <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center text-green-600 font-bold text-xl mb-1">
                                98%
                            </div>
                            <span className="text-xs text-slate-500">Pontualidade</span>
                        </div>
                        <div className="text-center">
                            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl mb-1">
                                100%
                            </div>
                            <span className="text-xs text-slate-500">Segurança</span>
                        </div>
                    </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-4">
                    {reviews.map(review => (
                        <div key={review.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center space-x-3">
                                    <img src={review.avatar} alt={review.author} className="w-10 h-10 rounded-full" />
                                    <div>
                                        <h4 className="font-bold text-slate-900">{review.author}</h4>
                                        <span className="text-xs text-slate-400">{review.date}</span>
                                    </div>
                                </div>
                                <div className="flex items-center bg-amber-50 px-2 py-1 rounded-lg">
                                    <Star size={14} className="text-amber-400 fill-current mr-1" />
                                    <span className="font-bold text-amber-700 text-sm">{review.rating}.0</span>
                                </div>
                            </div>
                            <p className="text-slate-600 text-sm leading-relaxed mb-4">"{review.comment}"</p>
                            <div className="flex items-center space-x-4 pt-4 border-t border-slate-50">
                                <button className="text-slate-400 hover:text-blue-600 text-xs font-bold flex items-center transition-colors">
                                    <MessageSquare size={14} className="mr-1" /> Responder
                                </button>
                                <button className="text-slate-400 hover:text-blue-600 text-xs font-bold flex items-center transition-colors">
                                    <ThumbsUp size={14} className="mr-1" /> Útil
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
