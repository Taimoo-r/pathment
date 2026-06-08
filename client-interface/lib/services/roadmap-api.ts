import { apiClient } from './api-client';

export interface RoadmapStepInput {
  title: string;
  type?: string;
  brief?: string;
  description?: string;
  criteria?: string[];
  effort?: string;
  dueOffsetDays?: number;
}

/** Admin org-roadmap authoring (the shared library mentors import + assign). */
export const orgRoadmapApi = {
  list: () => apiClient.get('/roadmaps/org'),
  create: (data: { name: string; programId: string; description?: string; skillTags?: string[]; steps: RoadmapStepInput[]; published?: boolean }) =>
    apiClient.post('/roadmaps/org', data),
  update: (id: string, data: { name?: string; description?: string; skillTags?: string[]; published?: boolean }) =>
    apiClient.patch(`/roadmaps/org/${id}`, data),
  addStep: (id: string, step: RoadmapStepInput) => apiClient.post(`/roadmaps/org/${id}/steps`, step),
  removeStep: (id: string, stepId: string) => apiClient.delete(`/roadmaps/org/${id}/steps/${stepId}`),
  remove: (id: string) => apiClient.delete(`/roadmaps/org/${id}`),
};

/** AI-draft roadmap steps from the brief (name/description/tags/duration). */
export interface RoadmapAiInput {
  name?: string;
  description?: string;
  type?: string;
  /** 'tasks' (default) = a flat ordered list; 'weeks' = paced across N weeks. */
  mode?: 'tasks' | 'weeks';
  durationWeeks?: number;
  /** How many steps to generate (1–40). */
  count?: number;
  skillTags?: string[];
  /** Free-text author guidance: what to include, links, tone, etc. */
  additionalInstructions?: string;
}
export const roadmapAiApi = {
  generate: (data: RoadmapAiInput) =>
    apiClient.post<{ data: { steps: RoadmapStepInput[] } }>('/roadmaps/generate', data),
};

/** Mentee's own roadmap progress (step X/N). */
export const menteeRoadmapApi = {
  mine: () => apiClient.get('/roadmaps/me'),
};

export interface MenteeRoadmapStep { id: string; title: string; type: string; done: boolean; current: boolean }
export interface MenteeRoadmap {
  roadmapId: string;
  name: string;
  description: string | null;
  skillTags: string[];
  currentStep: number;
  totalSteps: number;
  completed: boolean;
  percent: number;
  currentStepTitle: string | null;
  steps: MenteeRoadmapStep[];
}
