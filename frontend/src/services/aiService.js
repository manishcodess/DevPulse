import { API_BASE_URL } from '../config';

// ─── generateAIContent ────────────────────────────────────────────────────────
// Sends a prompt to the backend and gets back a full text response (not streamed).
// Used for: Daily Brief, Resume Analysis
// `contents` can be a plain string or an array of content parts (for PDFs)
export async function generateAIContent(contents) {
  const response = await fetch(`${API_BASE_URL}/ai/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

// ─── streamAIChat ─────────────────────────────────────────────────────────────
// Opens a streaming connection to the backend using Server-Sent Events (SSE).
// Returns the raw response.body (a ReadableStream) for the caller to process.
// Used for: Chat messages
export async function streamAIChat(userMessage, systemInstruction) {
  const response = await fetch(`${API_BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: userMessage,
      systemInstruction,
    }),
  });
  if (!response.ok) throw new Error('Chat stream failed to connect');
  return response.body; // ReadableStream — the caller reads chunks from this
}

// ─── buildSystemPrompt ────────────────────────────────────────────────────────
// Builds the system instruction that tells the AI who it is and what data it has.
// This is sent once per chat message — it gives the AI real context about the user.
export function buildSystemPrompt(githubData, leetcodeData, userCredentials) {
  const firstName = userCredentials?.name?.split(' ')[0] || 'User';

  // Optional sections — only included if the user has provided this data
  const bioSection = userCredentials?.bio
    ? `\nUSER'S BIO / CUSTOM INSTRUCTIONS:\n"${userCredentials.bio}"\n`
    : '';

  const resumeSection = userCredentials?.resumeContext
    ? `\nUSER'S LATEST RESUME FEEDBACK:\n${userCredentials.resumeContext}\n`
    : '';

  return `You are DevPulse — an AI developer coach and mentor for ${firstName}.
${bioSection}
${resumeSection}
${firstName.toUpperCase()}'S REAL-TIME STATS:
- LeetCode: ${leetcodeData?.total ?? 'unknown'} problems solved
  Easy: ${leetcodeData?.easy ?? '?'} | Medium: ${leetcodeData?.medium ?? '?'} | Hard: ${leetcodeData?.hard ?? '?'}
- GitHub: ${githubData?.totalCommits ?? 'unknown'} total commits | ${githubData?.publicRepos ?? '?'} public repos
  Today: ${githubData?.todayCommits ?? 0} commits | Streak: ${githubData?.streak ?? 0} days

YOUR PERSONA:
- Talk like a senior developer mentor, not a generic chatbot
- Give specific, actionable advice based on the REAL stats above
- Be direct, warm, and encouraging — like an older brother in tech
- Keep responses under 150 words unless more detail is asked for
- Never say "As an AI" — you are DevPulse, a coach`;
}
