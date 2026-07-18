import React from 'react';
import { DollarSign, TrendingUp, Calendar, Download, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

export const DriverEarnings = () => {
    const { user } = useAuth();

    // Mock Data
    const transactions = [
        { id: 1, date: '2024-03-15', route: 'Luanda -> Benguela', amount: 15000, status: 'paid' },
        { id: 2, date: '2024-03-10', route: 'Luanda -> Huambo', amount: 22000, status: 'paid' },
        { id: 3, date: '2024-03-05', route: 'Benguela -> Lobito', amount: 5000, status: 'processed' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <Link to="/dashboard/driver" className="flex items-center text-slate-500 hover:text-blue-600 mb-6 transition-colors">
                    <ChevronLeft size={20} className="mr-1" />
                    <span className="font-medium">Voltar ao Painel</span>
                </Link>
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Meus Ganhos</h1>
                        <p className="text-slate-500">Acompanhe seu desempenho financeiro.</p>
                    </div>
                    <button className="flex items-center text-blue-600 font-bold text-sm bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors">
                        <Download size={16} className="mr-2" /> Exportar Relatório
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="text-slate-500 font-medium text-sm mb-2">Saldo Disponível</div>
                        <div className="text-3xl font-bold text-slate-900">42.000 Kz</div>
                        <div className="text-xs text-green-600 font-medium mt-1">Pronto para saque</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="text-slate-500 font-medium text-sm mb-2">Ganhos em Março</div>
                        <div className="text-3xl font-bold text-slate-900">125.000 Kz</div>
                        <div className="text-xs text-green-600 font-medium mt-1 flex items-center">
                            <TrendingUp size={12} className="mr-1" /> +15% vs mês anterior
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="text-slate-500 font-medium text-sm mb-2">Total Acumulado</div>
                        <div className="text-3xl font-bold text-slate-900">850.000 Kz</div>
                        <div className="text-xs text-slate-400 font-medium mt-1">Desde Jan 2024</div>
                    </div>
                </div>

                {/* Transactions List */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="font-bold text-lg text-slate-900">Histórico de Transações</h2>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {transactions.map(tx => (
                            <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center space-x-4">
                                    <div className="p-3 bg-green-50 rounded-full text-green-600">
                                        <DollarSign size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">{tx.route}</h3>
                                        <div className="flex items-center text-xs text-slate-500 mt-1">
                                            <Calendar size={12} className="mr-1" /> {tx.date}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-slate-900 text-lg">+{tx.amount.toLocaleString()} Kz</div>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tx.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {tx.status === 'paid' ? 'Pago' : 'Processando'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 border-t border-slate-100 text-center">
                        <button className="text-blue-600 font-bold text-sm hover:underline">Ver todo o histórico</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
