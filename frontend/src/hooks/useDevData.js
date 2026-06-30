import { useState, useEffect } from 'react';
import { generateAIContent } from '../services/aiService';
import { getCachedData, setCachedData } from '../utils/storage';
import { getTodayString, getYesterdayString } from '../utils/date';
import { API_BASE_URL } from '../config';

export function useDevData(showToast, userCredentials = null) {
  const [githubData, setGithubData] = useState(null);
  const [leetcodeData, setLeetcodeData] = useState(null);
  const [dailyBrief, setDailyBrief] = useState("");
  const [briefLoading, setBriefLoading] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Clear old data when user changes to prevent showing fallback info
    if (userCredentials) {
      setGithubData(null);
      setLeetcodeData(null);
    }
    
    const fetchGithubData = async () => {
      try {
        const username = userCredentials?.github;
        const CACHE_KEY = `devpulse-github-cache-v2-${username || 'anon'}`;
        
        if (!userCredentials) {
          const cached = getCachedData(CACHE_KEY, 15);
          if (cached) {
            setGithubData(cached);
            return cached;
          }
        }

        if (!username || username.trim() === '') {
          return null;
        }
        
        const res = await fetch(`${API_BASE_URL}/github/${username}/stats`);
        if (!res.ok) throw new Error('Github rate limit or error');
        
        const freshData = await res.json();

        setCachedData(CACHE_KEY, freshData);
        setGithubData(freshData);
        showToast("GitHub data loaded ✓");
        return freshData;
      } catch {
        setErrors(prev => ({...prev, github: true}));
        return null;
      }
    };

    const fetchLeetcodeData = async () => {
      try {
        const username = userCredentials?.leetcode;
        const CACHE_KEY = `devpulse-leetcode-cache-v2-${username || 'anon'}`;
        
        if (!userCredentials) {
          const cached = getCachedData(CACHE_KEY, 15);
          if (cached) {
            setLeetcodeData(cached);
            return cached;
          }
        }

        if (!username || username.trim() === '') {
          return null;
        }

        const solvedRes = await fetch(`${API_BASE_URL}/leetcode/${username}`, { method: 'POST' });
        if (!solvedRes.ok) throw new Error("Leetcode API error");
        const solvedData = await solvedRes.json();
        
        if (solvedData.error) throw new Error("Leetcode user not found");

        const freshData = {
          total: solvedData.total || 0,
          easy: solvedData.easy || 0,
          medium: solvedData.medium || 0,
          hard: solvedData.hard || 0,
          streak: 0
        };

        setCachedData(CACHE_KEY, freshData);
        setLeetcodeData(freshData);
        showToast("LeetCode data loaded ✓");
        return freshData;
      } catch {
        setErrors(prev => ({...prev, leetcode: true}));
        return null;
      }
    };

    const generateDailyBrief = async (ghData, lcData) => {
      try {
        const userName = userCredentials?.name?.split(' ')[0] || "User";
        const prompt = `You are DevPulse, an AI developer mentor.

Generate today's Daily Brief for the user using ONLY the provided real-time data.

User Data:
- Name: ${userName}
- GitHub commits today: ${ghData?.todayCommits || 0}
- GitHub commits yesterday: ${ghData?.yesterdayCommits || 0}
- Weekly commits: ${ghData?.weeklyCommits || 'unknown'}
- GitHub streak: ${ghData?.streak || 0}
- Total GitHub commits: ${ghData?.totalCommits || 0}

- LeetCode solved: ${lcData?.total || 0}
- Current DSA streak: ${lcData?.streak || 0}

- Goal: Land a 20+ LPA SDE role by 2026

Write the Daily Brief like a senior mentor checking in.

Requirements:

• Start by greeting the user by name.
• Mention one positive thing first, even if progress is small.
• Mention coding consistency based on today's and yesterday's activity.
• Mention total DSA progress naturally.
• If there was no activity today, acknowledge it without guilt.
• If the user is on a streak, celebrate it.
• If consistency is improving, mention it.
• If consistency is declining, mention it honestly but positively.
• End with ONE motivating sentence.

Never sound robotic.
Never list raw statistics.
Never use bullet points.
Never use generic motivational quotes.

The response should feel like it was written specifically for this developer.

Maximum 70 words.`;

        const text = await generateAIContent(prompt);
        setDailyBrief(text);
        showToast("Daily brief generated ✓");
      } catch {
        setDailyBrief("Ready to level up your skills today? Let's focus on the big picture.");
      } finally {
        setBriefLoading(false);
      }
    };
    
    const initializeApp = async () => {
      const [ghData, lcData] = await Promise.all([
        fetchGithubData(),
        fetchLeetcodeData()
      ]);
      generateDailyBrief(ghData, lcData);
    };

    initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userCredentials]);

  return { githubData, leetcodeData, dailyBrief, briefLoading, errors };
}
        