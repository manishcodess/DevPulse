

async function main() {
  const query = `
    query userContestRankingInfo($username: String!) {
      userContestRanking(username: $username) {
        rating
        globalRanking
        topPercentage
      }
    }
  `;
  try {
    const res = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://leetcode.com/',
      },
      body: JSON.stringify({ query, variables: { username: "priyadarshan62" } })
    });
    console.log(await res.json());
  } catch (err) {
    console.error(err);
  }
}
main();
