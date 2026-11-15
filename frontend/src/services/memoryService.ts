import { API_BASE_URL } from '../config';
import { apiFetch } from '../utils/api';
import { DevMemory } from '../types';

export interface MemoriesResponse {
  devMemories: DevMemory[];
  targetRole?: string;
  targetCompanies?: string[];
  preferredLanguage?: string;
  [key: string]: any;
}

/**
 * Fetches all developer memories & target role info
 */
export async function fetchMemories(): Promise<MemoriesResponse> {
  const response = await apiFetch(`${API_BASE_URL}/auth/memories`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  const data = await response.json();
  return data;
}

/**
 * Adds a new developer insight / memory
 */
export async function addMemory(text: string, category = 'general'): Promise<MemoriesResponse> {
  const response = await apiFetch(`${API_BASE_URL}/auth/memories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ text, category, source: 'manual' }),
  });
  const data = await response.json();
  return data;
}

/**
 * Deletes a developer insight / memory by id
 */
export async function deleteMemory(memoryId: string): Promise<MemoriesResponse> {
  const response = await apiFetch(`${API_BASE_URL}/auth/memories/${memoryId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  const data = await response.json();
  return data;
}

/**
 * Updates profile insights (target role, target companies, preferred language)
 */
export async function updateProfileInsights(insights: {
  targetRole?: string;
  targetCompanies?: string[];
  preferredLanguage?: string;
}): Promise<any> {
  const response = await apiFetch(`${API_BASE_URL}/auth/profile-insights`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(insights),
  });
  const data = await response.json();
  return data;
}
