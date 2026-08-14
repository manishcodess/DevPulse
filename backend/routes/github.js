const express = require('express');
const { getCache, setCache } = require('../config/redis');
const { getGithubStats } = require('../services/githubService');
const router = express.Router();

// GET /api/github/:username/stats
// Fetches public GitHub profile stats for a given username (with 1-hour Redis caching)
router.get('/:username/stats', async (req, res) => {
  try {
    const { username } = req.params;
    const cacheKey = `cache:github:${username}`;

    // 1. Check Redis cache first (DISABLED FOR TESTING)
    // const cachedData = await getCache(cacheKey);
    // if (cachedData) {
    //   return res.json(cachedData);
    // }

    // 2. Fetch fresh data using the Service Layer
    const result = await getGithubStats(username);

    // 3. Save result to Redis (TTL 1 hour) and respond
    await setCache(cacheKey, result, 3600);
    res.json(result);
  } catch (error) {
    // 4. Centralized Error Handling
    console.error(`Error fetching GitHub stats for ${req.params.username}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
