require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes    = require('./routes/auth');
const aiRoutes      = require('./routes/ai');
const githubRoutes  = require('./routes/github');
const leetcodeRoutes = require('./routes/leetcode');

// ─── App Setup ────────────────────────────────────────────────────────────────

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

// ─── MongoDB Connection ───────────────────────────────────────────────────────

let isDbConnected = false;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    isDbConnected = true;
  })
  .catch((err) => console.error('❌ MongoDB connection failed:', err.message));

// Guard middleware — blocks API requests until MongoDB connection is established
app.use((req, res, next) => {
  if (!isDbConnected && req.path.startsWith('/api/')) {
    return res.status(503).json({ error: 'Server is starting up. Please try again in a moment.' });
  }
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/auth',     authRoutes);
app.use('/api/ai',       aiRoutes);
app.use('/api/github',   githubRoutes);
app.use('/api/leetcode', leetcodeRoutes);

// ─── Start Server ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
