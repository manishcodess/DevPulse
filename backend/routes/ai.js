const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const { verifyToken } = require('../middleware/authMiddleware');
const {
  buildSystemPrompt,
  buildDailyBriefPrompt,
  buildResumeJdMatchPrompt,
  extractMemoryAndTitleFromChat
} = require('../services/aiPromptService');

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

// ─── POST /api/ai/resume-match (ATS Match & Gap Analysis) ─────────────────────
router.post('/resume-match', verifyToken, async (req, res) => {
  try {
    const { contents, jobDescription, textContent } = req.body;
    if (!contents && !textContent) {
      return res.status(400).json({ error: "Missing resume contents" });
    }

    const promptText = buildResumeJdMatchPrompt(textContent || '', jobDescription || '');

    let finalContents;
    if (Array.isArray(contents)) {
      const inlineParts = contents.filter(part => part && part.inlineData);
      finalContents = [...inlineParts, { text: promptText }];
    } else if (contents && typeof contents === 'object' && contents.inlineData) {
      finalContents = [contents, { text: promptText }];
    } else {
      finalContents = promptText;
    }

    const result = await ai.models.generateContent({
      model: AI_MODEL,
      contents: finalContents,
      config: {
        responseMimeType: 'application/json',
      }
    });

    let parsedResult;
    try {
      parsedResult = JSON.parse(result.text);
    } catch {
      const cleaned = result.text.replace(/```json\n?|\n?```/g, '').trim();
      parsedResult = JSON.parse(cleaned);
    }

    // Auto-update user's resumeContext so AI chat mentor retains the target role & gaps
    if (req.userId) {
      try {
        const summaryContext = `TARGET ROLE: ${parsedResult.targetRoleIdentified || jobDescription || 'Software Engineer'}\nATS MATCH SCORE: ${parsedResult.matchScore}/100 (${parsedResult.matchTier || 'Evaluated'})\nMATCHING SKILLS: ${(parsedResult.matchingSkills || []).join(', ')}\nMISSING REQUIRED SKILLS: ${(parsedResult.missingSkills || []).join(', ')}\nVERDICT: ${parsedResult.verdict || ''}`;
        
        const updates = { resumeContext: summaryContext };
        if (parsedResult.targetRoleIdentified) {
          updates.targetRole = parsedResult.targetRoleIdentified;
        }
        await User.findByIdAndUpdate(req.userId, updates);
      } catch (saveErr) {
        console.warn('Could not auto-save resumeContext to user profile:', saveErr.message);
      }
    }

    res.json({ success: true, data: parsedResult });
  } catch (error) {
    console.error('Error in /resume-match:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze resume with target job description' });
  }
});

// ─── POST /api/ai/chat (Super Simple Text Streaming with Multi-Thread Persistence) ───
router.post('/chat', verifyToken, async (req, res) => {
  const { contents, conversationId, activeCategory } = req.body;
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

  let fullAiResponse = '';

  try {
    const systemInstruction = await buildSystemPrompt(req.userId, activeCategory || 'general');

    const stream = await ai.models.generateContentStream({
      model: AI_MODEL,
      contents,
      config: { systemInstruction },
    });

    // Send text chunks directly to client as they arrive
    for await (const chunk of stream) {
      if (chunk.text) {
        fullAiResponse += chunk.text;
        res.write(chunk.text);
        if (typeof res.flush === 'function') {
          res.flush();
        }
      }
    }

    res.end(); // Finish response stream

    // ─── Post-Stream Background Actions (Persistence & Auto Evolution) ────────
    // Find or locate conversation and persist latest user message + AI response
    (async () => {
      try {
        let convId = conversationId;
        let lastUserText = '';

        if (Array.isArray(contents) && contents.length > 0) {
          const lastItem = contents[contents.length - 1];
          if (lastItem.parts && lastItem.parts[0]?.text) {
            lastUserText = lastItem.parts[0].text;
          }
        }

        if (convId) {
          const conv = await Conversation.findOne({ _id: convId, userId: req.userId });
          if (conv) {
            const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            // Check if last message was already user text
            const hasUserMsg = conv.messages.some(
              m => m.role === 'user' && m.content === lastUserText
            );

            const newMessages = [];
            if (!hasUserMsg && lastUserText) {
              newMessages.push({ role: 'user', content: lastUserText, timestamp: timeNow });
            }
            if (fullAiResponse) {
              newMessages.push({ role: 'ai', content: fullAiResponse, timestamp: timeNow });
            }

            if (newMessages.length > 0) {
              await Conversation.findByIdAndUpdate(convId, {
                $push: { messages: { $each: newMessages } },
                $set: { updatedAt: new Date() }
              });
            }
          }
        }

        // Trigger memory extraction and automatic title refinement in background
        if (lastUserText && fullAiResponse) {
          await extractMemoryAndTitleFromChat(req.userId, convId, lastUserText, fullAiResponse);
        }
      } catch (bgErr) {
        console.warn('Background message save/memory extraction error:', bgErr.message);
      }
    })();

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
