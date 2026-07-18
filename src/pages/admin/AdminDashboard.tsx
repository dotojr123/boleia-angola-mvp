import React, { useEffect, useState } from 'react';
import { Users, Car, MapPin, Activity, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
        <Icon size={24} className={`text-${color.split('-')[1]}-600`} />
      </div>
      <span className="text-2xl font-bold text-slate-900">{value}</span>
    </div>
    <h3 className="text-slate-500 font-medium text-sm">{label}</h3>
  </div>
);

export const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: 0,
    rides: 0,
    bookings: 0,
    reports: 0
  });
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      setLoading(true);

      try {
        // Correct check that user is admin (based on AuthContext user object)
        if (user.type !== 'ADMIN') {
          navigate('/');
          return;
        }

        // TODO: Implement GET /api/admin/stats
        /*
        const { data: statsData } = await api.get('/admin/stats');
        setStats(statsData);
        */

        setStats({
          users: 0,
          rides: 0,
          bookings: 0,
          reports: 0
        });

      } catch (err) {
        console.error("Admin dashboard fetch error", err);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAndFetchData();
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-slate-900 text-white pt-12 pb-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Painel Administrativo</h1>
          <p className="text-slate-400">Visão geral do sistema e moderação.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard icon={Users} label="Usuários Totais" value={stats.users} color="bg-blue-500" />
          <StatCard icon={Car} label="Caronas Ativas" value={stats.rides} color="bg-green-500" />
          <StatCard icon={Activity} label="Reservas Hoje" value={stats.bookings} color="bg-purple-500" />
          <StatCard icon={ShieldAlert} label="Denúncias" value={stats.reports} color="bg-red-500" />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Recent Verifications */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-bold text-slate-900">Verificações Pendentes</h2>
              <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-full">{pendingVerifications.length} Pendentes</span>
            </div>
            <div className="divide-y divide-slate-100">
              {pendingVerifications.length > 0 ? pendingVerifications.map((item, i) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold overflow-hidden">
                      {item.avatar_url ? (
                        <img src={item.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (item.full_name || item.email)?.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{item.full_name || item.email}</div>
                      <div className="text-xs text-slate-500">{item.role} • {!item.email_verified ? 'Email ⚠️' : ''} {!item.phone_verified ? 'Phone ⚠️' : ''}</div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Aprovar">
                      <CheckCircle size={20} />
                    </button>
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Rejeitar">
                      <XCircle size={20} />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center text-slate-500">Nenhuma verificação pendente</div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 text-center">
              <button className="text-blue-600 font-bold text-sm hover:underline">Ver todas as solicitações</button>
            </div>
          </div>

          {/* System Health / Recent Activity */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Atividade Recente</h2>
            </div>
            <div className="p-6 space-y-6">
              {recentActivities.length > 0 ? recentActivities.map((log, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <div className={`mt-1 w-2 h-2 rounded-full ${i === 0 ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`}></div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 leading-tight">Nova carona publicada</p>
                    <p className="text-xs text-slate-500">{log.profiles?.full_name || 'Usuário'} • {log.origin} → {log.destination}</p>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">
                      {new Date(log.created_at).toLocaleDateString('pt-BR')} • {new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="text-center text-slate-400 text-sm py-4">Sem atividades recentes</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
