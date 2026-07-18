// src/entities/Message.ts - Entidade Message com validação Zod

import { z } from 'zod';

export const MessageSchema = z.object({
  id: z.string().uuid(),
  ride_id: z.string().uuid().nullable(),
  sender_id: z.string().uuid(),
  receiver_id: z.string().uuid(),
  content: z.string().min(1).max(2000),
  is_read: z.boolean().default(false),
  created_at: z.string().datetime(),
});

export type Message = z.infer<typeof MessageSchema>;
export type MessageInput = z.input<typeof MessageSchema>;
export type MessageCreateInput = Omit<MessageInput, 'id' | 'created_at'>;

export const MessageValidator = {
  validateContent: (content: string): boolean => {
    return content.trim().length >= 1 && content.length <= 2000;
  },
};

export const createMessageDefaults = (
  senderId: string,
  receiverId: string,
  content: string,
  rideId?: string
): Omit<MessageCreateInput, 'sender_id' | 'receiver_id'> => ({
  ride_id: rideId || null,
  content,
  is_read: false,
  created_at: new Date().toISOString(),
});

export default MessageSchema;