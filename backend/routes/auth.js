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
  targetRole: user.targetRole || '',
  targetCompanies: user.targetCompanies || [],
  preferredLanguage: user.preferredLanguage || '',
  memoryCount: Array.isArray(user.devMemories) ? user.devMemories.length : 0,
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
const onboardSchema = z.object({
  githubUsername:   z.string().max(100).optional().nullable(),
  leetcodeUsername: z.string().max(100).optional().nullable(),
  bio:              z.string().max(500).optional().nullable(),
  resumeContext:    z.string().max(10000).optional().nullable(),
  targetRole:       z.string().max(120).optional().nullable(),
  targetCompanies:  z.array(z.string().max(60)).optional().nullable(),
  preferredLanguage: z.string().max(60).optional().nullable(),
});

const resumeSchema = z.object({
  resumeContext: z.string().max(10000),
});

const memorySchema = z.object({
  text: z.string().min(2).max(300),
  category: z.enum(['goal', 'weakness', 'strength', 'preference', 'tech_stack', 'general']).default('general'),
  source: z.enum(['manual', 'ai_extracted']).default('manual'),
});

// ─── POST /api/auth/onboard ───────────────────────────────────────────────────
router.post('/onboard', verifyToken, async (req, res) => {
  try {
    const {
      githubUsername,
      leetcodeUsername,
      bio,
      resumeContext,
      targetRole,
      targetCompanies,
      preferredLanguage
    } = onboardSchema.parse(req.body);

    const trimmedGithub = typeof githubUsername === 'string' ? githubUsername.trim() : githubUsername;
    const trimmedLeetcode = typeof leetcodeUsername === 'string' ? leetcodeUsername.trim() : leetcodeUsername;

    // Validate GitHub username exists (live API check)
    if (trimmedGithub) {
      const ghRes = await fetch(`https://api.github.com/users/${trimmedGithub}`, {
        headers: { 'User-Agent': 'DevPulse-App' },
      });
      if (ghRes.status === 404) {
        return res.status(400).json({ error: 'GitHub username not found' });
      }
    }

    // Validate LeetCode username exists (via GraphQL)
    if (trimmedLeetcode) {
      const lcRes = await fetch('https://leetcode.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0',
          'Referer': 'https://leetcode.com/',
        },
        body: JSON.stringify({
          query: `query($username: String!) { matchedUser(username: $username) { username } }`,
          variables: { username: trimmedLeetcode },
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

    if (githubUsername !== undefined) user.githubUsername = trimmedGithub || '';
    if (leetcodeUsername !== undefined) user.leetcodeUsername = trimmedLeetcode || '';
    if (bio !== undefined) user.bio = bio ? bio.trim() : '';
    if (resumeContext !== undefined) user.resumeContext = resumeContext ? resumeContext.trim() : '';
    if (targetRole !== undefined) user.targetRole = targetRole ? targetRole.trim() : '';
    if (targetCompanies !== undefined) user.targetCompanies = targetCompanies || [];
    if (preferredLanguage !== undefined) user.preferredLanguage = preferredLanguage ? preferredLanguage.trim() : '';

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

// ─── GET /api/auth/memories ───────────────────────────────────────────────────
// Returns all developer memories and profile insights
router.get('/memories', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      success: true,
      devMemories: user.devMemories || [],
      targetRole: user.targetRole || '',
      targetCompanies: user.targetCompanies || [],
      preferredLanguage: user.preferredLanguage || '',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/auth/memories ──────────────────────────────────────────────────
// Adds a developer insight / memory fact
router.post('/memories', verifyToken, async (req, res) => {
  try {
    const { text, category, source } = memorySchema.parse(req.body);

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const newMemory = {
      text: text.trim(),
      category: category || 'general',
      source: source || 'manual',
      confidence: 1.0,
      createdAt: new Date(),
    };

    user.devMemories.push(newMemory);
    await user.save();

    res.status(201).json({
      success: true,
      devMemories: user.devMemories,
      added: user.devMemories[user.devMemories.length - 1],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// ─── DELETE /api/auth/memories/:memoryId ──────────────────────────────────────
// Removes a developer insight / memory fact
router.delete('/memories/:memoryId', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.devMemories = user.devMemories.filter(
      (m) => m._id.toString() !== req.params.memoryId
    );
    await user.save();

    res.json({ success: true, devMemories: user.devMemories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── PUT /api/auth/profile-insights ───────────────────────────────────────────
// Updates developer target role, target companies, and preferred language
router.put('/profile-insights', verifyToken, async (req, res) => {
  try {
    const { targetRole, targetCompanies, preferredLanguage } = req.body;

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (targetRole !== undefined) user.targetRole = (targetRole || '').trim();
    if (targetCompanies !== undefined) user.targetCompanies = Array.isArray(targetCompanies) ? targetCompanies : [];
    if (preferredLanguage !== undefined) user.preferredLanguage = (preferredLanguage || '').trim();

    await user.save();

    res.json({
      success: true,
      targetRole: user.targetRole,
      targetCompanies: user.targetCompanies,
      preferredLanguage: user.preferredLanguage,
      user: formatUser(user),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
