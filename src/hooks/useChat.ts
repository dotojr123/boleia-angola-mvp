import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Message } from '../types';
import { api } from '../lib/api';

export const useChat = (activeReceiverId?: string) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch initial messages and set up polling
    useEffect(() => {
        if (!user || !activeReceiverId) return;

        const fetchMessages = async () => {
            try {
                const response = await api.get(`/messages/${activeReceiverId}`);
                setMessages(response.data || []);
            } catch (err) {
                console.error('Error fetching messages:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();

        // Polling for new messages every 5 seconds
        const interval = setInterval(fetchMessages, 5000);

        return () => clearInterval(interval);
    }, [user, activeReceiverId]);

    const sendMessage = async (content: string) => {
        if (!user || !activeReceiverId) return;

        // Optimistic update
        const tempId = Math.random().toString();
        const newMessage: Message = {
            id: tempId,
            sender_id: user.id,
            receiver_id: activeReceiverId,
            content,
            created_at: new Date().toISOString(),
            is_read: false
        };

        setMessages(prev => [...prev, newMessage]);

        try {
            const response = await api.post('/messages', {
                receiver_id: activeReceiverId,
                content
            });
            const data = response.data;
            // Replace temp message with real one
            setMessages(prev => prev.map(m => m.id === tempId ? data : m));
        } catch (error) {
            // Rollback if error
            setMessages(prev => prev.filter(m => m.id !== tempId));
            console.error('Error sending message:', error);
        }
    };

    return { messages, loading, sendMessage };
};
