const express = require('express');
const { getCache, setCache } = require('../config/redis');
const router = express.Router();

// GET /api/github/:username/stats
// Fetches public GitHub profile stats for a given username (with 1-hour Redis caching)
router.get('/:username/stats', async (req, res) => {
  try {
    const { username } = req.params;
    const cacheKey = `cache:github:${username}`;

    // 1. Check Redis cache first
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    // 2. Fetch fresh data from GitHub API if not in cache
    const headers = {};
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    // Fetch basic profile info
    const profileRes = await fetch(`https://api.github.com/users/${username}`, { headers });
    if (!profileRes.ok) throw new Error('GitHub user not found or rate limited');
    const profile = await profileRes.json();

    // Fetch recent events for commit counting
    const eventsRes = await fetch(`https://api.github.com/users/${username}/events`, { headers });
    const events = await eventsRes.json();
    const pushEvents = Array.isArray(events) ? events.filter(e => e.type === 'PushEvent') : [];

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let todayCommits = 0;
    let yesterdayCommits = 0;

    for (const event of pushEvents) {
      const eventDate = event.created_at.split('T')[0];
      const commitCount = event.payload.commits?.length || 0;
      if (eventDate === today) todayCommits += commitCount;
      else if (eventDate === yesterday) yesterdayCommits += commitCount;
    }

    const streak = todayCommits > 0 ? 1 : 0;

    // Fetch top languages
    const languages = new Set();
    if (profile.public_repos > 0) {
      try {
        const reposRes = await fetch(
          `https://api.github.com/users/${username}/repos?sort=updated&per_page=10`,
          { headers }
        );
        const repos = await reposRes.json();
        if (Array.isArray(repos)) {
          repos.forEach(repo => { if (repo.language) languages.add(repo.language); });
        }
      } catch {
        // Skip language parsing on failure
      }
    }

    // Fetch total commit count via search API
    let totalCommits = 0;
    try {
      const searchRes = await fetch(
        `https://api.github.com/search/commits?q=author:${username}`,
        { headers }
      );
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        totalCommits = searchData.total_count || 0;
      } else {
        totalCommits = pushEvents.reduce((sum, ev) => sum + (ev.payload.commits?.length || 0), 0);
      }
    } catch {
      totalCommits = pushEvents.reduce((sum, ev) => sum + (ev.payload.commits?.length || 0), 0);
    }

    const result = {
      username: profile.login,
      avatarUrl: profile.avatar_url,
      publicRepos: profile.public_repos || 0,
      totalCommits,
      todayCommits,
      yesterdayCommits,
      streak,
      languages: Array.from(languages),
    };

    // 3. Save result to Redis (TTL 1 hour) and respond
    await setCache(cacheKey, result, 3600);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
