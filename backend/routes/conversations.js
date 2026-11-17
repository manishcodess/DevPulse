const express = require('express');
const Conversation = require('../models/Conversation');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Helper to format conversation consistently across endpoints
const formatConversation = (c, includeMessages = false) => {
  const lastMsg = c.messages?.length ? c.messages[c.messages.length - 1] : null;
  const base = {
    id: c._id,
    _id: c._id,
    title: c.title || 'New Coaching Session',
    category: c.category || 'general',
    pinned: !!c.pinned,
    tags: c.tags || [],
    summary: c.summary || '',
    updatedAt: c.updatedAt,
    createdAt: c.createdAt,
  };

  if (includeMessages) {
    base.messages = c.messages || [];
  } else {
    base.messageCount = c.messages ? c.messages.length : 0;
    base.lastMessageSnippet = lastMsg ? lastMsg.content.slice(0, 80) : '';
    base.lastMessageRole = lastMsg ? lastMsg.role : null;
  }

  return base;
};

// ─── GET /api/conversations ──────────────────────────────────────────────────
// Returns all chat threads for the logged-in user, sorted by pinned first, then recent
router.get('/', verifyToken, async (req, res) => {
  try {
    const conversations = await Conversation.find({ userId: req.userId })
      .select('title category pinned tags summary updatedAt createdAt messages')
      .sort({ pinned: -1, updatedAt: -1 })
      .lean();

    res.json({
      success: true,
      conversations: conversations.map(c => formatConversation(c, false))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/conversations ─────────────────────────────────────────────────
// Creates a new chat session
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, category, initialMessage } = req.body;

    const messages = [];
    if (initialMessage && initialMessage.content) {
      messages.push({
        role: initialMessage.role || 'user',
        content: initialMessage.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isDailyBrief: !!initialMessage.isDailyBrief
      });
    }

    const conversation = await Conversation.create({
      userId: req.userId,
      title: title?.trim() || 'New Coaching Session',
      category: category || 'general',
      messages,
      pinned: false
    });

    res.status(201).json({
      success: true,
      conversation: formatConversation(conversation, true)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /api/conversations/:id ──────────────────────────────────────────────
// Returns a single conversation with full message history
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({
      success: true,
      conversation: formatConversation(conversation, true)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── PATCH /api/conversations/:id ────────────────────────────────────────────
// Updates conversation metadata (title, pinned status, category, tags)
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const { title, pinned, category, tags } = req.body;

    const updates = {};
    if (typeof title === 'string') updates.title = title.trim();
    if (typeof pinned === 'boolean') updates.pinned = pinned;
    if (typeof category === 'string') updates.category = category;
    if (Array.isArray(tags)) updates.tags = tags;

    const conversation = await Conversation.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updates,
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({
      success: true,
      conversation: formatConversation(conversation, false)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── DELETE /api/conversations/:id ───────────────────────────────────────────
// Deletes a conversation thread
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const result = await Conversation.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!result) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ success: true, message: 'Conversation deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/conversations/:id/clear ───────────────────────────────────────
// Clears all messages in a conversation
router.post('/:id/clear', verifyToken, async (req, res) => {
  try {
    const conversation = await Conversation.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { messages: [] },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ success: true, message: 'Messages cleared', conversation: formatConversation(conversation, true) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
