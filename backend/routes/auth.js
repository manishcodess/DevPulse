const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const User = require('../models/User');

const router = express.Router();

const { verifyToken, JWT_SECRET } = require('../middleware/authMiddleware');

// ─── Helper ───────────────────────────────────────────────────────────────────
const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  github: user.githubUsername,
  leetcode: user.leetcodeUsername,
  bio: user.bio,
  resumeContext: user.resumeContext,
});

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};


// ─── POST /api/auth/signup ────────────────────────────────────────────────────
// Creates a new user account and sets HttpOnly cookie.
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('devpulse_token', token, COOKIE_OPTIONS);
    res.status(201).json({ token, user: formatUser(user) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
// Verifies email + password and sets HttpOnly cookie.
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('devpulse_token', token, COOKIE_OPTIONS);
    res.json({ token, user: formatUser(user) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
// Clears the HttpOnly authentication cookie.
router.post('/logout', (req, res) => {
  res.clearCookie('devpulse_token', COOKIE_OPTIONS);
  res.json({ success: true, message: 'Logged out successfully' });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
// Returns the currently logged-in user's data from cookie or token.
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
