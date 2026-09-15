import React, { useState } from 'react';
import {
  Send,
  Plus,
  Pin,
  Edit2,
  Check,
  X,
  Sparkles,
  Layers,
  Brain,
  MessageSquare
} from 'lucide-react';
import ChatMessage from './ChatMessage';

const CATEGORY_PROMPTS = {
  general: [
    "How is my coding consistency looking lately based on telemetry?",
    "Review the last few LeetCode problems I solved",
    "What should I focus on today to reach my target role?",
    "Give me honest feedback on my recent GitHub commits",
    "How do I prepare effectively for tech interviews this quarter?"
  ],
  system_design: [
    "Design a scalable URL shortener like Bitly (100k RPS)",
    "Walk me through caching strategies with Redis & Cache-Aside pattern",
    "How do I design a distributed rate limiter with Token Bucket?",
    "Explain SQL vs NoSQL trade-offs for an event-driven system"
  ],
  dsa: [
    "Give me a 3-tier hint for Longest Substring Without Repeating Characters",
    "How do I immediately recognize a Monotonic Stack problem?",
    "Explain 0/1 Knapsack vs Unbounded Knapsack with clear intuition",
    "Review my approach to Binary Tree Maximum Path Sum"
  ],
  resume: [
    "Rewrite my project bullet point using the STAR method for high impact",
    "What hard skills should I highlight for my target company?",
    "How can I make my GitHub repos stand out on my resume?"
  ],
  mock_interview: [
    "Simulate a 30-minute DSA interview on Sliding Window and Graphs",
    "Ask me a tricky System Design question for SDE-2 and evaluate my answer",
    "Give me a behavioral question using the STAR method for my projects"
  ],
  career: [
    "How do I transition from SDE-1 to SDE-2 in 6 months?",
    "What salary benchmarks should I expect for my target roles?",
    "How do I stand out when applying for Tier-1 remote tech roles?"
  ]
};

const CATEGORY_OPTIONS = [
  { id: 'general', label: '💡 General Coaching', color: '#60a5fa' },
  { id: 'system_design', label: '⚡ System Design', color: '#c084fc' },
  { id: 'dsa', label: '🧩 DSA Mastery', color: '#fbbf24' },
  { id: 'resume', label: '📄 Resume & ATS', color: '#34d399' },
  { id: 'mock_interview', label: '🎙️ Mock Interview', color: '#f87171' },
  { id: 'career', label: '🚀 Career & Salary', color: '#f472b6' }
];

