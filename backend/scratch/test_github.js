const { getGithubStats } = require('../services/githubService');

async function test() {
  try {
    const stats = await getGithubStats('manishcodess');
    console.log(stats);
  } catch (err) {
    console.error(err);
  }
}

test();
