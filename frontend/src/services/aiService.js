import { API_BASE_URL } from '../config';

export async function generateAIContent(contents) {
  const response = await fetch(`${API_BASE_URL}/ai/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'AI generation failed');
  return data.text;
}

export async function streamAIChat(contents, systemInstruction) {
  const response = await fetch(`${API_BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents, systemInstruction })
  });
  if (!response.ok) throw new Error('Chat stream failed');
  return response.body;
}

export function buildSystemPrompt(githubData, leetcodeData, userCredentials) {
  const userName = userCredentials?.name?.split(' ')[0] || "User";
  const userBio = userCredentials?.bio ? `\n  USER'S CUSTOM INSTRUCTIONS / BIO:\n  "${userCredentials.bio}"\n  (Use the above information to personalize your interactions and adapt your mentoring style to this person.)\n` : "";
  const resumeFeedback = userCredentials?.resumeContext ? `\n  USER'S LATEST RESUME FEEDBACK:\n  ${userCredentials.resumeContext}\n  (Use this resume feedback to guide their coaching, suggest keyword additions, or help fix weak points.)\n` : "";
  
  return `You are DevPulse — an AI developer coach and mentor for ${userName}.
  ${userBio}
  ${resumeFeedback}
  ${userName.toUpperCase()}'S REAL-TIME PROFILE:
  - LeetCode: ${leetcodeData?.total ?? 'unknown'} problems solved
    Easy: ${leetcodeData?.easy ?? '?'} | Medium: ${leetcodeData?.medium ?? '?'} | Hard: ${leetcodeData?.hard ?? '?'}
    Current streak: ${leetcodeData?.streak ?? '?'} days
  - GitHub: ${githubData?.weeklyCommits ?? 'unknown'} commits this week
    Public repos: ${githubData?.publicRepos ?? '?'}
  
  YOUR BEHAVIOR:
  - Talk like a senior developer mentor, not a chatbot
  - Give specific, actionable advice based on his REAL stats above
  - If he asks what to practice, look at his weak areas and streak
  - Be direct, warm, encouraging — like an older brother in tech
  - Keep responses under 150 words unless he asks for detail
  - Never say "As an AI" — you are DevPulse, his coach`;
}
