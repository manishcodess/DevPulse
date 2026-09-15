import React, { useState } from 'react';
import {
  Zap,
  ExternalLink,
  Menu,
  Edit2,
  Code,
  Trash2,
  Plus,
  MessageSquare,
  Brain,
  Activity,
  Pin,
  Check,
  X,
  Target,
  Sparkles,
  Search,
  Briefcase,
  Flame,
  ChevronRight
} from 'lucide-react';
import { API_BASE_URL } from '../../config';
import { extractUsername } from '../../utils/username';
import { apiFetch } from '../../utils/api';

const CATEGORY_COLORS = {
  general: { label: 'General', bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' },
  system_design: { label: 'System Design', bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' },
  dsa: { label: 'DSA Prep', bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' },
  resume: { label: 'Resume', bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' },
  mock_interview: { label: 'Mock Interview', bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' },
  career: { label: 'Career', bg: 'rgba(236, 72, 153, 0.15)', text: '#f472b6', border: 'rgba(236, 72, 153, 0.3)' },
};

const MEMORY_CATEGORIES = [
  { id: 'goal', label: '🎯 Target Goal', color: '#60a5fa' },
  { id: 'weakness', label: '⚠️ Weakness / Blindspot', color: '#f87171' },
  { id: 'strength', label: '💪 Core Strength', color: '#34d399' },
  { id: 'tech_stack', label: '⚡ Tech Stack', color: '#c084fc' },
  { id: 'preference', label: '💡 Learning Preference', color: '#fbbf24' },
  { id: 'general', label: '📝 Note', color: '#9ca3af' },
];

export default function LeftPanel({
  isPanelOpen,
  setIsPanelOpen,
  githubData,
  leetcodeData,
  userCredentials,
  logout,
  setUserCredentials,
  showToast,
  // Multi-Thread Chat props
  conversations = [],
  activeConversationId,
  selectThread,
  createNewThread,
  renameThread,
  togglePinThread,
  deleteThread,
  // Developer Memory props
  devMemoriesState = {}
}) {
  const [activeTab, setActiveTab] = useState('threads'); // 'threads' | 'telemetry' | 'memory'

  // GitHub & LeetCode connection states
  const [githubInput, setGithubInput] = useState('');
  const [leetcodeInput, setLeetcodeInput] = useState('');
  const [githubConnecting, setGithubConnecting] = useState(false);
  const [leetcodeConnecting, setLeetcodeConnecting] = useState(false);
  const [editingGithub, setEditingGithub] = useState(false);
  const [editingLeetcode, setEditingLeetcode] = useState(false);

  // Thread search & rename state
  const [threadSearch, setThreadSearch] = useState('');
  const [editingThreadId, setEditingThreadId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Memory creation states
  const [newMemoryText, setNewMemoryText] = useState('');
  const [newMemoryCategory, setNewMemoryCategory] = useState('goal');
  const [isAddingMemory, setIsAddingMemory] = useState(false);
  const [editingTargets, setEditingTargets] = useState(false);
  const [targetRoleInput, setTargetRoleInput] = useState(devMemoriesState.targetRole || userCredentials?.targetRole || '');
  const [targetCompaniesInput, setTargetCompaniesInput] = useState((devMemoriesState.targetCompanies || userCredentials?.targetCompanies || []).join(', '));
  const [preferredLangInput, setPreferredLangInput] = useState(devMemoriesState.preferredLanguage || userCredentials?.preferredLanguage || '');

  const {
    memories = [],
    handleAddMemory,
    handleDeleteMemory,
    handleUpdateInsights
  } = devMemoriesState;

  // ─── Connection Handlers ──────────────────────────────────────────────────
  const connectService = async (type) => {
    const body = {};
    if (type === 'github') body.githubUsername = extractUsername(githubInput);
    else if (type === 'leetcode') body.leetcodeUsername = extractUsername(leetcodeInput);
    try {
      const res = await apiFetch(`${API_BASE_URL}/auth/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setUserCredentials(prev => ({ ...prev, ...data.user }));
      if (type === 'github') {
        setGithubInput('');
        setEditingGithub(false);
      }
      if (type === 'leetcode') {
        setLeetcodeInput('');
        setEditingLeetcode(false);
      }
      if (showToast) {
        showToast(`${type === 'github' ? 'GitHub' : 'LeetCode'} profile linked successfully!`);
      }
    } catch (err) {
      console.error(err);
      if (showToast) showToast(err.message, 'error');
    }
  };

  const clearProfile = async (type) => {
    const oldUsername = type === 'github' ? (githubData?.username || userCredentials?.github) : (leetcodeData?.username || userCredentials?.leetcode);
    if (type === 'github') setGithubConnecting(true);
    if (type === 'leetcode') setLeetcodeConnecting(true);

    try {
      const body = {};
      if (type === 'github') body.githubUsername = '';
      else if (type === 'leetcode') body.leetcodeUsername = '';

      const res = await apiFetch(`${API_BASE_URL}/auth/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (oldUsername) {
        try { localStorage.removeItem(`devpulse-${type}-${oldUsername}`); } catch (e) {}
      }

      setUserCredentials(prev => ({ 
        ...prev, 
        ...(data.user || (type === 'github' ? { github: '', githubUsername: '' } : { leetcode: '', leetcodeUsername: '' }))
      }));

      if (type === 'github') { setGithubInput(''); setEditingGithub(false); }
      if (type === 'leetcode') { setLeetcodeInput(''); setEditingLeetcode(false); }

      if (showToast) {
        showToast(`${type === 'github' ? 'GitHub' : 'LeetCode'} profile cleared. Ready for fresh connection!`, 'info');
      }
    } catch (err) {
      console.error(`Failed to clear ${type} profile:`, err);
      if (showToast) showToast(err.message || `Failed to clear ${type} profile`, 'error');
    } finally {
      if (type === 'github') setGithubConnecting(false);
      if (type === 'leetcode') setLeetcodeConnecting(false);
    }
  };

  // ─── Thread Rename Handlers ───────────────────────────────────────────────
  const startEditingThread = (e, thread) => {
    e.stopPropagation();
    setEditingThreadId(thread.id);
    setEditingTitle(thread.title);
  };

  const saveThreadTitle = (threadId) => {
    if (editingTitle.trim()) {
      renameThread(threadId, editingTitle.trim());
    }
    setEditingThreadId(null);
  };

  // ─── Memory Handlers ──────────────────────────────────────────────────────
  const submitNewMemory = async (e) => {
    e.preventDefault();
    if (!newMemoryText.trim() || !handleAddMemory) return;
    const ok = await handleAddMemory(newMemoryText, newMemoryCategory);
    if (ok) {
      setNewMemoryText('');
      setIsAddingMemory(false);
    }
  };

  const submitTargetInsights = async (e) => {
    e.preventDefault();
    if (!handleUpdateInsights) return;
    const companies = targetCompaniesInput.split(',').map(c => c.trim()).filter(Boolean);
    const ok = await handleUpdateInsights({
      targetRole: targetRoleInput,
      targetCompanies: companies,
      preferredLanguage: preferredLangInput
    });
    if (ok) setEditingTargets(false);
  };

  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(threadSearch.toLowerCase()) ||
    (c.category && c.category.toLowerCase().includes(threadSearch.toLowerCase()))
  );

  return (
    <aside className={`left-panel ${!isPanelOpen ? 'closed' : ''}`}>
      {/* ─── Panel Header ─────────────────────────────────────────────────── */}
      <div className="panel-top-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="logo-icon-bg">
            <Zap size={18} color="#ffffff" />
          </div>
          {isPanelOpen && (
            <span className="logo-text" style={{ fontSize: '17px', fontWeight: '700', letterSpacing: '-0.3px' }}>DevPulse</span>
          )}
        </div>

        <button 
          onClick={() => setIsPanelOpen(!isPanelOpen)} 
          className="panel-toggle-btn"
          title={isPanelOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <Menu size={18} />
        </button>
      </div>

      {/* ─── Collapsed Mode Quick Icons ───────────────────────────────────── */}
      {!isPanelOpen && (
        <div className="collapsed-nav-icons">
          <button 
            onClick={() => { setIsPanelOpen(true); setActiveTab('threads'); }} 
            className={`collapsed-btn ${activeTab === 'threads' ? 'active' : ''}`}
            title="Chat Threads"
          >
            <MessageSquare size={19} />
          </button>
          <button 
            onClick={() => { setIsPanelOpen(true); setActiveTab('telemetry'); }} 
            className={`collapsed-btn ${activeTab === 'telemetry' ? 'active' : ''}`}
            title="Telemetry & Stats"
          >
            <Activity size={19} />
          </button>
          <button 
            onClick={() => { setIsPanelOpen(true); setActiveTab('memory'); }} 
            className={`collapsed-btn ${activeTab === 'memory' ? 'active' : ''}`}
            title="AI Memory & Insights"
          >
            <Brain size={19} />
          </button>
        </div>
      )}

      {/* ─── Expanded Mode View ───────────────────────────────────────────── */}
      {isPanelOpen && (
        <div className="sidebar-container">
          {/* Navigation Tab Bar */}
          <div className="sidebar-nav-tabs">
            <button
              className={`sidebar-tab-pill ${activeTab === 'threads' ? 'active' : ''}`}
              onClick={() => setActiveTab('threads')}
            >
              <MessageSquare size={14} />
              <span>Threads</span>
              {conversations.length > 0 && <span className="tab-badge">{conversations.length}</span>}
            </button>

            <button
              className={`sidebar-tab-pill ${activeTab === 'telemetry' ? 'active' : ''}`}
              onClick={() => setActiveTab('telemetry')}
            >
              <Activity size={14} />
              <span>Telemetry</span>
            </button>

            <button
              className={`sidebar-tab-pill ${activeTab === 'memory' ? 'active' : ''}`}
              onClick={() => setActiveTab('memory')}
            >
              <Brain size={14} />
              <span>AI Memory</span>
              {memories.length > 0 && <span className="tab-badge memory">{memories.length}</span>}
            </button>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 1: CHAT THREADS
             ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'threads' && (
            <div className="threads-view-pane">
              {/* New Thread CTA */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <button
                  onClick={() => createNewThread('New Coaching Session', 'general')}
                  className="new-thread-btn"
                >
                  <Plus size={16} />
                  <span>New Chat</span>
                </button>
              </div>

              {/* Thread Search Box */}
              {conversations.length > 4 && (
                <div className="thread-search-box">
                  <Search size={13} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search threads..."
                    value={threadSearch}
                    onChange={(e) => setThreadSearch(e.target.value)}
                  />
                  {threadSearch && (
                    <button onClick={() => setThreadSearch('')} className="clear-search-btn">
                      <X size={12} />
                    </button>
                  )}
                </div>
              )}

              {/* Thread List */}
              <div className="threads-list-scroll">
                {filteredConversations.length === 0 ? (
                  <div className="threads-empty-state">
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {threadSearch ? 'No matching threads found.' : 'No chat sessions yet.'}
                    </p>
                    <button
                      onClick={() => createNewThread('New Coaching Session', 'general')}
                      className="create-first-thread-btn"
                    >
                      Start First Chat
                    </button>
                  </div>
                ) : (
                  filteredConversations.map((thread) => {
                    const isActive = thread.id === activeConversationId;
                    const catStyle = CATEGORY_COLORS[thread.category] || CATEGORY_COLORS.general;

                    return (
                      <div
                        key={thread.id}
                        className={`thread-item-card ${isActive ? 'active' : ''} ${thread.pinned ? 'pinned' : ''}`}
                        onClick={() => selectThread(thread.id)}
                      >
                        <div className="thread-card-top">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                            {thread.pinned && <Pin size={12} className="pinned-icon" />}
                            
                            {editingThreadId === thread.id ? (
                              <input
                                autoFocus
                                className="inline-title-input"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveThreadTitle(thread.id);
                                  if (e.key === 'Escape') setEditingThreadId(null);
                                }}
                                onBlur={() => saveThreadTitle(thread.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <span className="thread-title-text" title={thread.title}>
                                {thread.title}
                              </span>
                            )}
                          </div>

                          {/* Action Buttons on Hover */}
                          <div className="thread-actions" onClick={(e) => e.stopPropagation()}>
                            <button
                              className="thread-action-icon"
                              onClick={() => togglePinThread(thread.id, thread.pinned)}
                              title={thread.pinned ? "Unpin thread" : "Pin to top"}
                            >
                              <Pin size={12} style={{ color: thread.pinned ? '#f59e0b' : 'inherit' }} />
                            </button>
                            <button
                              className="thread-action-icon"
                              onClick={(e) => startEditingThread(e, thread)}
                              title="Rename thread"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              className="thread-action-icon delete"
                              onClick={() => deleteThread(thread.id)}
                              title="Delete thread"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Thread Metadata Footer */}
                        <div className="thread-card-bottom">
                          <span 
                            className="thread-category-badge"
                            style={{ background: catStyle.bg, color: catStyle.text, borderColor: catStyle.border }}
                          >
                            {catStyle.label}
                          </span>
                          
                          {thread.lastMessageSnippet && (
                            <span className="thread-snippet" title={thread.lastMessageSnippet}>
                              {thread.lastMessageSnippet}
                            </span>
                          )}

                          <span className="thread-msg-count">
                            {thread.messageCount || 0} msgs
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 2: TELEMETRY (GITHUB & LEETCODE)
             ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'telemetry' && (
            <div className="telemetry-view-pane">
              {/* GitHub Card */}
              <div className="integration-card">
                <div className="card-header">
                  <span className="card-label">GITHUB STATS</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {userCredentials?.github && !editingGithub && (
                      <button onClick={() => setEditingGithub(true)} className="icon-action-btn" title="Edit GitHub Username">
                        <Edit2 size={14} />
                      </button>
                    )}
                    {userCredentials?.github && (
                      <a href={`https://github.com/${githubData?.username || userCredentials?.github || 'github'}`} target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)' }}>
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
                
                {!userCredentials?.github ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Connect GitHub to track your commits and repos.</p>
                    <input
                      placeholder="GitHub Username"
                      value={githubInput}
                      onChange={(e) => setGithubInput(e.target.value)}
                      className="integration-input"
                    />
                    <button
                      onClick={() => { setGithubConnecting(true); connectService('github').finally(() => setGithubConnecting(false)); }}
                      disabled={!githubInput || githubConnecting}
                      className="connect-service-btn github"
                    >
                      {githubConnecting ? 'Connecting...' : 'Connect GitHub'}
                    </button>
                  </div>
                ) : (
                  <>
                    {!githubData ? (
                      <div className="shimmer-loader" style={{ height: '40px', marginTop: '8px' }}></div>
                    ) : (
                      <>
                        <div className="dev-stats-grid">
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Commits</span>
                            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981' }}>{githubData.totalCommits}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Repositories</span>
                            <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{githubData.publicRepos}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Active Days</span>
                            <span style={{ 
                              fontSize: Number(githubData.activeDays) > 0 ? '16px' : '13px', 
                              fontWeight: Number(githubData.activeDays) > 0 ? 'bold' : 'normal',
                              color: Number(githubData.activeDays) > 0 ? '#10b981' : 'var(--text-muted)'
                            }}>
                              {Number(githubData.activeDays) > 0 ? `${githubData.activeDays} Days` : "Start today!"}
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Top Language</span>
                            <span style={{ fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{githubData.languages?.[0] || '--'}</span>
                          </div>
                        </div>
                      </>
                    )}
                    {editingGithub && (
                      <div className="edit-service-drawer">
                        <input
                          placeholder="New GitHub Username"
                          value={githubInput}
                          onChange={(e) => setGithubInput(e.target.value)}
                          className="integration-input"
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => { setGithubConnecting(true); connectService('github').finally(() => setGithubConnecting(false)); }}
                            disabled={!githubInput || githubConnecting}
                            className="connect-service-btn github"
                            style={{ flex: 1 }}
                          >
                            {githubConnecting ? 'Updating...' : 'Update'}
                          </button>
                          <button
                            onClick={() => clearProfile('github')}
                            disabled={githubConnecting}
                            className="clear-profile-btn"
                          >
                            <Trash2 size={13} /> Clear
                          </button>
                        </div>
                        <button onClick={() => setEditingGithub(false)} className="cancel-btn">Cancel</button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* LeetCode Card */}
              <div className="integration-card">
                <div className="card-header">
                  <span className="card-label">PROBLEM SOLVING</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {userCredentials?.leetcode && !editingLeetcode && (
                      <button onClick={() => setEditingLeetcode(true)} className="icon-action-btn" title="Edit LeetCode Username">
                        <Edit2 size={14} />
                      </button>
                    )}
                    {userCredentials?.leetcode && (
                      <a href={leetcodeData?.profileUrl || `https://leetcode.com/${leetcodeData?.username || userCredentials?.leetcode || ''}`} target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)' }}>
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
                
                {!userCredentials?.leetcode ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Connect LeetCode to track your problem solving stats.</p>
                    <input
                      placeholder="LeetCode Username"
                      value={leetcodeInput}
                      onChange={(e) => setLeetcodeInput(e.target.value)}
                      className="integration-input"
                    />
                    <button
                      onClick={() => { setLeetcodeConnecting(true); connectService('leetcode').finally(() => setLeetcodeConnecting(false)); }}
                      disabled={!leetcodeInput || leetcodeConnecting}
                      className="connect-service-btn leetcode"
                    >
                      {leetcodeConnecting ? 'Connecting...' : 'Connect LeetCode'}
                    </button>
                  </div>
                ) : (
                  <>
                    {!leetcodeData ? (
                      <div className="shimmer-loader" style={{ height: '40px', marginTop: '8px' }}></div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                          <span style={{ fontSize: '28px', fontWeight: '800', color: 'var(--accent-orange)', letterSpacing: '-1px' }}>
                            {leetcodeData?.total ?? 0}
                          </span>
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>Problems Solved</span>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                            <span style={{ color: '#10b981', fontWeight: '500' }}>Easy</span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{leetcodeData?.easy ?? 0}</span>
                          </div>
                          <div className="diff-bar-bg">
                            <div style={{ width: `${Math.min(((leetcodeData?.easy ?? 0) / (leetcodeData?.total || 1)) * 100, 100)}%`, height: '100%', background: '#10b981' }}></div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginTop: '4px' }}>
                            <span style={{ color: '#f59e0b', fontWeight: '500' }}>Medium</span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{leetcodeData?.medium ?? 0}</span>
                          </div>
                          <div className="diff-bar-bg">
                            <div style={{ width: `${Math.min(((leetcodeData?.medium ?? 0) / (leetcodeData?.total || 1)) * 100, 100)}%`, height: '100%', background: '#f59e0b' }}></div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginTop: '4px' }}>
                            <span style={{ color: '#ef4444', fontWeight: '500' }}>Hard</span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{leetcodeData?.hard ?? 0}</span>
                          </div>
                          <div className="diff-bar-bg">
                            <div style={{ width: `${Math.min(((leetcodeData?.hard ?? 0) / (leetcodeData?.total || 1)) * 100, 100)}%`, height: '100%', background: '#ef4444' }}></div>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Rating</span>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{leetcodeData?.rating ?? '--'}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Top %</span>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{leetcodeData?.top ?? '--'}%</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {editingLeetcode && (
                      <div className="edit-service-drawer">
                        <input
                          placeholder="New LeetCode Username"
                          value={leetcodeInput}
                          onChange={(e) => setLeetcodeInput(e.target.value)}
                          className="integration-input"
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => { setLeetcodeConnecting(true); connectService('leetcode').finally(() => setLeetcodeConnecting(false)); }}
                            disabled={!leetcodeInput || leetcodeConnecting}
                            className="connect-service-btn leetcode"
                            style={{ flex: 1 }}
                          >
                            {leetcodeConnecting ? 'Updating...' : 'Update'}
                          </button>
                          <button
                            onClick={() => clearProfile('leetcode')}
                            disabled={leetcodeConnecting}
                            className="clear-profile-btn"
                          >
                            <Trash2 size={13} /> Clear
                          </button>
                        </div>
                        <button onClick={() => setEditingLeetcode(false)} className="cancel-btn">Cancel</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 3: DEVELOPER MEMORY & PROFILE INSIGHTS
             ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'memory' && (
            <div className="memory-view-pane">
              {/* Target Role & Preferred Stack Card */}
              <div className="memory-card">
                <div className="card-header">
                  <span className="card-label">CAREER TARGETS</span>
                  <button 
                    onClick={() => setEditingTargets(!editingTargets)} 
                    className="icon-action-btn"
                    title="Edit Career Targets"
                  >
                    <Edit2 size={13} />
                  </button>
                </div>

                {editingTargets ? (
                  <form onSubmit={submitTargetInsights} className="memory-targets-form">
                    <label className="input-label">Target Role</label>
                    <input
                      className="integration-input"
                      placeholder="e.g. SDE-2 (Backend) / Full-Stack"
                      value={targetRoleInput}
                      onChange={(e) => setTargetRoleInput(e.target.value)}
                    />

                    <label className="input-label">Target Companies (comma separated)</label>
                    <input
                      className="integration-input"
                      placeholder="e.g. Amazon, Uber, Stripe"
                      value={targetCompaniesInput}
                      onChange={(e) => setTargetCompaniesInput(e.target.value)}
                    />

                    <label className="input-label">Preferred Interview Language</label>
                    <input
                      className="integration-input"
                      placeholder="e.g. TypeScript, Java, Python"
                      value={preferredLangInput}
                      onChange={(e) => setPreferredLangInput(e.target.value)}
                    />

                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <button type="submit" className="save-targets-btn">Save Targets</button>
                      <button type="button" onClick={() => setEditingTargets(false)} className="cancel-btn">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div className="targets-display-grid">
                    <div className="target-stat-item">
                      <span className="target-stat-label">Target Role</span>
                      <span className="target-stat-val">{devMemoriesState.targetRole || userCredentials?.targetRole || 'Not specified'}</span>
                    </div>

                    <div className="target-stat-item">
                      <span className="target-stat-label">Companies</span>
                      <span className="target-stat-val">
                        {(devMemoriesState.targetCompanies?.length ? devMemoriesState.targetCompanies : userCredentials?.targetCompanies)?.join(', ') || 'Any FAANG / Tier-1'}
                      </span>
                    </div>

                    <div className="target-stat-item">
                      <span className="target-stat-label">Language</span>
                      <span className="target-stat-val">{devMemoriesState.preferredLanguage || userCredentials?.preferredLanguage || 'Any'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Developer Facts & Memory Insights Card */}
              <div className="memory-card">
                <div className="card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={14} style={{ color: '#c084fc' }} />
                    <span className="card-label">AI LEARNED FACTS ({memories.length})</span>
                  </div>
                  <button 
                    onClick={() => setIsAddingMemory(!isAddingMemory)} 
                    className="add-memory-btn"
                    title="Add custom fact"
                  >
                    <Plus size={13} /> Add
                  </button>
                </div>

                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: '1.4' }}>
                  DevPulse automatically remembers your goals, weaknesses, and strengths across chat sessions to personalize advice.
                </p>

                {/* Add Custom Fact Form */}
                {isAddingMemory && (
                  <form onSubmit={submitNewMemory} className="add-memory-form">
                    <select
                      className="memory-category-select"
                      value={newMemoryCategory}
                      onChange={(e) => setNewMemoryCategory(e.target.value)}
                    >
                      {MEMORY_CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>

                    <input
                      type="text"
                      className="integration-input"
                      placeholder="e.g. Targeting Amazon SDE-2 by Q3..."
                      value={newMemoryText}
                      onChange={(e) => setNewMemoryText(e.target.value)}
                      autoFocus
                    />

                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button type="submit" className="save-targets-btn" disabled={!newMemoryText.trim()}>Save Fact</button>
                      <button type="button" onClick={() => setIsAddingMemory(false)} className="cancel-btn">Cancel</button>
                    </div>
                  </form>
                )}

                {/* Memory Badges / Tag Cloud */}
                <div className="memory-items-container">
                  {memories.length === 0 ? (
                    <div className="empty-memories-box">
                      <Brain size={24} style={{ color: '#9ca3af', marginBottom: '6px', opacity: 0.5 }} />
                      <span>No persistent facts recorded yet. Chat with DevPulse or click "+ Add" above!</span>
                    </div>
                  ) : (
                    memories.map((mem) => {
                      const catConfig = MEMORY_CATEGORIES.find(c => c.id === mem.category) || MEMORY_CATEGORIES[5];
                      return (
                        <div key={mem._id || mem.text} className="memory-pill-badge">
                          <span className="memory-badge-category" style={{ color: catConfig.color }}>
                            {catConfig.label.split(' ')[0]}
                          </span>
                          <span className="memory-badge-text">{mem.text}</span>
                          <button
                            className="memory-delete-btn"
                            onClick={() => handleDeleteMemory(mem._id)}
                            title="Remove this fact from AI memory"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
