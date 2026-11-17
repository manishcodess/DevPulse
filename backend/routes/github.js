const express = require('express');
const { fetchWithCache } = require('../config/redis');
const { getGithubStats } = require('../services/githubService');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

// GET /api/github/:username/stats
// Fetches public GitHub profile stats for a given username (with 1-hour Redis caching)
router.get('/:username/stats', verifyToken, async (req, res) => {
  try {
    const { username } = req.params;
    const bypassCache = req.query.fresh === 'true';

    const result = await fetchWithCache(
      `cache:github:${username}`,
      () => getGithubStats(username),
      3600,
      bypassCache
    );

    res.json(result);
  } catch (error) {
    console.error(`Error fetching GitHub stats for ${req.params.username}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
