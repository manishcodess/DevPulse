import { apiFetch } from '../utils/api';
import { DevMemory } from '../types';

export interface MemoriesResponse {
  devMemories: DevMemory[];
  targetRole?: string;
  targetCompanies?: string[];
  preferredLanguage?: string;
}

/**
 * Fetches all developer memories & target role info
 */
export async function fetchMemories(): Promise<MemoriesResponse> {
  const response = await apiFetch('/auth/memories');
  return response.json();
}

/**
 * Adds a new developer insight / memory
 */
export async function addMemory(text: string, category = 'general'): Promise<MemoriesResponse> {
  const response = await apiFetch('/auth/memories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, category, source: 'manual' }),
  });
  return response.json();
}

/**
 * Deletes a developer insight / memory by id
 */
export async function deleteMemory(memoryId: string): Promise<MemoriesResponse> {
  const response = await apiFetch(`/auth/memories/${memoryId}`, {
    method: 'DELETE',
  });
  return response.json();
}

/**
 * Updates profile insights (target role, target companies, preferred language)
 */
export async function updateProfileInsights(insights: {
  targetRole?: string;
  targetCompanies?: string[];
  preferredLanguage?: string;
}): Promise<any> {
  const response = await apiFetch('/auth/profile-insights', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(insights),
  });
  return response.json();
}
