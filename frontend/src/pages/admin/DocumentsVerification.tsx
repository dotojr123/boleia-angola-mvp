import { useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';

const mockDocs = [
  { id: '1', user: 'João Silva', type: 'CNH', url: 'https://example.com/doc1.jpg', status: 'pending', date: '2026-07-16' },
  { id: '2', user: 'Ana Pereira', type: 'Certificado', url: 'https://example.com/doc2.jpg', status: 'pending', date: '2026-07-15' },
  { id: '3', user: 'Pedro Costa', type: 'CNH', url: 'https://example.com/doc3.jpg', status: 'pending', date: '2026-07-14' },
];

export default function DocumentsVerification() {
  const [docs, setDocs] = useState(mockDocs);

  const handleApprove = (id: string) => setDocs(docs.filter(d => d.id !== id));
  const handleReject = (id: string) => setDocs(docs.filter(d => d.id !== id));

  return (
    <AdminLayout>
      <div className="fade-in">
        <h1 className="text-3xl font-bold mb-6">Verificação de Documentos</h1>
        <p className="text-gray-600 mb-6">{docs.length} documento(s) aguardando revisão</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {docs.map(doc => (
            <div key={doc.id} className="card">
              <div className="aspect-video bg-gray-200 rounded mb-4 flex items-center justify-center">
                <span className="text-gray-500">Prévia do documento</span>
              </div>
              <p className="font-semibold mb-1">{doc.user}</p>
              <p className="text-sm text-gray-600 mb-3">Tipo: {doc.type} · {doc.date}</p>
              <div className="flex gap-2">
                <button onClick={() => handleApprove(doc.id)} className="btn btn-primary flex-1">Aprovar</button>
                <button onClick={() => handleReject(doc.id)} className="btn btn-secondary flex-1">Rejeitar</button>
              </div>
            </div>
          ))}
        </div>
        {docs.length === 0 && <div className="card text-center py-12"><p className="text-gray-600">Nenhum documento pendente</p></div>}
      </div>
    </AdminLayout>
  );
}