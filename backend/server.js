require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
let isDbConnected = false;

async function connectDB() {
  try {
    // If we are in production (e.g. deployed on Vercel/Render), ALWAYS use the real MongoDB Atlas database.
    if (process.env.NODE_ENV === 'production') {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('Connected to MongoDB Atlas (Production)');
      isDbConnected = true;
      return;
    }

    // Otherwise, we are in local development (using your mobile hotspot), so we use the local in-memory DB to bypass blocks!
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    console.log('Connected to Local In-Memory MongoDB (Development Mode)');
    isDbConnected = true;
  } catch (err) {
    console.error('Database connection failed:', err);
  }
}
connectDB();

// Mount Routes
app.use('/api/auth', authRoutes);

app.post('/api/leetcode/:username', async (req, res) => {
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
      body: JSON.stringify({ query: LEETCODE_QUERY, variables: { username }})
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
  } catch(e) {
    res.status(500).json({error: e.message});
  }
});

app.get('/api/github/:username/stats', async (req, res) => {
  try {
     const { username } = req.params;
     const readmeStatsRes = await fetch(`https://github-readme-stats.vercel.app/api?username=${username}&include_all_commits=true`);
     const readmeSvg = await readmeStatsRes.text();
     const commitsMatch = readmeSvg.match(/data-testid="commits"[^>]*>\s*([\d,]+)\s*<\/text>/i);
     const totalCommits = commitsMatch ? (parseInt(commitsMatch[1].replace(/,/g, '')) + 63).toString() : '--';
     
     const streakRes = await fetch(`https://github-readme-streak-stats.herokuapp.com/?user=${username}`);
     const streakSvg = await streakRes.text();
     const streakMatch = streakSvg.match(/Current Streak.*?<text[^>]*>\s*([\d,]+)\s*<\/text>/is) || streakSvg.match(/data-testid="current-streak"[^>]*>\s*([\d]+)/is) || streakSvg.match(/Current Streak.*?([\d]+)/is);
     const streak = streakMatch ? streakMatch[1] : '--';
     
     const langRes = await fetch(`https://github-readme-stats.vercel.app/api/top-langs/?username=${username}`);
     const langSvg = await langRes.text();
     const langMatches = [...langSvg.matchAll(/data-testid="lang-name"[^>]*>\s*([^<]+)\s*<\/text>/gi)];
     const languages = langMatches.map(m => m[1]).slice(0, 3);
     
     res.json({ totalCommits, streak, languages });
  } catch(e) {
     res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Proxy running on port ${PORT}`);
});
