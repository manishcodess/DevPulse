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

async function test(username) {
  try {
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://leetcode.com/',
      },
      body: JSON.stringify({ query: LEETCODE_QUERY, variables: { username } }),
    });
    const text = await response.text();
    console.log(`Response for ${username}:`, text.substring(0, 500));
  } catch (err) {
    console.error("Error:", err);
  }
}

test('priyadarshan62');
