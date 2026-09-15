import { API_BASE_URL } from '../config';
import { apiFetch } from '../utils/api';

/**
 * Fetches all developer memories & target role info
 */
export async function fetchMemories() {
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
export async function addMemory(text, category = 'general') {
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
export async function deleteMemory(memoryId) {
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
export async function updateProfileInsights(insights) {
  const response = await apiFetch(`${API_BASE_URL}/auth/profile-insights`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(insights),
  });
  const data = await response.json();
  return data;
}
