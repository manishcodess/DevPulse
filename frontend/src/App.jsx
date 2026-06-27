import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Zap, ExternalLink, Menu } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

function buildSystemPrompt(githubData, leetcodeData, gfgData) {
  return `You are DevPulse — an AI developer coach and mentor for Manish.
  
  MANISH'S REAL-TIME PROFILE:
  - LeetCode: ${leetcodeData?.total ?? 'unknown'} problems solved
    Easy: ${leetcodeData?.easy ?? '?'} | Medium: ${leetcodeData?.medium ?? '?'} | Hard: ${leetcodeData?.hard ?? '?'}
    Current streak: ${leetcodeData?.streak ?? '?'} days
  - GeeksforGeeks: ${gfgData?.total ?? 'unknown'} problems solved
    Overall Coding Score: ${gfgData?.score ?? '?'}
  - GitHub: ${githubData?.weeklyCommits ?? 'unknown'} commits this week
    Public repos: ${githubData?.publicRepos ?? '?'}
  - Goal: Land a 20+ LPA SDE role by 2026
  - College: IIIT Bhagalpur, Mechatronics branch (non-CS)
  - Skills: MERN stack, DSA in C++, Redis, Socket.IO, WebRTC, GenAI
  - Weak areas: Trees, Dynamic Programming, System Design
  
  YOUR BEHAVIOR:
  - Talk like a senior developer mentor, not a chatbot
  - Give specific, actionable advice based on his REAL stats above
  - If he asks what to practice, look at his weak areas and streak
  - Be direct, warm, encouraging — like an older brother in tech
  - Keep responses under 150 words unless he asks for detail
  - Never say "As an AI" — you are DevPulse, his coach`;
}

