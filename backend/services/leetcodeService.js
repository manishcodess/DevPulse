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
    recentAcSubmissionList(username: $username, limit: 5) {
      title
      titleSlug
      timestamp
    }
  }
`;

const getLeetcodeStats = async (username) => {
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
    throw new Error('LeetCode API is currently unavailable or blocking requests');
  }

  if (data.errors || !data.data?.matchedUser) {
    throw new Error('LeetCode user not found');
  }

  const stats = data.data.matchedUser.submitStats.acSubmissionNum;
  const contest = data.data.userContestRanking;
  const history = data.data.userContestRankingHistory;

  let highestRating = null;
  if (history && Array.isArray(history) && history.length > 0) {
    const ratings = history.map(h => h.rating).filter(r => r > 0);
    if (ratings.length > 0) highestRating = Math.round(Math.max(...ratings));
  }

  return {
    total:  stats.find(s => s.difficulty === 'All')?.count    || 0,
    easy:   stats.find(s => s.difficulty === 'Easy')?.count   || 0,
    medium: stats.find(s => s.difficulty === 'Medium')?.count || 0,
    hard:   stats.find(s => s.difficulty === 'Hard')?.count   || 0,
    rating: contest ? Math.round(contest.rating) : null,
    top: contest ? contest.topPercentage : null,
    globalRank: contest ? contest.globalRanking : null,
    highestRating,
    recentSubmissions: data.data.recentAcSubmissionList || [],
  };
};

module.exports = {
  getLeetcodeStats
};
