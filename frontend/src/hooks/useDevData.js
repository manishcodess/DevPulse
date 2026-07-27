import { useState, useEffect } from 'react';
import { generateAIContent } from '../services/aiService';
import { getCachedData, setCachedData } from '../utils/storage';
import { API_BASE_URL } from '../config';

// useDevData fetches GitHub and LeetCode stats for the logged-in user,
// then uses that data to generate a personalized AI daily brief.
// It re-runs every time userCredentials changes (e.g. after login).
export function useDevData(showToast, userCredentials = null) {
  const [githubData, setGithubData]   = useState(null);
  const [leetcodeData, setLeetcodeData] = useState(null);
  const [dailyBrief, setDailyBrief]   = useState('');
  const [briefLoading, setBriefLoading] = useState(true);

  useEffect(() => {
    // Reset data when user changes so we don't briefly show the wrong person's stats
    setGithubData(null);
    setLeetcodeData(null);

    const fetchGithubData = async () => {
      const username = userCredentials?.github;
      if (!username) return null;

      // Check localStorage cache first (15-minute TTL) to avoid redundant API calls
      const cacheKey = `devpulse-github-${username}`;
      const cached = getCachedData(cacheKey, 15);
      if (cached) { setGithubData(cached); return cached; }

      try {
        const res = await fetch(`${API_BASE_URL}/github/${username}/stats`);
        if (!res.ok) throw new Error('GitHub fetch failed');
        const data = await res.json();
        setCachedData(cacheKey, data);
        setGithubData(data);
        showToast('GitHub data loaded ✓');
        return data;
      } catch {
        showToast('Could not load GitHub data', 'error');
        return null;
      }
    };

    const fetchLeetcodeData = async () => {
      const username = userCredentials?.leetcode;
      if (!username) return null;

      const cacheKey = `devpulse-leetcode-${username}`;
      const cached = getCachedData(cacheKey, 15);
      if (cached) { setLeetcodeData(cached); return cached; }

      try {
        // LeetCode route is POST because the backend calls LeetCode's GraphQL API
        const res = await fetch(`${API_BASE_URL}/leetcode/${username}`, { method: 'POST' });
        if (!res.ok) throw new Error('LeetCode fetch failed');
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        const formatted = { total: data.total || 0, easy: data.easy || 0, medium: data.medium || 0, hard: data.hard || 0, streak: 0 };
        setCachedData(cacheKey, formatted);
        setLeetcodeData(formatted);
        showToast('LeetCode data loaded ✓');
        return formatted;
      } catch {
        showToast('Could not load LeetCode data', 'error');
        return null;
      }
    };

    const generateDailyBrief = async (ghData, lcData) => {
      const firstName = userCredentials?.name?.split(' ')[0] || 'Developer';
      const prompt = `You are DevPulse, an AI developer mentor.

Generate a Daily Brief for ${firstName} using ONLY this real data:
- GitHub commits today: ${ghData?.todayCommits || 0}
- GitHub commits yesterday: ${ghData?.yesterdayCommits || 0}  
- Total GitHub commits: ${ghData?.totalCommits || 0}
- Current GitHub streak: ${ghData?.streak || 0} days
- LeetCode problems solved: ${lcData?.total || 0}

Rules:
- Start by greeting ${firstName} by name
- Mention one positive thing first, even if progress is small
- Comment on today's vs yesterday's activity honestly
- If on a streak, celebrate it; if no activity today, acknowledge it without guilt
- End with ONE motivating sentence
- Maximum 70 words — NO bullet points, NO raw numbers, write like a mentor

Never sound robotic. Write specifically for this developer.`;

      try {
        const text = await generateAIContent(prompt);
        setDailyBrief(text);
        showToast('Daily brief ready ✓');
      } catch {
        setDailyBrief("Ready to level up today? Let's focus on consistent progress.");
      } finally {
        setBriefLoading(false);
      }
    };

    // Fetch both in parallel, then generate the brief once both resolve
    const initialize = async () => {
      const [ghData, lcData] = await Promise.all([fetchGithubData(), fetchLeetcodeData()]);
      await generateDailyBrief(ghData, lcData);
    };

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userCredentials]);

  return { githubData, leetcodeData, dailyBrief, briefLoading };
}