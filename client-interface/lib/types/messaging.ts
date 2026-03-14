export interface ConversationParticipantUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePictureUrl?: string;
  role: 'admin' | 'mentor' | 'mentee';
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSizeBytes?: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  recipientId: string;
  threadId: string;
  parentMessageId?: string;
  subject?: string;
  messageText: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
  sender?: ConversationParticipantUser;
  attachments?: MessageAttachment[];
}

export interface ConversationSummary {
  id: string;
  type: 'direct' | 'system';
  relatedTaskId?: string;
  relatedEnrollmentId?: string;
  lastMessageAt?: string;
  unreadCount: number;
  participants: ConversationParticipantUser[];
  lastMessage?: ChatMessage;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'task' | 'feedback' | 'badge' | 'milestone' | 'message' | 'system' | 'challenge';
  title: string;
  message: string;
  status: 'unread' | 'read' | 'archived';
  actionUrl?: string;
  actionLabel?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  readAt?: string;
  createdAt: string;
}
