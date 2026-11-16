import React, { useState, FormEvent, MouseEvent } from 'react';
import {
  Zap,
  ExternalLink,
  Menu,
  Edit2,
  Trash2,
  Plus,
  MessageSquare,
  Brain,
  Activity,
  Pin,
  X,
  Sparkles,
  Search
} from 'lucide-react';
import { extractUsername } from '../../utils/username';
import { apiFetch } from '../../utils/api';
import { GithubData, LeetcodeData, UserCredentials, DevMemory, Conversation, ToastFn } from '../../types';

const MEMORY_CATEGORIES = [
  { id: 'goal', label: '🎯 Target Goal', color: '#60a5fa' },
  { id: 'weakness', label: '⚠️ Weakness / Blindspot', color: '#f87171' },
  { id: 'strength', label: '💪 Core Strength', color: '#34d399' },
  { id: 'tech_stack', label: '⚡ Tech Stack', color: '#c084fc' },
  { id: 'preference', label: '💡 Learning Preference', color: '#fbbf24' },
  { id: 'general', label: '📝 Note', color: '#9ca3af' },
];

interface ServiceEditDrawerProps {
  serviceName: 'GitHub' | 'LeetCode';
  inputValue: string;
  isConnecting: boolean;
  onInputChange: (val: string) => void;
  onUpdate: () => void;
  onClear: () => void;
  onCancel: () => void;
}

function ServiceEditDrawer({
  serviceName,
  inputValue,
  isConnecting,
  onInputChange,
  onUpdate,
  onClear,
  onCancel
}: ServiceEditDrawerProps) {
  const serviceKey = serviceName.toLowerCase();
  return (
    <div className="edit-service-drawer">
      <input
        placeholder={`New ${serviceName} Username`}
        value={inputValue}
        onChange={(e) => onInputChange(e.target.value)}
        className="integration-input"
      />
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onUpdate}
          disabled={!inputValue.trim() || isConnecting}
          className={`connect-service-btn ${serviceKey}`}
          style={{ flex: 1 }}
        >
          {isConnecting ? 'Updating...' : 'Update'}
        </button>
        <button
          onClick={onClear}
          disabled={isConnecting}
          className="clear-profile-btn"
        >
          <Trash2 size={13} /> Clear
        </button>
      </div>
      <button onClick={onCancel} className="cancel-btn">Cancel</button>
    </div>
  );
}

interface LeftPanelProps {
  isPanelOpen: boolean;
  setIsPanelOpen: (val: boolean) => void;
  githubData?: GithubData | null;
  leetcodeData?: LeetcodeData | null;
  userCredentials?: UserCredentials | null;
  logout?: () => void;
  setUserCredentials: React.Dispatch<React.SetStateAction<any>>;
  showToast?: ToastFn;
  conversations?: Conversation[];
  activeConversationId?: string | null;
  selectThread?: (id: string) => void;
  createNewThread?: (title?: string, category?: string) => Promise<any>;
  renameThread?: (id: string, newTitle: string) => Promise<void>;
  togglePinThread?: (id: string, currentPinned: boolean) => Promise<void>;
  deleteThread?: (id: string) => Promise<void>;
  devMemoriesState?: any;
}

