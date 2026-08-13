const express = require('express');
const { getCache, setCache } = require('../config/redis');
const router = express.Router();

const LEETCODE_QUERY = `
  query getUserProfile($username: String!) {
    matchedUser(username: $username) {
      submitStats {
        acSubmissionNum {
          difficulty
          count
        }
      }
    }
    userContestRanking(username: $username) {
      rating
      globalRanking
      topPercentage
    }
    userContestRankingHistory(username: $username) {
      rating
    }
  }
`;

// POST /api/leetcode/:username
// Fetches LeetCode statistics with 1-hour Redis caching
router.post('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const cacheKey = `cache:leetcode:${username}`;

    // 1. Check Redis cache first
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    // 2. Fetch fresh data from LeetCode GraphQL API
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://leetcode.com/',
      },
      body: JSON.stringify({ query: LEETCODE_QUERY, variables: { username } }),
    });

    const rawText = await response.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      return res.status(502).json({ error: 'LeetCode API is currently unavailable or blocking requests' });
    }

    if (data.errors || !data.data?.matchedUser) {
      return res.status(404).json({ error: 'LeetCode user not found' });
    }

    const stats = data.data.matchedUser.submitStats.acSubmissionNum;
    const contest = data.data.userContestRanking;
    const history = data.data.userContestRankingHistory;

    let highestRating = null;
    if (history && Array.isArray(history) && history.length > 0) {
      const ratings = history.map(h => h.rating).filter(r => r > 0);
      if (ratings.length > 0) highestRating = Math.round(Math.max(...ratings));
    }

    const result = {
      total:  stats.find(s => s.difficulty === 'All')?.count    || 0,
      easy:   stats.find(s => s.difficulty === 'Easy')?.count   || 0,
      medium: stats.find(s => s.difficulty === 'Medium')?.count || 0,
      hard:   stats.find(s => s.difficulty === 'Hard')?.count   || 0,
      rating: contest ? Math.round(contest.rating) : null,
      top: contest ? contest.topPercentage : null,
      globalRank: contest ? contest.globalRanking : null,
      highestRating,
    };

    // 3. Save to Redis cache (1 hour) and send response
    await setCache(cacheKey, result, 3600);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
