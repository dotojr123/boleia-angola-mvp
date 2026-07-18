// src/entities/Notification.ts - Entidade Notification com validação Zod

import { z } from 'zod';

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(500),
  type: z.enum(['info', 'booking', 'review', 'message', 'promotion']).default('info'),
  link: z.string().url().optional().nullable(),
  is_read: z.boolean().default(false),
  created_at: z.string().datetime(),
});

export type Notification = z.infer<typeof NotificationSchema>;
export type NotificationInput = z.input<typeof NotificationSchema>;
export type NotificationCreateInput = Omit<NotificationInput, 'id' | 'created_at'>;

export const createNotificationDefaults = (
  userId: string,
  title: string,
  content: string,
  type: 'info' | 'booking' | 'review' | 'message' | 'promotion' = 'info',
  link?: string
): Omit<NotificationCreateInput, 'user_id'> => ({
  title,
  content,
  type,
  link: link || null,
  is_read: false,
  created_at: new Date().toISOString(),
});

export default NotificationSchema;