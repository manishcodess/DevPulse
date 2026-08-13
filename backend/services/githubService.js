const getGithubHeaders = () => {
  const headers = {};
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
};

const fetchUserProfile = async (username) => {
  const res = await fetch(`https://api.github.com/users/${username}`, { headers: getGithubHeaders() });
  if (!res.ok) throw new Error('GitHub user not found or rate limited');
  return res.json();
};

const fetchUserEvents = async (username) => {
  const res = await fetch(`https://api.github.com/users/${username}/events`, { headers: getGithubHeaders() });
  if (!res.ok) return [];
  return res.json();
};

const calculateCommitStats = (events) => {
  const pushEvents = Array.isArray(events) ? events.filter(e => e.type === 'PushEvent') : [];
  
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let todayCommits = 0;
  let yesterdayCommits = 0;

  for (const event of pushEvents) {
    const eventDate = event.created_at.split('T')[0];
    const commitCount = event.payload.commits?.length || 0;
    if (eventDate === today) todayCommits += commitCount;
    else if (eventDate === yesterday) yesterdayCommits += commitCount;
  }

  const streak = todayCommits > 0 ? 1 : 0;
  
  // Calculate total commits from events as fallback
  const totalCommitsFromEvents = pushEvents.reduce((sum, ev) => sum + (ev.payload.commits?.length || 0), 0);

  return { todayCommits, yesterdayCommits, streak, totalCommitsFromEvents };
};

const fetchTopLanguages = async (username, publicRepos) => {
  const languages = new Set();
  if (publicRepos > 0) {
    try {
      const res = await fetch(
        `https://api.github.com/users/${username}/repos?sort=updated&per_page=10`,
        { headers: getGithubHeaders() }
      );
      if (res.ok) {
        const repos = await res.json();
        if (Array.isArray(repos)) {
          repos.forEach(repo => { if (repo.language) languages.add(repo.language); });
        }
      }
    } catch {
      // Skip on failure, keep languages empty
    }
  }
  return Array.from(languages);
};

const fetchTotalCommits = async (username, fallbackCommits) => {
  try {
    const res = await fetch(
      `https://api.github.com/search/commits?q=author:${username}`,
      { headers: getGithubHeaders() }
    );
    if (res.ok) {
      const data = await res.json();
      return data.total_count || fallbackCommits;
    }
    return fallbackCommits;
  } catch {
    return fallbackCommits;
  }
};

const getGithubStats = async (username) => {
  // 1. Fetch Profile
  const profile = await fetchUserProfile(username);
  
  // 2. Fetch Events & Calculate Stats
  const events = await fetchUserEvents(username);
  const { todayCommits, yesterdayCommits, streak, totalCommitsFromEvents } = calculateCommitStats(events);
  
  // 3. Fetch Languages & Total Commits in Parallel
  const [languages, totalCommits] = await Promise.all([
    fetchTopLanguages(username, profile.public_repos),
    fetchTotalCommits(username, totalCommitsFromEvents)
  ]);

  return {
    username: profile.login,
    avatarUrl: profile.avatar_url,
    publicRepos: profile.public_repos || 0,
    totalCommits,
    todayCommits,
    yesterdayCommits,
    streak,
    languages,
  };
};

module.exports = {
  getGithubStats
};
