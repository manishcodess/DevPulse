const { GoogleGenAI } = require('@google/genai');
const { getCache, setCache } = require('../config/redis');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const { getGithubStats } = require('./githubService');
const { getLeetcodeStats } = require('./leetcodeService');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const AI_MODEL = 'gemini-3.1-flash-lite';

const getOrFetchGithubData = async (username, bypassCache = false) => {
  if (!username) return null;
  const cacheKey = `cache:github:${username}`;
  let data = !bypassCache ? await getCache(cacheKey) : null;
  if (!data) {
    try {
      data = await getGithubStats(username);
      if (data) await setCache(cacheKey, data, 3600);
    } catch (err) {
      console.error(`Failed to fetch GitHub stats for ${username}:`, err.message);
    }
  }
  return data;
};

const getOrFetchLeetcodeData = async (username, bypassCache = false) => {
  if (!username) return null;
  const cacheKey = `cache:leetcode:${username}`;
  let data = !bypassCache ? await getCache(cacheKey) : null;
  if (!data) {
    try {
      data = await getLeetcodeStats(username);
      if (data) await setCache(cacheKey, data, 3600);
    } catch (err) {
      console.error(`Failed to fetch LeetCode stats for ${username}:`, err.message);
    }
  }
  return data;
};

/**
 * Builds a dynamic, context-evolving system prompt combining:
 * 1. Live GitHub & LeetCode developer telemetry
 * 2. Persistent Developer Memory Vector (Goals, Weaknesses, Strengths, Language)
 * 3. User Bio & ATS Resume Feedback
 * 4. Recent Cross-Thread Conversation Context & Active Topic
 */
