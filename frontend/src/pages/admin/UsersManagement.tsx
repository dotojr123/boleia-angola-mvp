import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: 'passenger' | 'driver' | 'admin';
  verification_status: 'none' | 'pending' | 'verified' | 'rejected';
  created_at: string;
  is_active: boolean;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'drivers' | 'passengers'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data
    setUsers([
      { id: '1', full_name: 'Maria Santos', email: 'maria@email.com', role: 'driver', verification_status: 'verified', created_at: '2026-06-15', is_active: true },
      { id: '2', full_name: 'João Silva', email: 'joao@email.com', role: 'driver', verification_status: 'pending', created_at: '2026-07-10', is_active: true },
      { id: '3', full_name: 'Ana Oliveira', email: 'ana@email.com', role: 'passenger', verification_status: 'verified', created_at: '2026-07-01', is_active: true },
      { id: '4', full_name: 'Pedro Costa', email: 'pedro@email.com', role: 'driver', verification_status: 'rejected', created_at: '2026-07-05', is_active: false },
      { id: '5', full_name: 'Luísa Ferreira', email: 'luisa@email.com', role: 'passenger', verification_status: 'verified', created_at: '2026-06-20', is_active: true },
    ]);
    setLoading(false);
  }, []);

  const filteredUsers = users.filter(user => {
    if (filter === 'all') return true;
    if (filter === 'pending') return user.verification_status === 'pending';
    if (filter === 'drivers') return user.role === 'driver';
    if (filter === 'passengers') return user.role === 'passenger';
    return true;
  });

  const handleVerify = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, verification_status: 'verified' as const } : u));
  };

  const handleReject = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, verification_status: 'rejected' as const } : u));
  };

  const handleToggleActive = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, is_active: !u.is_active } : u));
  };

  if (loading) return <AdminLayout><div className="flex justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="fade-in">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestão de Usuários</h1>
            <p className="text-gray-600">Gerencie todos os usuários do sistema</p>
          </div>
        </div>

        <div className="card mb-6">
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'drivers', 'passengers'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 rounded-lg font-medium ${filter === f ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendentes' : f === 'drivers' ? 'Motoristas' : 'Passageiros'}
              </button>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuário</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Função</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registrado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className={user.is_active ? '' : 'opacity-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center mr-3">
                        <span className="font-semibold text-brand-600">{user.full_name.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-xs text-gray-500">ID: {user.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.role === 'driver' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                      {user.role === 'driver' ? 'Motorista' : user.role === 'passenger' ? 'Passageiro' : 'Admin'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.verification_status === 'verified' ? 'bg-green-100 text-green-800' :
                      user.verification_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {user.verification_status === 'verified' ? 'Verificado' : user.verification_status === 'pending' ? 'Pendente' : 'Rejeitado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(user.created_at).toLocaleDateString('pt-AO')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {user.verification_status === 'pending' && (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleVerify(user.id)} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Aprovar</button>
                        <button onClick={() => handleReject(user.id)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Rejeitar</button>
                      </div>
                    )}
                    <button onClick={() => handleToggleActive(user.id)} className={`px-3 py-1 rounded ml-2 ${user.is_active ? 'bg-gray-200 hover:bg-gray-300' : 'bg-green-600 hover:bg-green-700 text-white'}`}>
                      {user.is_active ? 'Desativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}