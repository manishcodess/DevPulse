const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const { verifyToken } = require('../middleware/authMiddleware');
const { buildSystemPrompt, buildDailyBriefPrompt } = require('../services/aiPromptService');

const router = express.Router();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const AI_MODEL = 'gemini-3.1-flash-lite';

// ─── GET /api/ai/daily-brief ─────────────────────────────────────────────────
router.get('/daily-brief', verifyToken, async (req, res) => {
  try {
    const bypassCache = req.query.fresh === 'true';
    const prompt = await buildDailyBriefPrompt(req.userId, bypassCache);
    const result = await ai.models.generateContent({
      model: AI_MODEL,
      contents: prompt,
    });
    res.json({ text: result.text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/ai/generate (One-shot) ─────────────────────────────────────────
router.post('/generate', verifyToken, async (req, res) => {
  try {
    const { contents } = req.body;
    if (!contents) return res.status(400).json({ error: "Missing 'contents'" });

    const result = await ai.models.generateContent({
      model: AI_MODEL,
      contents,
    });

    res.json({ text: result.text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/ai/chat (Super Simple Text Streaming) ─────────────────────────
// Streams text chunks directly as Gemini generates them
router.post('/chat', verifyToken, async (req, res) => {
  const { contents } = req.body;
  if (!contents) return res.status(400).json({ error: "Missing 'contents'" });

  // Set streaming headers to disable any buffering in proxies / Node
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Transfer-Encoding', 'chunked');

  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  try {
    const systemInstruction = await buildSystemPrompt(req.userId);

    const stream = await ai.models.generateContentStream({
      model: AI_MODEL,
      contents,
      config: { systemInstruction },
    });

    // Send text chunks directly to client as they arrive
    for await (const chunk of stream) {
      if (chunk.text) {
        res.write(chunk.text);
        if (typeof res.flush === 'function') {
          res.flush();
        }
      }
    }

    res.end(); // Finish response stream
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    } else {
      res.write(`\n[Error: ${error.message}]`);
      res.end();
    }
  }
});

module.exports = router;
