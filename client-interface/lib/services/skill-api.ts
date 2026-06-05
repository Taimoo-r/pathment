import { apiClient } from './api-client';

export interface Skill {
  id: string;
  name: string;
  category?: string | null;
}

export interface UserSkill extends Skill {
  proficiencyLevel: number;
}

export const skillApi = {
  /** All skills in the catalog (optionally filtered). */
  listAll: (search?: string) =>
    apiClient.get(`/skills${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  /** Distinct skill categories. */
  categories: () => apiClient.get('/skills/categories'),
  /** The current user's skills (with proficiency via the join). */
  mine: () => apiClient.get('/skills/user'),
  /** Bulk-replace the user's skills. */
  save: (skills: { skillId: string; proficiencyLevel: number }[]) =>
    apiClient.post('/profile/add-skills', { skills }),
};
