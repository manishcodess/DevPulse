const express = require('express');
const { getCache, setCache } = require('../config/redis');
const { verifyToken } = require('../middleware/authMiddleware');
const { getLeetcodeStats } = require('../services/leetcodeService');
const router = express.Router();

// POST /api/leetcode/:username
// Fetches LeetCode statistics with 1-hour Redis caching
router.post('/:username', verifyToken, async (req, res) => {
  try {
    const { username } = req.params;
    const cacheKey = `cache:leetcode:${username}`;

    // 1. Check Redis cache first
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    // 2. Fetch fresh data from LeetCode Service
    const result = await getLeetcodeStats(username);

    // 3. Save to Redis cache (1 hour) and send response
    await setCache(cacheKey, result, 3600);
    res.json(result);
  } catch (error) {
    res.status(error.message.includes('unavailable') ? 502 : (error.message.includes('not found') ? 404 : 500)).json({ error: error.message });
  }
});

module.exports = router;
