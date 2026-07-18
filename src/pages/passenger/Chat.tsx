import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Phone, Send, MessageCircle, Loader2 } from 'lucide-react';
import { ChatSession, Message, User } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useChat } from '../../hooks/useChat';
import { api } from '../../lib/api';

export const Chat = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // State for conversation list
    const [recentPartners, setRecentPartners] = useState<{ user: User, lastMessage: string, unreadCount: number }[]>([]);
    const [activePartner, setActivePartner] = useState<User | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [loadingList, setLoadingList] = useState(true);

    // Initial partner from navigation state (e.g. clicking "Chat" on a ride)
    useEffect(() => {
        if (location.state?.partnerId) {
            const fetchPartner = async () => {
                try {
                    const { data } = await api.get(`/profiles/${location.state.partnerId}`);
                    if (data) setActivePartner(data);
                } catch (err) {
                    console.error("Error fetching partner", err);
                }
            };
            fetchPartner();
        }
    }, [location.state]);

    // Fetch conversation partners
    useEffect(() => {
        if (!user) return;

        const fetchPartners = async () => {
            setLoadingList(true);
            try {
                const { data } = await api.get('/messages/partners');
                const normalized = (data || []).map((p: any) => ({
                    user: {
                        id: p.id,
                        full_name: p.full_name,
                        avatar_url: p.avatar_url,
                        phone: p.phone,
                        email: p.email,
                        role: p.role || 'PASSENGER'
                    },
                    lastMessage: p.last_message || '',
                    unreadCount: Number(p.unread_count || 0)
                }));
                setRecentPartners(normalized);
            } catch (err) {
                console.error("Error fetching partners", err);
            } finally {
                setLoadingList(false);
            }
        };

        fetchPartners();

        // Polling as a temporary replacement for Realtime
        const interval = setInterval(fetchPartners, 10000);

        return () => clearInterval(interval);
    }, [user]);

    // Use our hook for the active conversation
    const { messages, sendMessage, loading: loadingMessages } = useChat(activePartner?.id);

    const handleSend = async () => {
        if (!newMessage.trim()) return;
        await sendMessage(newMessage);
        setNewMessage('');
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    if (!user) {
        navigate('/login');
        return null; // Prevent flash
    }

    return (
        <div className="bg-slate-50 min-h-[calc(100vh-80px)] flex">
            <div className="max-w-7xl mx-auto w-full grid md:grid-cols-3 gap-0 md:gap-8 p-0 md:p-6">

                {/* Chat List Sidebar */}
                <div className={`${activePartner ? 'hidden md:block' : 'block'} md:col-span-1 bg-white md:rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-[calc(100vh-80px)] md:h-[600px] flex flex-col`}>
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <Link to="/dashboard/passenger" className="flex items-center text-slate-500 hover:text-blue-600 mb-2 transition-colors w-fit md:hidden">
                            <ChevronLeft size={18} className="mr-1" />
                            <span className="font-bold text-xs">Painel</span>
                        </Link>
                        <h2 className="font-bold text-lg text-slate-800">Mensagens</h2>
                    </div>
                    <div className="overflow-y-auto flex-1">
                        {loadingList ? (
                            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-300" /></div>
                        ) : recentPartners.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm">Nenhuma conversa recente</div>
                        ) : (
                            recentPartners.map(item => (
                                <div
                                    key={item.user.id}
                                    onClick={() => setActivePartner(item.user)}
                                    className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${activePartner?.id === item.user.id ? 'bg-blue-50/50' : ''}`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="relative">
                                            <img src={item.user.avatar_url || `https://ui-avatars.com/api/?name=${item.user.full_name}`} className="w-12 h-12 rounded-full object-cover" alt="" />
                                            {/* Online indicator could go here */}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h3 className="font-bold text-slate-900 truncate">{item.user.full_name}</h3>
                                            </div>
                                            <p className={`text-sm truncate ${item.unreadCount > 0 ? 'font-bold text-slate-800' : 'text-slate-500'}`}>
                                                {item.lastMessage}
                                            </p>
                                        </div>
                                        {item.unreadCount > 0 && (
                                            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-xs text-white font-bold">
                                                {item.unreadCount}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Active Chat Area */}
                <div className={`${!activePartner ? 'hidden md:flex' : 'flex'} md:col-span-2 bg-white md:rounded-2xl shadow-sm border border-slate-200 h-[calc(100vh-80px)] md:h-[600px] flex-col`}>
                    {activePartner ? (
                        <>
                            {/* Header */}
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 md:rounded-t-2xl">
                                <div className="flex items-center space-x-3">
                                    <button className="md:hidden" onClick={() => setActivePartner(null)}>
                                        <ChevronLeft className="text-slate-600" />
                                    </button>
                                    <img src={activePartner.avatar_url || `https://ui-avatars.com/api/?name=${activePartner.full_name}`} alt="" className="w-10 h-10 rounded-full" />
                                    <div>
                                        <h3 className="font-bold text-slate-900">{activePartner.full_name}</h3>
                                        <span className="text-xs text-slate-500 flex items-center">
                                            {/* Status indicator can be added later */}
                                            Online recentemente
                                        </span>
                                    </div>
                                </div>
                                <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                                    <Phone size={20} />
                                </button>
                            </div>

                            {/* Messages List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                                {loadingMessages && messages.length === 0 ? (
                                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-500" /></div>
                                ) : (
                                    messages.map(msg => (
                                        <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[75%] rounded-2xl p-4 ${msg.sender_id === user.id ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'}`}>
                                                <p className="text-sm leading-relaxed">{msg.content}</p>
                                                <div className="flex justify-end items-center mt-1 space-x-1">
                                                    <span className={`text-[10px] block opacity-70 ${msg.sender_id === user.id ? 'text-blue-100' : 'text-slate-400'}`}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {msg.sender_id === user.id && (
                                                        <span className="text-[10px] text-blue-100">
                                                            {msg.is_read ? '✓✓' : '✓'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-white border-t border-slate-100 md:rounded-b-2xl">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder="Digite uma mensagem..."
                                        className="flex-1 bg-slate-100 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={!newMessage.trim()}
                                        className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Send size={20} />
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                            <MessageCircle size={64} className="mb-4 opacity-20" />
                            <p>Selecione uma conversa para começar</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
