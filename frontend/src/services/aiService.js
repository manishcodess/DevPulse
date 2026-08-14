import { API_BASE_URL } from '../config';

// ─── generateAIContent ────────────────────────────────────────────────────────
// Sends a prompt to the backend and gets back a full text response (not streamed).
// Used for: Daily Brief, Resume Analysis
// `contents` can be a plain string or an array of content parts (for PDFs)
export async function generateAIContent(contents) {
  const response = await fetch(`${API_BASE_URL}/ai/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ contents }),
  });

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(`Server returned error (${response.status}): ${text.slice(0, 120) || 'Non-JSON response received'}`);
  }

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'AI generation failed');
  return data.text;
}

export async function fetchDailyBrief() {
  const response = await fetch(`${API_BASE_URL}/ai/daily-brief`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch daily brief');
  return data.text;
}

// ─── streamAIChat ─────────────────────────────────────────────────────────────
// Opens a streaming connection to the backend for chat messages.
// Returns the raw response.body (a ReadableStream) for the caller to process.
// Sends full conversation history so the AI maintains context across messages.
export async function streamAIChat(messageHistory) {
  const response = await fetch(`${API_BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      contents: messageHistory,
    }),
  });
  if (!response.ok) throw new Error('Chat stream failed to connect');
  return response.body; // ReadableStream — the caller reads chunks from this
}

