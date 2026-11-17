const express = require('express');
const { fetchWithCache } = require('../config/redis');
const { verifyToken } = require('../middleware/authMiddleware');
const { getLeetcodeStats } = require('../services/leetcodeService');
const router = express.Router();

// POST /api/leetcode/:username
// Fetches LeetCode statistics with 1-hour Redis caching
router.post('/:username', verifyToken, async (req, res) => {
  try {
    const { username } = req.params;
    const bypassCache = req.query.fresh === 'true';

    const result = await fetchWithCache(
      `cache:leetcode:${username}`,
      () => getLeetcodeStats(username),
      3600,
      bypassCache
    );

    res.json(result);
  } catch (error) {
    const status = error.message.includes('unavailable') ? 502 : (error.message.includes('not found') ? 404 : 500);
    res.status(status).json({ error: error.message });
  }
});

module.exports = router;
