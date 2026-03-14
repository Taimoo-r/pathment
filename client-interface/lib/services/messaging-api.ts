import { apiClient } from './api-client';
import type { ChatMessage, ConversationSummary, NotificationItem } from '@/lib/types/messaging';

export interface SendMessagePayload {
  conversationId: string;
  messageText: string;
  subject?: string;
  parentMessageId?: string;
  relatedTaskId?: string;
  relatedEnrollmentId?: string;
}

export const messagingApi = {
  async listConversations(limit = 25): Promise<ConversationSummary[]> {
    const response = await apiClient.get<any>(`/messaging/conversations?limit=${limit}`);
    return response.data?.conversations || [];
  },

  async createDirectConversation(participantId: string, relatedTaskId?: string, relatedEnrollmentId?: string): Promise<any> {
    const response = await apiClient.post<any>('/messaging/conversations/direct', {
      participantId,
      relatedTaskId,
      relatedEnrollmentId,
    });
    return response.data?.conversation;
  },

  async listMessages(conversationId: string, limit = 50, before?: string): Promise<ChatMessage[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (before) {
      params.set('before', before);
    }

    const response = await apiClient.get<any>(`/messaging/conversations/${conversationId}/messages?${params.toString()}`);
    return response.data?.messages || [];
  },

  async sendMessage(payload: SendMessagePayload): Promise<ChatMessage> {
    const response = await apiClient.post<any>('/messaging/messages', payload);
    return response.data?.message;
  },

  async markConversationRead(conversationId: string): Promise<{ updatedCount: number }> {
    const response = await apiClient.post<any>(`/messaging/conversations/${conversationId}/read`, {});
    return {
      updatedCount: response.data?.updatedCount || 0,
    };
  },

  async listNotifications(limit = 30): Promise<{ notifications: NotificationItem[]; unreadCount: number }> {
    const response = await apiClient.get<any>(`/messaging/notifications?limit=${limit}`);
    return {
      notifications: response.data?.notifications || [],
      unreadCount: response.data?.unreadCount || 0,
    };
  },

  async markNotificationRead(notificationId: string): Promise<any> {
    const response = await apiClient.post(`/messaging/notifications/${notificationId}/read`, {});
    return response.data;
  },

  async markAllNotificationsRead(): Promise<any> {
    const response = await apiClient.post('/messaging/notifications/read-all', {});
    return response.data;
  },

  async deleteNotification(notificationId: string): Promise<any> {
    const response = await apiClient.delete(`/messaging/notifications/${notificationId}`);
    return response.data;
  },
};
