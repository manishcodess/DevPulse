require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const NodeCache = require('node-cache');
const authRoutes = require('./routes/auth');
const aiRoutes = require('./routes/ai');

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || '*'
}));
app.use(express.json());

// Initialize cache with 1 hour TTL
const cache = new NodeCache({ stdTTL: 3600 });

// Cache middleware
const cacheMiddleware = (keyPrefix) => (req, res, next) => {
  const { username } = req.params;
  const key = `${keyPrefix}-${username}`;
  const cachedData = cache.get(key);
  if (cachedData) {
    return res.json(cachedData);
  }
  res.sendResponse = res.json;
  res.json = (body) => {
    cache.set(key, body);
    res.sendResponse(body);
  };
  next();
};

// MongoDB Connection
let isDbConnected = false;

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');
    isDbConnected = true;
  } catch (err) {
    console.error('Database connection failed:', err);
  }
}
connectDB();

app.use((req, res, next) => {
  if (!isDbConnected && req.path.startsWith('/api/')) {
    return res.status(503).json({ error: 'Database not connected yet. Please try again in a few seconds.' });
  }
  next();
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);

app.post('/api/leetcode/:username', cacheMiddleware('leetcode'), async (req, res) => {
  try {
    const { username } = req.params;
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
      }
    `;

    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: LEETCODE_QUERY, variables: { username } })
    });

    const data = await response.json();

    if (data.errors) {
      return res.status(404).json({ error: "User not found" });
    }

    const stats = data.data.matchedUser.submitStats.acSubmissionNum;

    res.json({
      total: stats.find(s => s.difficulty === 'All')?.count || 0,
      easy: stats.find(s => s.difficulty === 'Easy')?.count || 0,
      medium: stats.find(s => s.difficulty === 'Medium')?.count || 0,
      hard: stats.find(s => s.difficulty === 'Hard')?.count || 0,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/github/:username/stats', cacheMiddleware('github'), async (req, res) => {
  try {
    const { username } = req.params;

    const githubHeaders = {};
    if (process.env.GITHUB_TOKEN) {
      githubHeaders['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    // 1. Get profile (repos & avatar)
    const profileRes = await fetch(`https://api.github.com/users/${username}`, { headers: githubHeaders });
    if (!profileRes.ok) throw new Error('Github rate limit or error');
    const profile = await profileRes.json();
    const publicRepos = profile.public_repos || 0;
    const avatarUrl = profile.avatar_url;

    // 2. Get events (today commits, yesterday commits, streak)
    const eventsRes = await fetch(`https://api.github.com/users/${username}/events`, { headers: githubHeaders });
    const events = await eventsRes.json();

    let todayCommits = 0;
    let yesterdayCommits = 0;
    let streak = 0;
    
    // Helper to format Date to YYYY-MM-DD
    const getFormattedDate = (date) => date.toISOString().split('T')[0];
    const currentDay = getFormattedDate(new Date());
    const prevDay = getFormattedDate(new Date(Date.now() - 86400000));

    const pushEvents = (Array.isArray(events) ? events : []).filter(e => e.type === 'PushEvent');
    
    for (const event of pushEvents) {
      const eventDate = event.created_at.split('T')[0];
      const commits = event.payload.commits ? event.payload.commits.length : 0;
      
      if (eventDate === currentDay) {
        todayCommits += commits;
      } else if (eventDate === prevDay) {
        yesterdayCommits += commits;
      }
    }
    
    if (todayCommits > 0) streak = 1;

    // 3. Get top languages from repos
    let languages = new Set();
    if (publicRepos > 0) {
      try {
        const reposRes = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=10`, { headers: githubHeaders });
        const repos = await reposRes.json();
        if (Array.isArray(repos)) {
          repos.forEach(r => { if (r.language) languages.add(r.language) });
        }
      } catch (e) {
        console.error("Could not fetch repos", e);
      }
    }

    // 4. Get total commits
    let totalCommits = 0;
    try {
      const searchRes = await fetch(`https://api.github.com/search/commits?q=author:${username}`, { headers: githubHeaders });
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        totalCommits = searchData.total_count || 0;
      } else {
        totalCommits = pushEvents.reduce((acc, ev) => acc + (ev.payload.commits?.length || 0), 0);
      }
    } catch (e) {
      totalCommits = pushEvents.reduce((acc, ev) => acc + (ev.payload.commits?.length || 0), 0);
    }

    res.json({
      username: profile.login,
      avatarUrl,
      publicRepos,
      totalCommits,
      todayCommits,
      yesterdayCommits,
      streak,
      languages: Array.from(languages)
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Proxy running on port ${PORT}`);
});
