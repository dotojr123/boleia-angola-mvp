import { useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';

const mockAlerts = [
  { id: '1', reporter: 'Ana Silva', reported: 'João Motorista', type: 'harassment', status: 'pending', description: 'Motorista fez comentários inadequados', date: '2026-07-16' },
  { id: '2', reporter: 'Pedro Costa', reported: 'Maria Passageira', type: 'no_show', status: 'pending', description: 'Passageira não compareceu', date: '2026-07-15' },
  { id: '3', reporter: 'Luísa F.', reported: 'Carlos Driver', type: 'fraud', status: 'reviewed', description: 'Sobrefaturamento suspeito', date: '2026-07-14' },
];

export default function AlertsManagement() {
  const [alerts, setAlerts] = useState(mockAlerts);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('pending');

  const handleResolve = (id: string, resolution: 'resolved' | 'dismissed') => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, status: resolution as any } : a));
  };

  const filtered = alerts.filter(a => filter === 'all' ? true : a.status === filter);

  return (
    <AdminLayout>
      <div className="fade-in">
        <h1 className="text-3xl font-bold mb-6">Gestão de Denúncias</h1>
        <div className="flex gap-2 mb-6">
          {['pending', 'all'].map(f => (
            <button key={f} onClick={() => setFilter(f as any)} className={`px-4 py-2 rounded ${filter === f ? 'bg-brand-600 text-white' : 'bg-gray-100'}`}>
              {f === 'pending' ? 'Pendentes' : 'Todas'}
            </button>
          ))}
        </div>
        <div className="space-y-4">
          {filtered.map(alert => (
            <div key={alert.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-semibold">{alert.reporter} denunciou {alert.reported}</p>
                  <p className="text-sm text-gray-600">{alert.description}</p>
                  <p className="text-xs text-gray-500 mt-1">Tipo: {alert.type} · {alert.date}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${alert.status === 'pending' ? 'bg-yellow-100' : 'bg-blue-100'}`}>{alert.status}</span>
              </div>
              {alert.status === 'pending' && (
                <div className="flex gap-2">
                  <button onClick={() => handleResolve(alert.id, 'resolved')} className="btn btn-primary">Resolver</button>
                  <button onClick={() => handleResolve(alert.id, 'dismissed')} className="btn btn-secondary">Desconsiderar</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}