export default function LeftPanel({
  isPanelOpen,
  setIsPanelOpen,
  githubData,
  leetcodeData,
  userCredentials,
  setUserCredentials,
  showToast,
  conversations = [],
  activeConversationId,
  selectThread,
  createNewThread,
  renameThread,
  togglePinThread,
  deleteThread,
  devMemoriesState = {}
}: LeftPanelProps) {
  const [activeTab, setActiveTab] = useState<'threads' | 'telemetry' | 'memory'>('threads');

  // Connection states
  const [githubInput, setGithubInput] = useState('');
  const [leetcodeInput, setLeetcodeInput] = useState('');
  const [githubConnecting, setGithubConnecting] = useState(false);
  const [leetcodeConnecting, setLeetcodeConnecting] = useState(false);
  const [editingGithub, setEditingGithub] = useState(false);
  const [editingLeetcode, setEditingLeetcode] = useState(false);

  // Thread search & rename state
  const [threadSearch, setThreadSearch] = useState('');
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
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
  const connectService = async (type: 'github' | 'leetcode') => {
    const rawInput = type === 'github' ? githubInput : leetcodeInput;
    const bodyKey = type === 'github' ? 'githubUsername' : 'leetcodeUsername';
    const setConnecting = type === 'github' ? setGithubConnecting : setLeetcodeConnecting;

    setConnecting(true);
    try {
      const res = await apiFetch('/auth/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [bodyKey]: extractUsername(rawInput) }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setUserCredentials((prev: any) => ({ ...prev, ...data.user }));
      if (type === 'github') {
        setGithubInput('');
        setEditingGithub(false);
      } else {
        setLeetcodeInput('');
        setEditingLeetcode(false);
      }
      showToast?.(`${type === 'github' ? 'GitHub' : 'LeetCode'} profile linked successfully!`);
    } catch (err: any) {
      console.error(err);
      showToast?.(err.message, 'error');
    } finally {
      setConnecting(false);
    }
  };

  const clearProfile = async (type: 'github' | 'leetcode') => {
    const oldUsername = type === 'github' ? (githubData?.username || userCredentials?.github) : userCredentials?.leetcode;
    const setConnecting = type === 'github' ? setGithubConnecting : setLeetcodeConnecting;
    setConnecting(true);

    try {
      const bodyKey = type === 'github' ? 'githubUsername' : 'leetcodeUsername';
      const res = await apiFetch('/auth/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [bodyKey]: '' }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (oldUsername) {
        try { localStorage.removeItem(`devpulse-${type}-${oldUsername}`); } catch {}
      }

      setUserCredentials((prev: any) => ({ 
        ...prev, 
        ...(data.user || (type === 'github' ? { github: '' } : { leetcode: '' }))
      }));

      if (type === 'github') { setGithubInput(''); setEditingGithub(false); }
      else { setLeetcodeInput(''); setEditingLeetcode(false); }

      showToast?.(`${type === 'github' ? 'GitHub' : 'LeetCode'} profile cleared. Ready for fresh connection!`, 'info');
    } catch (err: any) {
      console.error(`Failed to clear ${type} profile:`, err);
      showToast?.(err.message || `Failed to clear ${type} profile`, 'error');
    } finally {
      setConnecting(false);
    }
  };

  // ─── Thread Rename Handlers ───────────────────────────────────────────────
  const startEditingThread = (e: MouseEvent, thread: Conversation) => {
    e.stopPropagation();
    setEditingThreadId(thread.id || thread._id);
    setEditingTitle(thread.title);
  };

  const saveThreadTitle = (threadId: string) => {
    if (editingTitle.trim() && renameThread) {
      renameThread(threadId, editingTitle.trim());
    }
    setEditingThreadId(null);
  };

  // ─── Memory Handlers ──────────────────────────────────────────────────────
  const submitNewMemory = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMemoryText.trim() || !handleAddMemory) return;
    const ok = await handleAddMemory(newMemoryText, newMemoryCategory);
    if (ok) {
      setNewMemoryText('');
      setIsAddingMemory(false);
    }
  };

  const submitTargetInsights = async (e: FormEvent) => {
    e.preventDefault();
    if (!handleUpdateInsights) return;
    const companies = targetCompaniesInput.split(',').map((c: string) => c.trim()).filter(Boolean);
    const ok = await handleUpdateInsights({
      targetRole: targetRoleInput,
      targetCompanies: companies,
      preferredLanguage: preferredLangInput
    });
    if (ok) setEditingTargets(false);
  };

  const filteredConversations = conversations.filter(c => {
    const title = c.title || '';
    const cat = c.category || '';
    const query = threadSearch.toLowerCase();
    return title.toLowerCase().includes(query) || cat.toLowerCase().includes(query);
  });

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
                {createNewThread && (
                  <button
                    onClick={() => createNewThread('New Coaching Session', 'general')}
                    className="new-thread-btn"
                  >
                    <Plus size={16} />
                    <span>New Chat</span>
                  </button>
                )}
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
                    {createNewThread && (
                      <button
                        onClick={() => createNewThread('New Coaching Session', 'general')}
                        className="create-first-thread-btn"
                      >
                        Start First Chat
                      </button>
                    )}
                  </div>
                ) : (
                  filteredConversations.map((thread) => {
                    const threadId = thread.id || thread._id;
                    const isActive = threadId === activeConversationId;

                    return (
                      <div
                        key={threadId}
                        className={`thread-item-card ${isActive ? 'active' : ''} ${thread.pinned ? 'pinned' : ''}`}
                        onClick={() => selectThread?.(threadId)}
                      >
                        <div className="thread-card-top">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                            {thread.pinned && <Pin size={12} className="pinned-icon" />}
                            
                            {editingThreadId === threadId ? (
                              <input
                                autoFocus
                                className="inline-title-input"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveThreadTitle(threadId);
                                  if (e.key === 'Escape') setEditingThreadId(null);
                                }}
                                onBlur={() => saveThreadTitle(threadId)}
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
                            {togglePinThread && (
                              <button
                                className="thread-action-icon"
                                onClick={() => togglePinThread(threadId, !!thread.pinned)}
                                title={thread.pinned ? "Unpin thread" : "Pin to top"}
                              >
                                <Pin size={12} style={{ color: thread.pinned ? '#f59e0b' : 'inherit' }} />
                              </button>
                            )}
                            <button
                              className="thread-action-icon"
                              onClick={(e) => startEditingThread(e, thread)}
                              title="Rename thread"
                            >
                              <Edit2 size={12} />
                            </button>
                            {deleteThread && (
                              <button
                                className="thread-action-icon delete"
                                onClick={() => deleteThread(threadId)}
                                title="Delete thread"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Thread Metadata Footer */}
                        <div className="thread-card-bottom">
                          {thread.lastMessageSnippet ? (
                            <span className="thread-snippet" title={thread.lastMessageSnippet}>
                              {thread.lastMessageSnippet}
                            </span>
                          ) : (
                            <span className="thread-snippet" style={{ fontStyle: 'italic', opacity: 0.6 }}>
                              No messages yet
                            </span>
                          )}

                          <span className="thread-msg-count">
                            {thread.messageCount || thread.messages?.length || 0} msgs
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
                      <a href={`https://github.com/${githubData?.username || userCredentials.github}`} target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)' }}>
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
                      onClick={() => connectService('github')}
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
                          <span style={{ fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {typeof githubData.languages?.[0] === 'string'
                              ? githubData.languages[0]
                              : githubData.languages?.[0]?.name || '--'}
                          </span>
                        </div>
                      </div>
                    )}

                    {editingGithub && (
                      <ServiceEditDrawer
                        serviceName="GitHub"
                        inputValue={githubInput}
                        isConnecting={githubConnecting}
                        onInputChange={setGithubInput}
                        onUpdate={() => connectService('github')}
                        onClear={() => clearProfile('github')}
                        onCancel={() => setEditingGithub(false)}
                      />
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
                      <a href={`https://leetcode.com/u/${userCredentials.leetcode}`} target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)' }}>
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
                      onClick={() => connectService('leetcode')}
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
                            {leetcodeData.total ?? 0}
                          </span>
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>Problems Solved</span>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                            <span style={{ color: '#10b981', fontWeight: '500' }}>Easy</span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{leetcodeData.easy ?? 0}</span>
                          </div>
                          <div className="diff-bar-bg">
                            <div style={{ width: `${Math.min(((Number(leetcodeData.easy) || 0) / (Number(leetcodeData.total) || 1)) * 100, 100)}%`, height: '100%', background: '#10b981' }}></div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginTop: '4px' }}>
                            <span style={{ color: '#f59e0b', fontWeight: '500' }}>Medium</span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{leetcodeData.medium ?? 0}</span>
                          </div>
                          <div className="diff-bar-bg">
                            <div style={{ width: `${Math.min(((Number(leetcodeData.medium) || 0) / (Number(leetcodeData.total) || 1)) * 100, 100)}%`, height: '100%', background: '#f59e0b' }}></div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginTop: '4px' }}>
                            <span style={{ color: '#ef4444', fontWeight: '500' }}>Hard</span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{leetcodeData.hard ?? 0}</span>
                          </div>
                          <div className="diff-bar-bg">
                            <div style={{ width: `${Math.min(((Number(leetcodeData.hard) || 0) / (Number(leetcodeData.total) || 1)) * 100, 100)}%`, height: '100%', background: '#ef4444' }}></div>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Rating</span>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{leetcodeData.rating ?? '--'}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Top %</span>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{leetcodeData.top ?? '--'}%</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {editingLeetcode && (
                      <ServiceEditDrawer
                        serviceName="LeetCode"
                        inputValue={leetcodeInput}
                        isConnecting={leetcodeConnecting}
                        onInputChange={setLeetcodeInput}
                        onUpdate={() => connectService('leetcode')}
                        onClear={() => clearProfile('leetcode')}
                        onCancel={() => setEditingLeetcode(false)}
                      />
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
                    memories.map((mem: DevMemory) => {
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
