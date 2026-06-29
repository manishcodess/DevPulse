import { useState, useEffect } from 'react';
import { ai } from '../services/aiService';

export function useDevData(showToast, userCredentials = null) {
  const [githubData, setGithubData] = useState(null);
  const [leetcodeData, setLeetcodeData] = useState(null);
  const [gfgData, setGfgData] = useState({ total: 110, score: 290 });
  const [dailyBrief, setDailyBrief] = useState("");
  const [briefLoading, setBriefLoading] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchGithubData = async () => {
      try {
        const CACHE_KEY = 'devpulse-github-cache-v2';
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached && !userCredentials) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 15 * 60 * 1000) { // 15 mins cache
            setGithubData(data);
            return data;
          }
        }

        const username = userCredentials?.github || "manishcodess";
        const profileRes = await fetch(`https://api.github.com/users/${username}`);
        if(!profileRes.ok) throw new Error('Github rate limit or error');
        const profile = await profileRes.json();
        
        const eventsRes = await fetch(`https://api.github.com/users/${username}/events`);
        const events = await eventsRes.json();
        
        if (events.message && events.message.includes("API rate limit")) {
          showToast("GitHub API rate limit exceeded! Showing cached/partial data.", "error");
          console.warn("GitHub rate limit hit:", events.message);
        }
        
        let todayCommits = 0;
        let yesterdayCommits = 0;
        let streak = 0;
        let languages = new Set();
        let currentDay = new Date().toISOString().split('T')[0];

        const pushEvents = (Array.isArray(events) ? events : []).filter(e => e.type === 'PushEvent');
        
        for (const event of pushEvents) {
          const eventDate = event.created_at.split('T')[0];
          const commits = event.payload.commits ? event.payload.commits.length : 0;
          
          if (eventDate === currentDay) {
            todayCommits += commits;
          } else if (eventDate === new Date(Date.now() - 86400000).toISOString().split('T')[0]) {
            yesterdayCommits += commits;
          }
        }
        
        if (todayCommits > 0) streak = 1;

        if (profile.public_repos > 0) {
          try {
            const reposRes = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=10`);
            const repos = await reposRes.json();
            if (Array.isArray(repos)) {
              repos.forEach(r => { if(r.language) languages.add(r.language) });
            }
          } catch(e) {
            console.log("Could not fetch repos", e);
          }
        }

        const freshData = {
          username: profile.login,
          avatarUrl: profile.avatar_url,
          publicRepos: profile.public_repos || 0,
          totalCommits: pushEvents.reduce((acc, ev) => acc + (ev.payload.commits?.length || 0), 0),
          todayCommits,
          yesterdayCommits,
          streak,
          languages: Array.from(languages)
        };

        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: freshData, timestamp: Date.now() }));
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
        const CACHE_KEY = 'devpulse-leetcode-cache-v2';
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached && !userCredentials) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 15 * 60 * 1000) { // 15 mins cache
            setLeetcodeData(data);
            return data;
          }
        }

        const username = userCredentials?.leetcode || "manishsharmacodes";
        const solvedRes = await fetch(`/api/leetcode/${username}`, { method: 'POST' });
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

        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: freshData, timestamp: Date.now() }));
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
        const prompt = `You are a good, helping AI developer coach for Manish. Based on his recent activity:
   - GitHub Commits Today: \${ghData?.todayCommits || 0}
   - GitHub Commits Yesterday: \${ghData?.yesterdayCommits || 0}
   - Total DSA Questions: \${lcData?.total ?? 'unknown'} on leetcode+110 on gfg
   when tell total dsa q tell sum of leetcode+gfg both
   Give a brief status report about his consistency. DO NOT suggest what he should do today or give him advice.
   ONLY tell him if he is "consistent", "improving", or "inconsistent" based on today and yesterday's stats. Mention the exact commit/DSA numbers for those two days.
   If he didn't do any GitHub commits or DSA questions in BOTH days,() i know u are tired but its imp time like this). 
    Max 40 words. No emojis.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: prompt,
        });
        setDailyBrief(response.text);
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
  }, []);

  return { githubData, leetcodeData, gfgData, dailyBrief, briefLoading, errors };
}
        