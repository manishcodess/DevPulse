import { apiFetch } from '../utils/api';
import { StructuredResumeMatch } from '../types';

/**
 * Sends prompt parts to AI for one-shot text generation (non-streamed).
 */
export async function generateAIContent(contents: any): Promise<string> {
  const response = await apiFetch('/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents }),
  });

  const data = await response.json();
  return data.text;
}

/**
 * Fetches the daily coaching briefing based on live developer telemetry.
 */
export async function fetchDailyBrief(forceFresh = false): Promise<string> {
  const url = forceFresh ? '/ai/daily-brief?fresh=true' : '/ai/daily-brief';
  const response = await apiFetch(url);
  const data = await response.json();
  return data.text;
}

/**
 * Streams AI mentor response chunks for chat interface.
 */
export async function streamAIChat(
  messageHistory: any[],
  conversationId: string | null = null,
  activeCategory = 'general'
): Promise<ReadableStream<Uint8Array> | null> {
  const response = await apiFetch('/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: messageHistory,
      conversationId,
      activeCategory,
    }),
  });
  return response.body;
}

/**
 * Evaluates candidate resume against target job description for ATS fit and skill gaps.
 */
export async function matchResumeWithJD(
  contents: any,
  jobDescription: string,
  textContent = ''
): Promise<StructuredResumeMatch> {
  const response = await apiFetch('/ai/resume-match', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents, jobDescription, textContent }),
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.data;
}
