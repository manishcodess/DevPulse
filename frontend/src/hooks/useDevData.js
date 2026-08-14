import { useState, useEffect } from 'react';
import { fetchDailyBrief } from '../services/aiService';
import { getCachedData, setCachedData } from '../utils/storage';
import { API_BASE_URL } from '../config';
import { apiFetch } from '../utils/api';

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

    if (!userCredentials) {
      setBriefLoading(false);
      return;
    }

    setBriefLoading(true);
    let ignore = false;

    const fetchGithubData = async () => {
      const username = userCredentials?.github;
      if (!username) return null;

      const cacheKey = `devpulse-github-${username}`;
      const cached = getCachedData(cacheKey);
      if (cached) {
        if (!ignore) {
          setGithubData(cached);
          showToast('GitHub data loaded from cache ✓');
        }
        return cached;
      }

      try {
        const res = await apiFetch(`${API_BASE_URL}/github/${username}/stats`, { credentials: 'include' });
        const data = await res.json();
        if (!ignore) {
          setCachedData(cacheKey, data);
          setGithubData(data);
          showToast('GitHub data loaded !');
        }
        return data;
      } catch (err) {
        if (!ignore) {
          showToast(`Could not load GitHub data: ${err.message}`, 'error');
          const fallback = { error: true, totalCommits: '--', publicRepos: '--', streak: 0, languages: [] };
          setGithubData(fallback);
          return fallback;
        }
      }
    };

    const fetchLeetcodeData = async () => {
      const username = userCredentials?.leetcode;
      if (!username) return null;

      const cacheKey = `devpulse-leetcode-${username}`;
      const cached = getCachedData(cacheKey);
      if (cached) {
        if (!ignore) {
          setLeetcodeData(cached);
          showToast('LeetCode data loaded from cache ✓');
        }
        return cached;
      }

      try {
        const res = await apiFetch(`${API_BASE_URL}/leetcode/${username}`, { method: 'POST', credentials: 'include' });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        const formatted = { 
          total: data.total || 0, 
          easy: data.easy || 0, 
          medium: data.medium || 0, 
          hard: data.hard || 0, 
          rating: data.rating,
          top: data.top,
          globalRank: data.globalRank,
          highestRating: data.highestRating,
          recentSubmissions: data.recentSubmissions || [],
          streak: 0 
        };
        if (!ignore) {
          setCachedData(cacheKey, formatted);
          setLeetcodeData(formatted);
          showToast('LeetCode data loaded ✓');
        }
        return formatted;
      } catch (err) {
        if (!ignore) {
          showToast(`Could not load LeetCode data: ${err.message}`, 'error');
          const fallback = { error: true, total: '--', easy: '--', medium: '--', hard: '--', rating: '--', top: '--', globalRank: '--', highestRating: '--', streak: 0 };
          setLeetcodeData(fallback);
          return fallback;
        }
      }
    };

    const generateDailyBrief = async () => {
      const firstName = userCredentials?.name?.split(' ')[0] || 'Developer';

      try {
        const text = await fetchDailyBrief();
        if (!ignore) {
          setDailyBrief(text);
          showToast('Daily brief ready !');
        }
      } catch (err) {
        console.error('Failed to generate daily brief:', err);
        if (!ignore) {
          setDailyBrief(`Ready to level up today, ${firstName}? Let's focus on consistent progress.`);
        }
      } finally {
        if (!ignore) {
          setBriefLoading(false);
        }
      }
    };

    // Fetch both in parallel, then generate the brief once both resolve
    const initialize = async () => {
      await Promise.all([fetchGithubData(), fetchLeetcodeData()]);
      if (!ignore) {
        await generateDailyBrief();
      }
    };

    initialize();
    
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userCredentials]);

  return { githubData, leetcodeData, dailyBrief, briefLoading };
}