const buildSystemPrompt = async (userId, activeCategory = 'general') => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const firstName = user.name?.split(' ')[0] || 'User';

  const [githubData, leetcodeData, recentConversations] = await Promise.all([
    getOrFetchGithubData(user.githubUsername),
    getOrFetchLeetcodeData(user.leetcodeUsername),
    Conversation.find({ userId })
      .select('title category summary updatedAt')
      .sort({ updatedAt: -1 })
      .limit(4)
      .lean()
      .catch(() => [])
  ]);

  // 1. Developer Memory & Profile Insights
  const memories = Array.isArray(user.devMemories) ? user.devMemories : [];
  const goals = memories.filter(m => m.category === 'goal').map(m => m.text);
  const weaknesses = memories.filter(m => m.category === 'weakness').map(m => m.text);
  const strengths = memories.filter(m => m.category === 'strength').map(m => m.text);
  const preferences = memories.filter(m => m.category === 'preference' || m.category === 'tech_stack' || m.category === 'general').map(m => m.text);

  let memorySection = '';
  const memoryLines = [];

  if (user.targetRole) {
    memoryLines.push(`- Target Role: ${user.targetRole}`);
  }
  if (user.targetCompanies && user.targetCompanies.length > 0) {
    memoryLines.push(`- Target Companies: ${user.targetCompanies.join(', ')}`);
  }
  if (user.preferredLanguage) {
    memoryLines.push(`- Preferred Programming / Interview Language: ${user.preferredLanguage}`);
  }
  if (goals.length > 0) {
    memoryLines.push(`- Active Goals: ${goals.join('; ')}`);
  }
  if (weaknesses.length > 0) {
    memoryLines.push(`- Known Weaknesses & Growth Areas: ${weaknesses.join('; ')}`);
  }
  if (strengths.length > 0) {
    memoryLines.push(`- Core Strengths & Proficiencies: ${strengths.join('; ')}`);
  }
  if (preferences.length > 0) {
    memoryLines.push(`- Developer Notes & Preferences: ${preferences.join('; ')}`);
  }

  if (memoryLines.length > 0) {
    memorySection = `\n[PERSISTENT DEVELOPER MEMORY & PROFILE INSIGHTS]\n(Use these persistent facts naturally to tailor your guidance and interview questions without repeating them mechanically):\n${memoryLines.join('\n')}\n`;
  }

  // 2. Cross-Thread Context Summary
  let crossThreadSection = '';
  if (recentConversations && recentConversations.length > 0) {
    const threadSummaries = recentConversations
      .map(c => `• "${c.title}" (${c.category || 'general'})${c.summary ? `: ${c.summary}` : ''}`)
      .join('\n');
    crossThreadSection = `\n[RECENT TOPICS & THREADS WORKED ON BY ${firstName.toUpperCase()}]:\n${threadSummaries}\n`;
  }

  // 3. Category-Specific Persona Tweaks
  let categoryGuidance = '';
  if (activeCategory === 'system_design') {
    categoryGuidance = `\n[ACTIVE FOCUS: SYSTEM DESIGN]\n- Think like a Principal Engineer / Tech Lead. Emphasize trade-offs, scalability bottlenecks, database choices (SQL vs NoSQL), caching layers, rate limiting, and CAP theorem nuances. Ask clarifying questions on RPS/data scale.`;
  } else if (activeCategory === 'dsa') {
    categoryGuidance = `\n[ACTIVE FOCUS: DATA STRUCTURES & ALGORITHMS]\n- Focus on pattern recognition (e.g., Two Pointers, Monotonic Stack, Sliding Window, DP memoization). Provide Big-O (Time and Space complexity) breakdowns. When user is stuck, prefer 3-tier progressive hints over dumping full solutions immediately.`;
  } else if (activeCategory === 'mock_interview') {
    categoryGuidance = `\n[ACTIVE FOCUS: MOCK INTERVIEW]\n- Actively simulate an interview environment. Present realistic problems, assess trade-offs, test edge cases, and ask follow-up questions just like a FAANG interviewer.`;
  } else if (activeCategory === 'resume') {
    categoryGuidance = `\n[ACTIVE FOCUS: RESUME & ATS OPTIMIZATION]\n- Emphasize STAR method bullets (Situation, Task, Action, Result), quantifiable scale metrics (e.g. latency, throughput, users), and alignment with target job descriptions.`;
  }

  // 4. Bio & Resume Context
  const bioSection = user.bio
    ? `\n[ABOUT ${firstName.toUpperCase()}]:\n"${user.bio}"\n`
    : '';

  const resumeSection = user.resumeContext
    ? `\n[${firstName.toUpperCase()}'S RESUME CONTEXT & FEEDBACK]:\n${user.resumeContext}\n`
    : '';

  return `You are DevPulse, a super smart study buddy and senior coding partner for ${firstName}.

[WHO YOU ARE & HOW YOU TALK]
- You are like that brilliant, friendly friend in college or at work who is always in your corner, knows tech inside out, and genuinely wants to see you win.
- Your tone is warm, relatable, encouraging, and honest. Talk just like a real person having a normal, 1-on-1 conversation.
- Use simple, everyday conversational English. Only bring in advanced technical terms (like time complexity, memoization, indexing, etc.) when you are explaining tech concepts where they are actually needed. No overly fancy, high-fi words or corporate jargon.
- When ${firstName} asks questions (DSA, tech concepts, coding, career, interviews), answer clearly, smartly, and directly just like a real engineer friend would. Make hard concepts easy to grasp.
- Appreciate wins: When they make progress, solve problems, or show consistency, genuinely hype them up and appreciate their effort.
- Gentle motivation on slow days: If they have low activity, missed streaks, or feel stuck, never shame or judge them. Instead, gently nudge them with kindness and belief: "Hey, I know you can do better!", "Off days happen, let's reset and get 1 small win today."
- Keep responses snappy, practical, and conversational (usually 100-200 words), unless ${firstName} asks for a deep code explanation, system design walkthrough, or debugging help.
- Absolute Rule: Never speak like a robot or say phrases like "As an AI language model." You are DevPulse, ${firstName}'s smart study buddy.
${bioSection}${resumeSection}${memorySection}${crossThreadSection}${categoryGuidance}
---
[REAL-TIME STATS FOR ${firstName.toUpperCase()}]
- GitHub: ${githubData?.totalCommits ?? 'Unknown'} total commits | ${githubData?.publicRepos ?? 'Unknown'} public repos
- Today's GitHub Activity: ${githubData?.todayCommits ?? 0} commits today | Total Active Days: ${githubData?.activeDays ?? 0} days
- LeetCode Solved: ${leetcodeData?.total ?? 'Unknown'} total (Easy: ${leetcodeData?.easy ?? '?'}, Medium: ${leetcodeData?.medium ?? '?'}, Hard: ${leetcodeData?.hard ?? '?'})
- LeetCode Recent Solved: ${leetcodeData?.recentSubmissions?.length > 0 ? leetcodeData.recentSubmissions.map(q => q.title).join(', ') : 'None fetched'}
---`;
};

