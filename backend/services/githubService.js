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

  const activeDaysSet = new Set();

  for (const event of pushEvents) {
    const eventDate = event.created_at.split('T')[0];
    activeDaysSet.add(eventDate);
    
    const commitCount = event.payload.commits?.length || 0;
    if (eventDate === today) todayCommits += commitCount;
    else if (eventDate === yesterday) yesterdayCommits += commitCount;
  }

  const activeDays = activeDaysSet.size;
  
  // Calculate total commits from events as fallback
  const totalCommitsFromEvents = pushEvents.reduce((sum, ev) => sum + (ev.payload.commits?.length || 0), 0);

  return { todayCommits, yesterdayCommits, activeDays, totalCommitsFromEvents };
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

const cheerio = require('cheerio');

const fetchTotalStatsFromProfile = async (username, fallbackCommits, fallbackActiveDays) => {
  try {
    const res = await fetch(`https://github.com/users/${username}/contributions`);
    if (res.ok) {
      const html = await res.text();
      const $ = cheerio.load(html);
      
      // 1. Get Total Contributions (Commits, PRs, etc.)
      const text = $('h2.f4.text-normal.mb-2').text().trim();
      const match = text.match(/([\d,]+)\s+contributions/);
      const totalCommits = match ? parseInt(match[1].replace(/,/g, ''), 10) : fallbackCommits;

      // 2. Get Active Days (days with > 0 contributions)
      let activeDays = 0;
      $('[data-level]').each((i, el) => {
        if ($(el).attr('data-level') !== '0') activeDays++;
      });
      if (activeDays === 0) activeDays = fallbackActiveDays;

      return { totalCommits, activeDays };
    }
    
    // Fallback to the search API if scraping fails
    const searchRes = await fetch(
      `https://api.github.com/search/commits?q=author:${username}`,
      { headers: getGithubHeaders() }
    );
    if (searchRes.ok) {
      const data = await searchRes.json();
      return { totalCommits: data.total_count || fallbackCommits, activeDays: fallbackActiveDays };
    }
    return { totalCommits: fallbackCommits, activeDays: fallbackActiveDays };
  } catch {
    return { totalCommits: fallbackCommits, activeDays: fallbackActiveDays };
  }
};

const getGithubStats = async (username) => {
  // 1. Fetch Profile
  const profile = await fetchUserProfile(username);
  
  // 2. Fetch Events & Calculate Fallback Stats
  const events = await fetchUserEvents(username);
  const { todayCommits, yesterdayCommits, activeDays: fallbackActiveDays, totalCommitsFromEvents } = calculateCommitStats(events);
  
  // 3. Fetch Languages & Scrape Total Stats in Parallel
  const [languages, profileStats] = await Promise.all([
    fetchTopLanguages(username, profile.public_repos),
    fetchTotalStatsFromProfile(username, totalCommitsFromEvents, fallbackActiveDays)
  ]);

  return {
    username: profile.login,
    avatarUrl: profile.avatar_url,
    publicRepos: profile.public_repos || 0,
    totalCommits: profileStats.totalCommits,
    todayCommits,
    yesterdayCommits,
    activeDays: profileStats.activeDays,
    languages,
  };
};

module.exports = {
  getGithubStats
};
