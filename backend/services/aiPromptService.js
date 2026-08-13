const { getCache } = require('../config/redis');
const User = require('../models/User');

const buildSystemPrompt = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const firstName = user.name?.split(' ')[0] || 'User';

  let githubData = null;
  let leetcodeData = null;

  // Try to fetch data from cache if usernames exist
  if (user.githubUsername) {
    const ghCache = await getCache(`cache:github:${user.githubUsername}`);
    if (ghCache) githubData = ghCache;
  }

  if (user.leetcodeUsername) {
    const lcCache = await getCache(`cache:leetcode:${user.leetcodeUsername}`);
    if (lcCache) leetcodeData = lcCache;
  }

  // Optional sections
  const bioSection = user.bio
    ? `\nUSER'S BIO / CUSTOM INSTRUCTIONS:\n"${user.bio}"\n`
    : '';

  const resumeSection = user.resumeContext
    ? `\nUSER'S LATEST RESUME FEEDBACK:\n${user.resumeContext}\n`
    : '';

  return `You are DevPulse — an AI developer coach and mentor for ${firstName}.
${bioSection}
${resumeSection}
${firstName.toUpperCase()}'S REAL-TIME STATS:
- LeetCode: ${leetcodeData?.total ?? 'unknown'} problems solved
  Easy: ${leetcodeData?.easy ?? '?'} | Medium: ${leetcodeData?.medium ?? '?'} | Hard: ${leetcodeData?.hard ?? '?'}
- GitHub: ${githubData?.totalCommits ?? 'unknown'} total commits | ${githubData?.publicRepos ?? '?'} public repos
  Today: ${githubData?.todayCommits ?? 0} commits | Streak: ${githubData?.streak ?? 0} days
-
YOUR PERSONA:
- Talk like a senior developer mentor, not a generic chatbot
- Give specific, actionable advice based on the REAL stats above
- Be direct, warm, and encouraging — like an older brother in tech
- Keep responses under 150 words unless more detail is asked for
-
- Never say "As an AI" — you are DevPulse, a coach`;
};

module.exports = {
  buildSystemPrompt
};