const buildDailyBriefPrompt = async (userId, bypassCache = false) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const firstName = user.name?.split(' ')[0] || 'User';

  const githubData = await getOrFetchGithubData(user.githubUsername, bypassCache);
  const leetcodeData = await getOrFetchLeetcodeData(user.leetcodeUsername, bypassCache);

  return `You are DevPulse, ${firstName}'s smart study buddy and coding mentor.

TASK: Write a friendly, personalized "Daily Brief" for ${firstName} based on their real-time stats below.

[GITHUB ACTIVITY]
- Today's Commits: ${githubData?.todayCommits || 0}
- Yesterday's Commits: ${githubData?.yesterdayCommits || 0}
- Total Commits: ${githubData?.totalCommits || 0}
- Current Streak: ${githubData?.streak || 0} days

[LEETCODE PROGRESS]
- Easy: ${leetcodeData?.easy || 0} | Medium: ${leetcodeData?.medium || 0} | Hard: ${leetcodeData?.hard || 0}
- Total Solved: ${leetcodeData?.total || 0}

INSTRUCTIONS FOR THE BRIEF:
1. Warm Greeting: Start with a natural, friendly greeting to ${firstName}.
2. Honest & Kind Review: Look at their GitHub and LeetCode activity today vs yesterday.
   - If they did well or stayed consistent: Cheer them on and celebrate the effort!
   - If activity is slow or zero: Don't guilt-trip them. Gently remind them: "I know you can do better than this, let's turn it around today." Keep it motivating and encouraging.
3. One Smart Suggestion: Give 1 simple, practical tip or focus area for today (e.g. solve 1 medium question on sliding window, push 1 commit, or refine a resume project).
4. Uplifting Sign-off: End with an encouraging, real human parting sentence.
5. Format & Tone: Write in smooth, simple, natural conversational English. Keep it under 150-180 words. Do NOT use bullet points or robotic lists. Make it feel like a real text from a smart friend checking in.`;
};

const buildResumeJdMatchPrompt = (resumeText = '', jobDescription = '') => {
  const target = jobDescription.trim() || 'Software Engineer / Full-Stack Developer';

  return `You are DevPulse, an elite Tech Recruiter and Senior Staff Engineer specializing in ATS resume optimization and hiring bar evaluation.

TASK:
Perform a deep, highly practical ATS Match and Hard-Skill Gap Analysis by comparing the candidate's Resume against the Target Job Description / Target Role.

[TARGET JOB / ROLE]:
"""
${target}
"""

${resumeText ? `[CANDIDATE RESUME TEXT]:\n"""\n${resumeText.slice(0, 5000)}\n"""` : '[CANDIDATE RESUME]: See the attached PDF.'}

INSTRUCTIONS:
1. Evaluate semantic similarity, core stack alignment, domain requirements, and ATS keyword density.
2. Determine an accurate ATS Match Score (0 to 100).
   - >= 80%: Strong alignment with core and auxiliary stack.
   - 60% - 79%: Good foundation, but missing key domain frameworks, tools, or scale metrics.
   - < 60%: Significant stack or experience mismatch.
3. Identify 5-10 verified MATCHING skills found in both the resume and target role.
4. Identify 4-8 critical MISSING hard skills/keywords required or strongly favored by this role/company.
5. Provide 2-3 concrete STAR-method (Situation, Task, Action, Result) bullet point rewrites transforming generic/passive resume lines into quantifiable, high-impact bullets tailored to this target job.
6. Provide 2-4 actionable ATS & recruiter recommendations.

CRITICAL: Return ONLY valid JSON in the exact structure below, with no markdown code fences or other wrapper:
{
  "matchScore": 82,
  "matchTier": "Strong Match",
  "targetRoleIdentified": "${target.slice(0, 60).replace(/"/g, '')}",
  "verdict": "A concise, encouraging yet direct 1-2 sentence executive verdict of the resume fit for this role.",
  "matchingSkills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5"],
  "missingSkills": ["Missing Keyword 1", "Missing Keyword 2", "Missing Keyword 3", "Missing Keyword 4"],
  "strengths": [
    "Specific strength aligned with this target role",
    "Another specific strength"
  ],
  "weaknesses": [
    "Specific gap or area needing improvement for this role",
    "Another specific gap"
  ],
  "starBulletImprovements": [
    {
      "original": "Original passive or unquantified bullet from resume or typical resume",
      "improved": "High-impact STAR format bullet tailored for this role with quantifiable metrics"
    },
    {
      "original": "Another original bullet",
      "improved": "Optimized bullet with strong action verbs and concrete engineering impact"
    }
  ],
  "atsRecommendations": [
    "Actionable formatting or keyword recommendation 1",
    "Actionable recommendation 2"
  ]
}`;
};