export default function ChatInterface({
  messages,
  isLoading,
  isStreaming,
  input,
  setInput,
  inputRef,
  messagesEndRef,
  submitMessage,
  getGreeting,
  userCredentials,
  briefLoading,
  // Multi-thread props
  activeConversation,
  createNewThread,
  renameThread,
  togglePinThread,
  updateCategory,
  devMemoriesState = {}
}) {
  const userName = userCredentials?.name?.split(' ')[0] || "User";
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  const currentCategory = activeConversation?.category || 'general';
  const suggestedPrompts = CATEGORY_PROMPTS[currentCategory] || CATEGORY_PROMPTS.general;

  const handleStartEditTitle = () => {
    setTitleDraft(activeConversation?.title || 'New Coaching Session');
    setIsEditingTitle(true);
  };

  const handleSaveTitle = () => {
    if (titleDraft.trim() && activeConversation?.id) {
      renameThread(activeConversation.id, titleDraft.trim());
    }
    setIsEditingTitle(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const userMessage = input.trim();
    if (!userMessage) return;
    setInput('');
    submitMessage(userMessage);
  };

  const handleSuggestedPrompt = (prompt) => {
    submitMessage(prompt);
  };

  return (
    <>
      {/* ─── Thread Top Action Bar ────────────────────────────────────────── */}
      <div className="chat-thread-header-bar">
        <div className="thread-header-left">
          {isEditingTitle ? (
            <div className="inline-title-editor">
              <input
                autoFocus
                className="header-title-input"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') setIsEditingTitle(false);
                }}
              />
              <button onClick={handleSaveTitle} className="title-action-btn check" title="Save title">
                <Check size={14} />
              </button>
              <button onClick={() => setIsEditingTitle(false)} className="title-action-btn cancel" title="Cancel">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="header-title-display" onClick={handleStartEditTitle} title="Click to rename thread">
              <h2 className="current-thread-title">
                {activeConversation?.title || 'Daily Check-in & Career Prep'}
              </h2>
              <button className="rename-thread-btn" title="Rename thread">
                <Edit2 size={13} />
              </button>
            </div>
          )}

          {activeConversation?.pinned && (
            <span className="pinned-thread-pill">
              <Pin size={11} /> Pinned
            </span>
          )}
        </div>

        <div className="thread-header-right">
          {/* Category Dropdown */}
          <div className="category-select-wrapper">
            <select
              className="category-dropdown"
              value={currentCategory}
              onChange={(e) => {
                if (activeConversation?.id && updateCategory) {
                  updateCategory(activeConversation.id, e.target.value);
                }
              }}
              title="Switch Coaching Focus Area"
            >
              {CATEGORY_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* New Chat Quick Button */}
          {createNewThread && (
            <button
              onClick={() => createNewThread('New Coaching Session', 'general')}
              className="header-new-chat-btn"
              title="Start a new chat thread"
            >
              <Plus size={14} />
              <span>New Chat</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Persistent Memory Insights Indicator Bar ────────────────────── */}
      {devMemoriesState.memories && devMemoriesState.memories.length > 0 && (
        <div className="active-memory-glance-bar">
          <div className="memory-glance-label">
            <Brain size={12} style={{ color: '#c084fc' }} />
            <span>AI Memory Active:</span>
          </div>
          <div className="memory-glance-tags">
            {devMemoriesState.targetRole && (
              <span className="glance-tag goal">🎯 {devMemoriesState.targetRole}</span>
            )}
            {devMemoriesState.preferredLanguage && (
              <span className="glance-tag stack">⚡ {devMemoriesState.preferredLanguage}</span>
            )}
            {devMemoriesState.memories.slice(0, 2).map((m, idx) => (
              <span key={idx} className="glance-tag note">
                {m.text.length > 35 ? `${m.text.slice(0, 35)}...` : m.text}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ─── Chat Messages Container ──────────────────────────────────────── */}
      <main className="chat-container">
        {messages.map((msg, index) => (
          <ChatMessage key={index} msg={msg} />
        ))}

        {messages.length <= 1 && (
          <div className="suggested-prompts-container">
            <div className="suggested-prompts-title">
              <span>💡 Suggested questions for <strong>{CATEGORY_OPTIONS.find(c => c.id === currentCategory)?.label || 'Coaching'}</strong>:</span>
            </div>
            <div className="suggested-prompts">
              {suggestedPrompts.map((prompt, i) => (
                <button 
                  key={i} 
                  className="prompt-chip" 
                  onClick={() => handleSuggestedPrompt(prompt)} 
                  disabled={isLoading || isStreaming}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {(isLoading || briefLoading) && (
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

      {/* ─── Input Area ───────────────────────────────────────────────────── */}
      <div className="input-area">
        {messages.length > 1 && (
          <div className="chat-quick-suggestions">
            {suggestedPrompts.slice(0, 3).map((prompt, i) => (
              <button
                key={i}
                type="button"
                className="quick-prompt-chip"
                onClick={() => handleSuggestedPrompt(prompt)}
                disabled={isLoading || isStreaming}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
        <form className="input-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="input-field"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask DevPulse anything about ${CATEGORY_OPTIONS.find(c => c.id === currentCategory)?.label.split(' ')[1] || 'coding'}...`}
            disabled={isLoading || isStreaming}
          />
          <button type="submit" className="send-btn" disabled={!input.trim() || isLoading || isStreaming}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </>
  );
}
