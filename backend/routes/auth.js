const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const User = require('../models/User');

const router = express.Router();

// ─── JWT Secret ───────────────────────────────────────────────────────────────
// In production, JWT_SECRET MUST be set via environment variable.
// In development, we fall back to a hardcoded string so you don't need to set it locally.
const JWT_SECRET =
  process.env.JWT_SECRET ||
  (process.env.NODE_ENV === 'production' ? null : 'devpulse_dev_secret');

if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set in production. Exiting.');
  process.exit(1);
}

// ─── Helper ───────────────────────────────────────────────────────────────────
// Formats a Mongoose User document into the shape the frontend expects.
// Defined once here so we don't repeat the same object literal 5 times.
const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  github: user.githubUsername,
  leetcode: user.leetcodeUsername,
  bio: user.bio,
  resumeContext: user.resumeContext,
});

// ─── Middleware ───────────────────────────────────────────────────────────────
// verifyToken runs BEFORE any protected route handler.
// It checks the Authorization header, verifies the JWT signature,
// and attaches the user's ID to req.userId so the route can use it.
//
// Header format expected: "Authorization: Bearer <token>"
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(403).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1]; // "Bearer <token>" → grab the token part
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid or expired token' });
    req.userId = decoded.id; // Attach the user ID so route handlers can use it
    next();
  });
};

// ─── POST /api/auth/signup ────────────────────────────────────────────────────
// Creates a new user account.
// Hashes the password with bcrypt before storing — we NEVER store plain-text passwords.
// Returns a JWT token + user data so the frontend can log them in immediately.
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if email is already registered
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    // bcrypt.hash(password, 10) — the 10 is the "salt rounds".
    // Higher = more secure but slower. 10 is the industry standard sweet spot.
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email, password: hashedPassword });

    // Sign a JWT that expires in 7 days.
    // The payload { id: user._id } is what we decode later in verifyToken.
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user: formatUser(user) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
// Verifies email + password and returns a new JWT token.
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // bcrypt.compare hashes the entered password and compares it to the stored hash.
    // We never "decrypt" the stored password — that's impossible by design.
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: formatUser(user) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
// Returns the currently logged-in user's data.
// Used on app load to restore session from a saved token in localStorage.
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: formatUser(user) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Zod Validation Schemas ───────────────────────────────────────────────────
// Zod validates the shape and types of incoming request bodies BEFORE touching the DB.
// If validation fails, Zod throws a ZodError — we catch it and return a 400.

const onboardSchema = z.object({
  githubUsername:  z.string().max(100).optional(),
  leetcodeUsername: z.string().max(100).optional(),
  bio:             z.string().max(500).optional(),
  resumeContext:   z.string().max(10000).optional(),
});

const resumeSchema = z.object({
  resumeContext: z.string().max(10000),
});

// ─── POST /api/auth/onboard ───────────────────────────────────────────────────
// Called after signup to link GitHub/LeetCode usernames.
// Validates both usernames against their real APIs before saving.
router.post('/onboard', verifyToken, async (req, res) => {
  try {
    const { githubUsername, leetcodeUsername, bio, resumeContext } =
      onboardSchema.parse(req.body); // Throws ZodError if input is invalid

    // Validate GitHub username exists (live API check)
    if (githubUsername) {
      const ghRes = await fetch(`https://api.github.com/users/${githubUsername}`, {
        headers: { 'User-Agent': 'DevPulse-App' },
      });
      if (ghRes.status === 404) {
        return res.status(400).json({ error: 'GitHub username not found' });
      }
    }

    // Validate LeetCode username exists (via GraphQL)
    if (leetcodeUsername) {
      const lcRes = await fetch('https://leetcode.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0',
          'Referer': 'https://leetcode.com/',
        },
        body: JSON.stringify({
          query: `query { matchedUser(username: "${leetcodeUsername}") { username } }`,
        }),
      });
      const lcText = await lcRes.text();
      try {
        const lcData = JSON.parse(lcText);
        if (lcData.errors || !lcData.data?.matchedUser) {
          return res.status(400).json({ error: 'LeetCode username not found' });
        }
      } catch {
        return res.status(400).json({ error: 'LeetCode API is currently unavailable' });
      }
    }

    // All validations passed — save to database
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.githubUsername  = githubUsername  ?? user.githubUsername;
    user.leetcodeUsername = leetcodeUsername ?? user.leetcodeUsername;
    if (bio !== undefined)           user.bio = bio;
    if (resumeContext !== undefined)  user.resumeContext = resumeContext;
    await user.save();

    res.json({ success: true, user: formatUser(user) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/auth/resume ────────────────────────────────────────────────────
// Saves the AI-generated resume analysis to the user's profile.
// This is then injected into the AI system prompt so the coach knows the resume state.
router.post('/resume', verifyToken, async (req, res) => {
  try {
    const { resumeContext } = resumeSchema.parse(req.body);

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.resumeContext = resumeContext;
    await user.save();

    res.json({ success: true, user: formatUser(user) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
