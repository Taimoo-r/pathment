import { apiClient } from './api-client';

export interface LibraryDocInput {
  title: string;
  category?: string;
  summary?: string;
  content?: string;   // rich-text HTML
  url?: string;
  readMins?: number;
}

/** Org-shared mentor Library (rich-text articles, links, templates, policies). */
export const libraryApi = {
  list: () => apiClient.get('/library'),
  get: (id: string) => apiClient.get(`/library/${id}`),
  create: (data: LibraryDocInput) => apiClient.post('/library', data),
  update: (id: string, data: Partial<LibraryDocInput>) => apiClient.patch(`/library/${id}`, data),
  togglePin: (id: string) => apiClient.patch(`/library/${id}/pin`, {}),
  remove: (id: string) => apiClient.delete(`/library/${id}`),
};
