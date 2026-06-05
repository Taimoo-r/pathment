import { apiClient } from './api-client';

export type AnnouncementAudience = 'all' | 'mentors' | 'mentees' | 'program' | 'clan';

/** Announcements + audience targeting + reactions. */
export const announcementsApi = {
  list: () => apiClient.get('/announcements'),
  create: (data: { title: string; body: string; audience: AnnouncementAudience; audienceId?: string }) =>
    apiClient.post('/announcements', data),
  togglePin: (id: string) => apiClient.patch(`/announcements/${id}/pin`, {}),
  react: (id: string, type: 'acknowledged' | 'helpful') => apiClient.post(`/announcements/${id}/react`, { type }),
  remove: (id: string) => apiClient.delete(`/announcements/${id}`),
  // Clans the logged-in mentor leads (compose dropdown).
  ledClans: () => apiClient.get('/announcements/led-clans'),
};
