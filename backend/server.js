require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const cookieParser = require('cookie-parser');

const authRoutes    = require('./routes/auth');
const aiRoutes      = require('./routes/ai');
const githubRoutes  = require('./routes/github');
const leetcodeRoutes = require('./routes/leetcode');

// ─── App Setup ────────────────────────────────────────────────────────────────

const app = express();
const { redis } = require('./config/redis');
app.set('redis', redis);

const allowedOrigins = [
  "https://ai-dev-pulse.vercel.app",
  "http://localhost:5173"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

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

// ─── Fallback & Error Handlers (Always JSON) ─────────────────────────────────

// 404 Fallback
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

// Global Error Handler (Prevents Express default HTML error pages)
app.use((err, req, res, next) => {
  console.error('❌ Express server error:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

// ─── Start Server ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

