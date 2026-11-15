import { API_BASE_URL } from '../config';
import { apiFetch } from '../utils/api';
import { Conversation } from '../types';

/**
 * Fetches all conversations for the authenticated user
 */
export async function fetchConversations(): Promise<Conversation[]> {
  const response = await apiFetch(`${API_BASE_URL}/conversations`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  const data = await response.json();
  return data.conversations || [];
}

/**
 * Creates a new conversation
 */
export async function createConversation(payload: Partial<Conversation> = {}): Promise<Conversation> {
  const response = await apiFetch(`${API_BASE_URL}/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  return data.conversation;
}

/**
 * Fetches a single conversation with full message history
 */
export async function fetchConversation(id: string): Promise<Conversation> {
  const response = await apiFetch(`${API_BASE_URL}/conversations/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  const data = await response.json();
  return data.conversation;
}

/**
 * Updates conversation metadata (title, pinned, category, tags)
 */
export async function updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation> {
  const response = await apiFetch(`${API_BASE_URL}/conversations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(updates),
  });
  const data = await response.json();
  return data.conversation;
}

/**
 * Deletes a conversation
 */
export async function deleteConversation(id: string): Promise<{ success: boolean; message?: string }> {
  const response = await apiFetch(`${API_BASE_URL}/conversations/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  const data = await response.json();
  return data;
}

/**
 * Clears messages in a conversation
 */
export async function clearConversationMessages(id: string): Promise<{ success: boolean; conversation?: Conversation }> {
  const response = await apiFetch(`${API_BASE_URL}/conversations/${id}/clear`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  const data = await response.json();
  return data;
}