/**
 * Asynchronous post-chat background analyzer:
 * 1. Analyzes whether the user disclosed new persistent facts (goals, weaknesses, tech stack, preferences, target companies).
 * 2. If new facts are found, auto-merges them into User.devMemories.
 * 3. Auto-titles the conversation if it currently has a default title.
 * 4. Updates conversation summary.
 */
const extractMemoryAndTitleFromChat = async (userId, conversationId, userMessage, aiResponse) => {
  try {
    if (!userId || !userMessage) return;

    const [user, conversation] = await Promise.all([
      User.findById(userId),
      conversationId ? Conversation.findById(conversationId) : null
    ]);

    if (!user) return;

    const isDefaultTitle = !conversation || !conversation.title || conversation.title === 'New Coaching Session' || conversation.title === 'New Chat';

    const prompt = `Analyze this chat exchange between a developer and their AI coach (DevPulse).

USER MESSAGE:
"""
${userMessage.slice(0, 1500)}
"""

AI RESPONSE:
"""
${(aiResponse || '').slice(0, 1000)}
"""

EXISTING USER MEMORIES:
${JSON.stringify((user.devMemories || []).map(m => m.text))}

TASK:
1. Extract any NEW persistent facts, goals, weaknesses, tech stack preferences, target companies, or interview targets revealed by the user in this message that are NOT already in Existing User Memories.
2. If this is the start of a conversation or needs a title, generate a concise, snappy 3-5 word title for this chat topic.
3. Provide a 1-sentence summary of what this chat thread is focusing on.

Return JSON in this exact structure with NO markdown fences:
{
  "newMemories": [
    {
      "category": "goal" | "weakness" | "strength" | "preference" | "tech_stack" | "general",
      "text": "Clear, concise fact about the user (e.g., 'Targeting Amazon SDE-2 by Q3', 'Struggles with DP on trees', 'Prefers code examples in TypeScript')"
    }
  ],
  "suggestedTitle": "3-5 word descriptive topic title",
  "category": "general" | "system_design" | "dsa" | "resume" | "mock_interview" | "career",
  "summary": "1-sentence summary of the discussion"
}`;

    const result = await ai.models.generateContent({
      model: AI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    let data;
    try {
      data = JSON.parse(result.text);
    } catch {
      const cleaned = result.text.replace(/```json\n?|\n?```/g, '').trim();
      data = JSON.parse(cleaned);
    }

    // 1. Merge new memories if found
    if (data && Array.isArray(data.newMemories) && data.newMemories.length > 0) {
      const existingTexts = new Set((user.devMemories || []).map(m => m.text.toLowerCase().trim()));
      const toAdd = [];

      for (const mem of data.newMemories) {
        if (!mem.text || typeof mem.text !== 'string') continue;
        const normalized = mem.text.toLowerCase().trim();
        // Ignore generic/too short strings
        if (normalized.length < 5 || existingTexts.has(normalized)) continue;

        toAdd.push({
          category: ['goal', 'weakness', 'strength', 'preference', 'tech_stack', 'general'].includes(mem.category) ? mem.category : 'general',
          text: mem.text.trim(),
          source: 'ai_extracted',
          confidence: 0.9,
          createdAt: new Date()
        });
        existingTexts.add(normalized);
      }

      if (toAdd.length > 0) {
        await User.findByIdAndUpdate(userId, {
          $push: { devMemories: { $each: toAdd } }
        });
      }
    }

    // 2. Update conversation title, summary & category
    if (conversation) {
      const updates = {};
      if (isDefaultTitle && data?.suggestedTitle) {
        updates.title = data.suggestedTitle.slice(0, 80);
      }
      if (data?.summary) {
        updates.summary = data.summary.slice(0, 200);
      }
      if (data?.category && conversation.category === 'general') {
        updates.category = data.category;
      }

      if (Object.keys(updates).length > 0) {
        await Conversation.findByIdAndUpdate(conversationId, updates);
      }
    }
  } catch (err) {
    console.warn('extractMemoryAndTitleFromChat non-critical error:', err.message);
  }
};

module.exports = {
  buildSystemPrompt,
  buildDailyBriefPrompt,
  buildResumeJdMatchPrompt,
  extractMemoryAndTitleFromChat
};
