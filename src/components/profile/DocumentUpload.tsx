import React, { useState } from 'react';
import { Upload, CheckCircle, XCircle, AlertCircle, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';

interface Document {
    type: 'BI' | 'CARTA';
    file: File | null;
    status: 'empty' | 'uploading' | 'success' | 'error';
    url?: string;
}

export const DocumentUpload = () => {
    const { user } = useAuth();
    const [documents, setDocuments] = useState<{ [key: string]: Document }>({
        bi: { type: 'BI', file: null, status: 'empty' },
        carta: { type: 'CARTA', file: null, status: 'empty' }
    });

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'bi' | 'carta') => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        setDocuments(prev => ({ ...prev, [type]: { ...prev[type], status: 'uploading' } }));

        try {
            /*
            // TODO: Implement file upload to custom backend
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', type);
            await api.post('/documents/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            */

            // Simulating success
            setTimeout(() => {
                setDocuments(prev => ({ ...prev, [type]: { ...prev[type], status: 'success', file } }));
            }, 1000);

        } catch (error) {
            console.error('Erro ao fazer upload:', error);
            setDocuments(prev => ({ ...prev, [type]: { ...prev[type], status: 'error' } }));
        }
    };

    const renderStatus = (status: Document['status']) => {
        switch (status) {
            case 'uploading':
                return <span className="text-blue-600 text-sm flex items-center"><span className="animate-spin mr-2">⏳</span> Enviando...</span>;
            case 'success':
                return <span className="text-green-600 text-sm flex items-center"><CheckCircle size={16} className="mr-1" /> Enviado</span>;
            case 'error':
                return <span className="text-red-600 text-sm flex items-center"><XCircle size={16} className="mr-1" /> Erro</span>;
            default:
                return <span className="text-slate-400 text-sm">Nenhum arquivo</span>;
        }
    };

    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center">
                <FileText className="mr-2 text-blue-600" /> Verificação de Identidade
            </h2>
            <p className="text-slate-500 mb-6 text-sm">Envie seus documentos para obter o selo de "Verificado" e aumentar suas reservas.</p>

            <div className="space-y-6">
                {/* Bilhete de Identidade */}
                <div className="border border-dashed border-slate-300 rounded-xl p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-slate-700">Bilhete de Identidade (BI)</span>
                        {renderStatus(documents.bi.status)}
                    </div>
                    <label className="cursor-pointer block">
                        <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'bi')} accept="image/*,.pdf" />
                        <div className="flex items-center justify-center h-12 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors">
                            <Upload size={18} className="mr-2" /> Selecionar Arquivo
                        </div>
                    </label>
                </div>

                {/* Carta de Condução */}
                <div className="border border-dashed border-slate-300 rounded-xl p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-slate-700">Carta de Condução</span>
                        {renderStatus(documents.carta.status)}
                    </div>
                    <label className="cursor-pointer block">
                        <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'carta')} accept="image/*,.pdf" />
                        <div className="flex items-center justify-center h-12 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors">
                            <Upload size={18} className="mr-2" /> Selecionar Arquivo
                        </div>
                    </label>
                </div>
            </div>

            <div className="mt-6 bg-yellow-50 p-4 rounded-xl flex items-start">
                <AlertCircle className="text-yellow-600 min-w-[20px] mt-0.5 mr-3" size={20} />
                <p className="text-sm text-yellow-800">
                    Seus documentos são armazenados de forma segura e vistos apenas pela nossa equipe de verificação. O processo leva até 24h.
                </p>
            </div>
        </div>
    );
};
