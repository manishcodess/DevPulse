const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const { verifyToken } = require('../middleware/authMiddleware');
const { buildSystemPrompt } = require('../services/aiPromptService');

const router = express.Router();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const AI_MODEL = 'gemini-3.1-flash-lite';

// ─── POST /api/ai/generate (One-shot) ─────────────────────────────────────────
router.post('/generate', async (req, res) => {
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

  // Set header to plain text streaming
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');

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
      }
    }

    res.end(); // Finish response stream
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
