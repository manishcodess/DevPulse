import { useState, useEffect, useCallback } from 'react';
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

  const fetchGithubData = async (forceFresh = false) => {
    const username = userCredentials?.github;
    if (!username) return null;

    const cacheKey = `devpulse-github-${username}`;
    if (forceFresh) {
      try { localStorage.removeItem(cacheKey); } catch (e) {}
    } else {
      const cached = getCachedData(cacheKey);
      if (cached) {
        setGithubData(cached);
        showToast('GitHub data loaded from cache ✓');
        return cached;
      }
    }

    try {
      const url = forceFresh 
        ? `${API_BASE_URL}/github/${username}/stats?fresh=true` 
        : `${API_BASE_URL}/github/${username}/stats`;
      const res = await apiFetch(url, { credentials: 'include' });
      const data = await res.json();
      setCachedData(cacheKey, data);
      setGithubData(data);
      showToast(forceFresh ? 'GitHub data refreshed ✓' : 'GitHub data loaded !');
      return data;
    } catch (err) {
      showToast(`Could not load GitHub data: ${err.message}`, 'error');
      const fallback = { error: true, totalCommits: '--', publicRepos: '--', streak: 0, languages: [] };
      setGithubData(fallback);
      return fallback;
    }
  };

  const fetchLeetcodeData = async (forceFresh = false) => {
    const username = userCredentials?.leetcode;
    if (!username) return null;

    const cacheKey = `devpulse-leetcode-${username}`;
    if (forceFresh) {
      try { localStorage.removeItem(cacheKey); } catch (e) {}
    } else {
      const cached = getCachedData(cacheKey);
      if (cached) {
        setLeetcodeData(cached);
        showToast('LeetCode data loaded from cache ✓');
        return cached;
      }
    }

    try {
      const url = forceFresh 
        ? `${API_BASE_URL}/leetcode/${username}?fresh=true` 
        : `${API_BASE_URL}/leetcode/${username}`;
      const res = await apiFetch(url, { method: 'POST', credentials: 'include' });
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
      setCachedData(cacheKey, formatted);
      setLeetcodeData(formatted);
      showToast(forceFresh ? 'LeetCode data refreshed ✓' : 'LeetCode data loaded ✓');
      return formatted;
    } catch (err) {
      showToast(`Could not load LeetCode data: ${err.message}`, 'error');
      const fallback = { error: true, total: '--', easy: '--', medium: '--', hard: '--', rating: '--', top: '--', globalRank: '--', highestRating: '--', streak: 0 };
      setLeetcodeData(fallback);
      return fallback;
    }
  };

  const generateDailyBrief = async (forceFresh = false) => {
    const firstName = userCredentials?.name?.split(' ')[0] || 'Developer';
    setBriefLoading(true);

    try {
      const text = await fetchDailyBrief(forceFresh);
      setDailyBrief(text);
      showToast(forceFresh ? 'Daily brief updated ✓' : 'Daily brief ready !');
    } catch (err) {
      console.error('Failed to generate daily brief:', err);
      setDailyBrief(`Ready to level up today, ${firstName}? Let's focus on consistent progress.`);
    } finally {
      setBriefLoading(false);
    }
  };

  const refetchData = useCallback(async (forceFresh = true) => {
    if (!userCredentials) return;
    setBriefLoading(true);
    if (forceFresh) {
      showToast('Clearing cache and fetching latest info...', 'info');
    }
    await Promise.all([fetchGithubData(forceFresh), fetchLeetcodeData(forceFresh)]);
    await generateDailyBrief(forceFresh);
    if (forceFresh) {
      showToast('Cache cleared & latest data fetched successfully!', 'success');
    }
  }, [userCredentials]);

  useEffect(() => {
    setGithubData(null);
    setLeetcodeData(null);

    if (!userCredentials) {
      setBriefLoading(false);
      return;
    }

    refetchData(false);
  }, [userCredentials, refetchData]);

  return { githubData, leetcodeData, dailyBrief, briefLoading, refetchData };
}