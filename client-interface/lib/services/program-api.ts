// API Service for Program, Level, and Roadmap Management

import { apiClient } from './api-client';
import type { Program, ProgramLevel, Roadmap, RoadmapWeek, RoadmapTask } from '../types';

// Program API
export const programsApi = {
  // Create program
  create: async (data: any) => {
    const response = await apiClient.post<Program>('/programs', data);
    return response.data;
  },

  // Get all programs
  getAll: async (filters?: any) => {
    const response = await apiClient.get<{ programs: Program[]; pagination: any }>('/programs', { params: filters });
    return response.data;
  },

  // Get program by ID
  getById: async (id: string) => {
    const response = await apiClient.get<Program>(`/programs/${id}`);
    return response.data;
  },

  // Update program
  update: async (id: string, data: any) => {
    const response = await apiClient.put<Program>(`/programs/${id}`, data);
    return response.data;
  },

  // Delete program
  delete: async (id: string) => {
    const response = await apiClient.delete(`/programs/${id}`);
    return response.data;
  },

  // Get program stats
  getStats: async (id: string) => {
    const response = await apiClient.get(`/programs/${id}/stats`);
    return response.data;
  },

  // Clone program
  clone: async (id: string, data: any) => {
    const response = await apiClient.post<Program>(`/programs/${id}/clone`, data);
    return response.data;
  },
};

// Level API
export const levelsApi = {
  // Create level
  create: async (programId: string, data: any) => {
    const response = await apiClient.post<ProgramLevel>(`/programs/${programId}/levels`, data);
    return response.data;
  },

  // Get all levels for a program
  getByProgram: async (programId: string) => {
    const response = await apiClient.get<ProgramLevel[]>(`/programs/${programId}/levels`);
    return response.data;
  },

  // Get level by ID
  getById: async (id: string) => {
    const response = await apiClient.get<ProgramLevel>(`/levels/${id}`);
    return response.data;
  },

  // Update level
  update: async (id: string, data: any) => {
    const response = await apiClient.put<ProgramLevel>(`/levels/${id}`, data);
    return response.data;
  },

  // Delete level
  delete: async (id: string) => {
    const response = await apiClient.delete(`/levels/${id}`);
    return response.data;
  },

  // Reorder levels
  reorder: async (programId: string, levelIds: string[]) => {
    const response = await apiClient.put(`/programs/${programId}/levels/reorder`, { levelIds });
    return response.data;
  },
};

// Roadmap API
export const roadmapsApi = {
  // Generate AI roadmap
  generate: async (programId: string, levelId: string, additionalInstructions?: string) => {
    const response = await apiClient.post<Roadmap>(
      `/programs/${programId}/levels/${levelId}/roadmap/generate`,
      { additionalInstructions }
    );
    return response.data;
  },

  // Create manual roadmap
  create: async (programId: string, levelId: string, data: any) => {
    const response = await apiClient.post<Roadmap>(
      `/programs/${programId}/levels/${levelId}/roadmap`,
      data
    );
    return response.data;
  },

  // Get roadmap for a level
  getByLevel: async (programId: string, levelId: string) => {
    const response = await apiClient.get<Roadmap>(`/programs/${programId}/levels/${levelId}/roadmap`);
    return response.data;
  },

  // Get roadmap by ID
  getById: async (id: string) => {
    const response = await apiClient.get<Roadmap>(`/roadmaps/${id}`);
    return response.data;
  },

  // Update roadmap
  update: async (id: string, data: any) => {
    const response = await apiClient.put<Roadmap>(`/roadmaps/${id}`, data);
    return response.data;
  },

  // Delete roadmap
  delete: async (id: string) => {
    const response = await apiClient.delete(`/roadmaps/${id}`);
    return response.data;
  },

  // Week operations
  addWeek: async (roadmapId: string, data: any) => {
    const response = await apiClient.post<RoadmapWeek>(`/roadmaps/${roadmapId}/weeks`, data);
    return response.data;
  },

  updateWeek: async (weekId: string, data: any) => {
    const response = await apiClient.put<RoadmapWeek>(`/weeks/${weekId}`, data);
    return response.data;
  },

  deleteWeek: async (weekId: string) => {
    const response = await apiClient.delete(`/weeks/${weekId}`);
    return response.data;
  },

  // Task operations
  addTask: async (weekId: string, data: any) => {
    const response = await apiClient.post<RoadmapTask>(`/weeks/${weekId}/tasks`, data);
    return response.data;
  },

  updateTask: async (taskId: string, data: any) => {
    const response = await apiClient.put<RoadmapTask>(`/roadmap-tasks/${taskId}`, data);
    return response.data;
  },

  deleteTask: async (taskId: string) => {
    const response = await apiClient.delete(`/roadmap-tasks/${taskId}`);
    return response.data;
  },
};

// Combined API export
export const programManagementApi = {
  programs: programsApi,
  levels: levelsApi,
  roadmaps: roadmapsApi,
};

export default programManagementApi;