function App() {
  const [messages, setMessages] = useState([
    { 
      role: 'ai', 
      content: 'Hello, Manish. I am DevPulse, your AI developer coach. Let\'s crush those goals. What are we working on today?',
      timestamp: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [dailyBrief, setDailyBrief] = useState("");
  const [briefLoading, setBriefLoading] = useState(true);
  const [githubData, setGithubData] = useState(null);
  const [leetcodeData, setLeetcodeData] = useState(null);
  
  const [gfgData, setGfgData] = useState({ total: 110, score: 290 });

  const [activeTab, setActiveTab] = useState('chat');
  const [isPanelOpen, setIsPanelOpen] = useState(window.innerWidth > 768);
  const [resumeAnalysis, setResumeAnalysis] = useState("");
  const [resumeLoading, setResumeLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    document.title = messages.length > 1 
      ? `DevPulse (${messages.length - 1} msgs) — Your Dev Coach`
      : "DevPulse — Your Dev Coach";
  }, [messages]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        setActiveTab('chat');
        setTimeout(() => inputRef.current?.focus(), 10);
      } else if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        setActiveTab('resume');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);



  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      await analyzeResume(text);
    };
    reader.readAsText(file);
  };

  const analyzeResume = async (text) => {
    setResumeLoading(true);
    setResumeAnalysis("");
    try {
      const prompt = `You are a senior tech recruiter at a top product company.
      Analyze this resume for a fresher SDE role targeting 20+ LPA:
      
      ${text.slice(0, 3000)}
      
      Give feedback in exactly this format:
      SCORE: X/10
      
      STRONG POINTS (3 bullet points):
      - 
      
      WEAK POINTS (3 bullet points):
      - 
      
      MISSING KEYWORDS (comma separated, max 8):
      
      ONE LINE VERDICT:
      
      Be harsh but constructive. Focus on what a recruiter actually looks for.`;
      
      const result = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt
      });
      
      setResumeAnalysis(result.text);
      showToast("Resume analyzed ✓");
    } catch {
      setResumeAnalysis("SCORE: 0/10\n\nONE LINE VERDICT: Failed to analyze resume.");
      showToast("Failed to analyze resume", "error");
    } finally {
      setResumeLoading(false);
    }
  };

  const renderResumeAnalysis = (analysisText) => {
    if (!analysisText) return null;
    
    const scoreMatch = analysisText.match(/SCORE:\s*(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
    const scoreColor = score > 7 ? '#22c55e' : score >= 5 ? '#f59e0b' : '#ef4444';

    const strongMatch = analysisText.match(/STRONG POINTS[^\n]*\n([\s\S]*?)(?=WEAK POINTS)/i);
    const strongPoints = strongMatch ? strongMatch[1].split('\n').filter(p => p.trim().startsWith('-')) : [];

    const weakMatch = analysisText.match(/WEAK POINTS[^\n]*\n([\s\S]*?)(?=MISSING KEYWORDS)/i);
    const weakPoints = weakMatch ? weakMatch[1].split('\n').filter(p => p.trim().startsWith('-')) : [];

    const keywordMatch = analysisText.match(/MISSING KEYWORDS:?\s*([^\n]*)/i);
    const keywords = keywordMatch ? keywordMatch[1].split(',').map(k => k.trim()).filter(Boolean) : [];

    const verdictMatch = analysisText.match(/ONE LINE VERDICT:?\s*([^\n]*)/i);
    const verdict = verdictMatch ? verdictMatch[1] : "";

    return (
      <div className="resume-analysis-container">
        <div className="resume-score-card" style={{ borderColor: scoreColor }}>
          <div className="resume-score-label">Resume Score</div>
          <div className="resume-score-value" style={{ color: scoreColor }}>{score}/10</div>
        </div>
        
        <div className="resume-feedback-grid">
          <div className="feedback-card strong">
            <h3>Strong Points</h3>
            <ul>{strongPoints.map((p,i)=><li key={i}>{p.replace('-','').trim()}</li>)}</ul>
          </div>
          <div className="feedback-card weak">
            <h3>Areas to Improve</h3>
            <ul>{weakPoints.map((p,i)=><li key={i}>{p.replace('-','').trim()}</li>)}</ul>
          </div>
        </div>

        {keywords.length > 0 && (
          <div className="resume-keywords-section">
            <h3>Missing Keywords</h3>
            <div className="keyword-pills">
              {keywords.map((k,i)=><span key={i} className="pill pill-hard">{k}</span>)}
            </div>
          </div>
        )}

        {verdict && (
          <div className="resume-verdict-box">
            <strong>Verdict:</strong> {verdict}
          </div>
        )}
      </div>
    );
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  useEffect(() => {
    const fetchGithubData = async () => {
      try {
        const CACHE_KEY = 'devpulse-github-cache-v2';
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 15 * 60 * 1000) { // 15 mins cache
            setGithubData(data);
            return data;
          }
        }

        const username = "manishcodess";
        const profileRes = await fetch(`https://api.github.com/users/${username}`);
        if(!profileRes.ok) throw new Error('Github rate limit or error');
        const profile = await profileRes.json();
        
        const eventsRes = await fetch(`https://api.github.com/users/${username}/events`);
        const events = await eventsRes.json();
        
        if (events.message && events.message.includes("API rate limit")) {
          showToast("GitHub API rate limit exceeded! Showing cached/partial data.");
          console.warn("GitHub rate limit hit:", events.message);
        }
        
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentCommits = (events.length ? events : [])
          .filter(e => e.type === "PushEvent" && new Date(e.created_at) > sevenDaysAgo)
          .reduce((total, e) => total + (e.payload?.commits?.length || 0), 0);
          
        const todayLocal = new Date().toLocaleDateString();
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayLocal = yesterdayDate.toLocaleDateString();

        const todayCommits = (events.length ? events : [])
          .filter(e => e.type === "PushEvent" && new Date(e.created_at).toLocaleDateString() === todayLocal)
          .reduce((total, e) => total + (e.payload?.commits?.length || 0), 0);

        const yesterdayCommits = (events.length ? events : [])
          .filter(e => e.type === "PushEvent" && new Date(e.created_at).toLocaleDateString() === yesterdayLocal)
          .reduce((total, e) => total + (e.payload?.commits?.length || 0), 0);

          
        let totalCommits = '--', streak = '--', languages = [];
        try {
          const statsRes = await fetch(`/api/github/${username}/stats`);
          if (statsRes.ok) {
            const stats = await statsRes.json();
            totalCommits = stats.totalCommits;
            streak = stats.streak;
            languages = stats.languages;
          }
        } catch {
          console.warn("Please run 'node server.js' for extra GitHub stats");
        }
        
        const freshData = {
          username: profile.login,
          publicRepos: profile.public_repos,
          followers: profile.followers,
          weeklyCommits: recentCommits,
          todayCommits,
          yesterdayCommits,
          totalCommits: totalCommits,
          streak: streak,
          languages: languages,
          avatarUrl: profile.avatar_url
        };

        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: freshData, timestamp: Date.now() }));
        setGithubData(freshData);
        showToast("GitHub data loaded ✓");
        return freshData;
      } catch {
        setErrors(prev => ({...prev, github: true}));
        return null;
      }
    };

    const fetchLeetcodeData = async () => {
      try {
        const CACHE_KEY = 'devpulse-leetcode-cache';
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 15 * 60 * 1000) { // 15 mins cache
            setLeetcodeData(data);
            return data;
          }
        }

        const username = "manishsharmacodes";
        const solvedRes = await fetch(`/api/leetcode/${username}`, { method: 'POST' });
        if (!solvedRes.ok) throw new Error("Leetcode API error");
        const solvedData = await solvedRes.json();
        
        if (solvedData.error) throw new Error("Leetcode user not found");

        const freshData = {
          total: solvedData.total || 0,
          easy: solvedData.easy || 0,
          medium: solvedData.medium || 0,
          hard: solvedData.hard || 0,
          streak: 0
        };

        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: freshData, timestamp: Date.now() }));
        setLeetcodeData(freshData);
        showToast("LeetCode data loaded ✓");
        return freshData;
      } catch {
        setErrors(prev => ({...prev, leetcode: true}));
        return null;
      }
    };

    const generateDailyBrief = async (ghData, lcData) => {
      try {
        const prompt = `You are a tough, humorous AI developer coach for Manish. Based on his recent activity:
   - GitHub Commits Today: ${ghData?.todayCommits || 0}
   - GitHub Commits Yesterday: ${ghData?.yesterdayCommits || 0}
   - Total DSA Questions: ${lcData?.total ?? 'unknown'}
   
   Give a brief status report about his consistency. DO NOT suggest what he should do today or give him advice.
   ONLY tell him if he is "consistent", "improving", or "inconsistent" based on today and yesterday's stats. Mention the exact commit/DSA numbers for those two days.
   If he didn't do any GitHub commits or DSA questions in BOTH days, roast him with humorous criticism (e.g. "Are we building a startup or taking a nap?"). 
   Maintain a strict, humorous tone. Max 40 words. No emojis.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: prompt,
        });
        setDailyBrief(response.text);
        showToast("Daily brief generated ✓");
      } catch {
        setDailyBrief("Ready to level up your skills today? Let's focus on the big picture.");
      } finally {
        setBriefLoading(false);
      }
    };
    
    const initializeApp = async () => {
      const [ghData, lcData] = await Promise.all([
        fetchGithubData(),
        fetchLeetcodeData()
      ]);
      generateDailyBrief(ghData, lcData);
    };

    initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const SUGGESTED_PROMPTS = [
    "How do I get my first 20 LPA job?",
    "What mistakes should I avoid this year?",
    "How can I become more confident?",
    "What skill changed my career the most?",
    "How do I stop overthinking?"
  ];

  const scrollToBottom = () => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, isLoading, activeTab]);

  const submitMessage = async (userMessage) => {
    if (!userMessage.trim() || isLoading) return;

    const userTimestamp = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    setMessages((prev) => [...prev, { role: 'user', content: userMessage, timestamp: userTimestamp }]);
    setIsLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: userMessage,
        config: {
          systemInstruction: buildSystemPrompt(githubData, leetcodeData, gfgData),
        },
      });

      const aiTimestamp = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: response.text, timestamp: aiTimestamp }
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: `Sorry, I am having trouble connecting. Error: ${error.message}` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const userMessage = input.trim();
    setInput('');
    submitMessage(userMessage);
  };

  const handleSuggestedPrompt = (prompt) => {
    submitMessage(prompt);
  };

  return (
    <div className="layout-container">
      {toast && (
        <div className="toast-container" style={{ background: toast.type === 'success' ? '#166534' : '#7f1d1d' }}>
          {toast.msg}
        </div>
      )}
      <div 
        className={`mobile-overlay ${!isPanelOpen ? 'hidden' : ''}`}
        onClick={() => setIsPanelOpen(false)}
      />
      <aside className={`left-panel ${!isPanelOpen ? 'closed' : ''}`}>
        <div className="sidebar-logo-container">
          <div className="logo-icon-bg">
            <Zap size={20} color="#ffffff" />
          </div>
          <span className="logo-text">DevPulse</span>
        </div>

        <div className="user-profile-card">
          {githubData?.avatarUrl ? (
            <img src={githubData.avatarUrl} alt="avatar" style={{width: 40, height: 40, borderRadius: '50%'}} />
          ) : (
            <div className="user-avatar">M</div>
          )}
          <div className="user-info">
            <span className="user-name">{githubData?.username || "Manish"}</span>
            <span className="user-role">Full Stack Developer</span>
            <div className="user-status-container">
              <div className="status-dot"></div>
              <span className="status-text">Online</span>
            </div>
          </div>
        </div>

        <div className="integration-cards-container">
          {/* DEVELOPMENT CARD */}
          <div className="integration-card">
            <div className="card-header">
              <span className="card-label">💻 DEVELOPMENT</span>
              {githubData && (
                <div className="card-status-right">
                  <div className="status-dot"></div>
                  <span>Connected</span>
                </div>
              )}
            </div>
            {!githubData ? (
              errors.github ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', cursor: 'pointer' }}>
                  <ExternalLink size={12} /> Connect manually
                </div>
              ) : (
                <div className="shimmer-loader" style={{ height: '40px', marginTop: '8px' }}></div>
              )
            ) : (
              <>
                <div className="dev-stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 12px', marginTop: '16px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Commits</span>
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{githubData.totalCommits}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Repositories</span>
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{githubData.publicRepos}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Current Streak</span>
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>🔥 {githubData.streak}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Languages</span>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{githubData.languages?.join(', ') || '--'}</span>
                  </div>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '12px' }}>Last updated: just now</div>
              </>
            )}
          </div>

          {/* PROBLEM SOLVING CARD */}
          <div className="integration-card">
            <div className="card-header">
              <span className="card-label">PROBLEM SOLVING</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)', letterSpacing: '-1px' }}>
                  {(leetcodeData?.total ?? 0) + (gfgData?.total ?? 0)}
                </span>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>total solved</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                <span className="pill">LeetCode: {leetcodeData?.total ?? 0}</span>
                <span className="pill">GFG: {gfgData?.total ?? 0}</span>
              </div>
            </div>
          </div>
        </div>

      </aside>

      <main className="main-content" style={{ position: 'relative' }}>
        <button onClick={() => setIsPanelOpen(!isPanelOpen)} style={{ position: 'absolute', top: '24px', left: '24px', background: 'var(--surface-1)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', zIndex: 10, transition: 'all 0.2s ease' }}>
          <Menu size={20} />
        </button>
        <div className="app-container">
          <div className="tabs-container">
             <button className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>💬 Coach Chat <span style={{fontSize:'10px', opacity:0.5, marginLeft:'4px'}}>Ctrl+K</span></button>
             <button className={`tab-btn ${activeTab === 'resume' ? 'active' : ''}`} onClick={() => setActiveTab('resume')}>📄 Resume Review <span style={{fontSize:'10px', opacity:0.5, marginLeft:'4px'}}>Ctrl+R</span></button>
          </div>

          {activeTab === 'chat' && (
            <>
              <div className="greeting-section">
                <h2 className="greeting-text">{getGreeting()}, Manish 👋</h2>
                
                <div className="ai-brief-card">
                  <div className="brief-bot-icon">
                    <Bot size={20} color="white" />
                  </div>
                  <div className="brief-content">
                    <div className="brief-title">AI Daily Brief</div>
                    {briefLoading ? (
                      <div className="shimmer-loader"></div>
                    ) : (
                      <div className="brief-text">{dailyBrief}</div>
                    )}
                  </div>
                </div>
              </div>

              <main className="chat-container">
                {messages.map((msg, index) => (
                  <div key={index} className={`message-wrapper ${msg.role}`}>
                    <div className={`message-group ${msg.role}`}>
                      {msg.role === 'ai' && <div className="message-label">DevPulse</div>}
                      <div className={`message ${msg.role}`}>
                        <div className="message-content">
                          {msg.content}
                        </div>
                      </div>
                      {msg.timestamp && <div className="message-timestamp">{msg.timestamp}</div>}
                    </div>
                  </div>
                ))}

                {messages.length === 1 && (
                  <div className="suggested-prompts-container">
                    <div className="suggested-prompts">
                      {SUGGESTED_PROMPTS.map((prompt, i) => (
                        <button key={i} className="prompt-chip" onClick={() => handleSuggestedPrompt(prompt)} disabled={isLoading}>
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {isLoading && (
                  <div className="message-wrapper ai">
                    <div className="message ai">
                      <div className="typing-indicator">
                        <span className="typing-dot"></span>
                        <span className="typing-dot"></span>
                        <span className="typing-dot"></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </main>

              <div className="input-area">
                <form className="input-form" onSubmit={handleSubmit}>
                  <input
                    type="text"
                    className="input-field"
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask your future self..."
                    disabled={isLoading}
                  />
                  <button type="submit" disabled={!input.trim() || isLoading}>
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </>
          )}

          {activeTab === 'resume' && (
            <div className="resume-container">
              <div 
                className="upload-dropzone" 
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  accept=".pdf,.txt" 
                  hidden 
                  ref={fileInputRef} 
                  onChange={handleResumeUpload} 
                />
                <div className="upload-icon">📄</div>
                <div>Drop your resume PDF/TXT here or click to upload</div>
                <div className="upload-subtext">(Basic text extraction works for .txt and text-based PDFs)</div>
              </div>

              {resumeLoading && (
                <div className="resume-loading">
                  <div className="shimmer-loader" style={{ height: '200px' }}></div>
                  <p style={{textAlign:'center', marginTop:'16px', color:'var(--text-muted)'}}>DevPulse is reviewing your resume against 20+ LPA standards...</p>
                </div>
              )}

              {!resumeLoading && resumeAnalysis && renderResumeAnalysis(resumeAnalysis)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
