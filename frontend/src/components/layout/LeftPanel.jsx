import React, { useState } from 'react';
import { Zap, ExternalLink, Menu, Edit2 } from 'lucide-react';
import { API_BASE_URL } from '../../config';

export default function LeftPanel({ isPanelOpen, setIsPanelOpen, githubData, leetcodeData, userCredentials, logout, setUserCredentials }) {
  const [githubInput, setGithubInput] = useState('');
  const [leetcodeInput, setLeetcodeInput] = useState('');
  const [githubConnecting, setGithubConnecting] = useState(false);
  const [leetcodeConnecting, setLeetcodeConnecting] = useState(false);
  const [editingGithub, setEditingGithub] = useState(false);
  const [editingLeetcode, setEditingLeetcode] = useState(false);

  const extractUsername = (input) => {
    if (!input) return '';
    let val = input.trim();
    try {
      const url = new URL(val);
      const pathParts = url.pathname.split('/').filter(Boolean);
      if (url.hostname.includes('leetcode.com')) {
         if (pathParts[0] === 'u') return pathParts[1];
         return pathParts[0];
      }
      if (url.hostname.includes('github.com')) {
         return pathParts[0];
      }
    } catch {
      // Not a valid URL, fallback to parsing it as a string
    }
    
    val = val.split('?')[0].split('#')[0];
    if (val.endsWith('/')) val = val.slice(0, -1);
    const parts = val.split('/');
    return parts[parts.length - 1];
  };

  const connectService = async (type) => {
    const body = {};
    if (type === 'github') body.githubUsername = extractUsername(githubInput);
    else if (type === 'leetcode') body.leetcodeUsername = extractUsername(leetcodeInput);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/onboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to connect');
      // Update user credentials with new data
      setUserCredentials(prev => ({ ...prev, ...data.user }));
      if (type === 'github') setEditingGithub(false);
      if (type === 'leetcode') setEditingLeetcode(false);
    } catch (err) {
      console.error(err);
      alert(err.message);
      // Could add toast here via a passed showToast, omitted for brevity
    }
  };

  return (
    <aside className={`left-panel ${!isPanelOpen ? 'closed' : ''}`}>
      <div style={{ display: 'flex', flexDirection: isPanelOpen ? 'row' : 'column-reverse', alignItems: 'center', justifyContent: isPanelOpen ? 'space-between' : 'center', gap: isPanelOpen ? '0' : '16px', padding: isPanelOpen ? '16px' : '16px 0', borderBottom: '1px solid var(--border-subtle)', minHeight: '72px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="logo-icon-bg">
            <Zap size={20} color="#ffffff" />
          </div>
          {isPanelOpen && (
            <span className="logo-text" style={{ fontSize: '18px', fontWeight: 'bold' }}>DevPulse</span>
          )}
        </div>
        <button onClick={() => setIsPanelOpen(!isPanelOpen)} style={{ background: 'var(--surface-1)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', transition: 'all 0.2s ease' }}>
          <Menu size={20} />
        </button>
      </div>

      <div className="user-profile-card">
        {githubData?.avatarUrl ? (
          <img src={githubData.avatarUrl} alt="avatar" style={{width: 40, height: 40, borderRadius: '50%'}} />
        ) : (
          <div className="user-avatar">M</div>
        )}
        <div className="user-info">
          <span className="user-name">{githubData?.username || userCredentials?.name?.split(' ')[0] || "Developer"}</span>
          <span className="user-role">Full Stack Developer</span>
          <div className="user-status-container">
            <div className="status-dot"></div>
            <span className="status-text">Online</span>
          </div>
        </div>
      </div>




      <div className="sidebar-content">
        <div className="integration-card">
          <div className="card-header">
            <span className="card-label">GITHUB STATS</span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {userCredentials?.github && !editingGithub && (
                <button onClick={() => setEditingGithub(true)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }} title="Edit GitHub Username">
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Connect GitHub to track your commits and repos.</p>
              <input
                placeholder="GitHub Username"
                value={githubInput}
                onChange={(e) => setGithubInput(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: '13px' }}
              />
              <button
                onClick={() => { setGithubConnecting(true); connectService('github').finally(() => setGithubConnecting(false)); }}
                disabled={!githubInput || githubConnecting}
                style={{ width: '100%', background: 'linear-gradient(135deg, #2ea043, #238636)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
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
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Commits</span>
                      <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981' }}>{githubData.totalCommits}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Repositories</span>
                      <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{githubData.publicRepos}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Active Days</span>
                      <span style={{ 
                        fontSize: Number(githubData.activeDays) > 0 ? '16px' : '13px', 
                        fontWeight: Number(githubData.activeDays) > 0 ? 'bold' : 'normal',
                        color: Number(githubData.activeDays) > 0 ? '#10b981' : 'var(--text-muted)'
                      }}>
                        {Number(githubData.activeDays) > 0 ? `🔥 ${githubData.activeDays}` : "Start your activity today!"}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Languages</span>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{githubData.languages?.join(', ') || '--'}</span>
                    </div>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '16px' }}>Last updated: just now</div>
                </>
              )}
              {editingGithub && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Update your GitHub Username.</p>
                  <input
                    placeholder="New GitHub Username"
                    value={githubInput}
                    onChange={(e) => setGithubInput(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: '13px' }}
                  />
                  <button
                    onClick={() => { setGithubConnecting(true); connectService('github').finally(() => setGithubConnecting(false)); }}
                    disabled={!githubInput || githubConnecting}
                    style={{ width: '100%', background: 'linear-gradient(135deg, #2ea043, #238636)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                  >
                    {githubConnecting ? 'Updating...' : 'Update GitHub'}
                  </button>
                  <button
                    onClick={() => setEditingGithub(false)}
                    style={{ width: '100%', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '4px' }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="integration-card">
          <div className="card-header">
            <span className="card-label">PROBLEM SOLVING</span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {userCredentials?.leetcode && !editingLeetcode && (
                <button onClick={() => setEditingLeetcode(true)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }} title="Edit LeetCode Username">
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Connect LeetCode to track your problem solving stats.</p>
              <input
                placeholder="LeetCode Username"
                value={leetcodeInput}
                onChange={(e) => setLeetcodeInput(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: '13px' }}
              />
              <button
                onClick={() => { setLeetcodeConnecting(true); connectService('leetcode').finally(() => setLeetcodeConnecting(false)); }}
                disabled={!leetcodeInput || leetcodeConnecting}
                style={{ width: '100%', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
              >
                {leetcodeConnecting ? 'Connecting...' : 'Connect LeetCode'}
              </button>
            </div>
          ) : (
            <>
              {!leetcodeData ? (
                <div className="shimmer-loader" style={{ height: '40px', marginTop: '8px' }}></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                  {/* Total Solved */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontSize: '28px', fontWeight: '800', color: 'var(--accent-orange)', letterSpacing: '-1px' }}>
                      {leetcodeData?.total ?? 0}
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>Problems Solved</span>
                  </div>
                  
                  {/* Difficulty Graph */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                      <span style={{ color: '#10b981', fontWeight: '500' }}>Easy</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{leetcodeData?.easy ?? 0}</span>
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'var(--surface-2)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(((leetcodeData?.easy ?? 0) / (leetcodeData?.total || 1)) * 100, 100)}%`, height: '100%', background: '#10b981' }}></div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginTop: '4px' }}>
                      <span style={{ color: '#f59e0b', fontWeight: '500' }}>Medium</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{leetcodeData?.medium ?? 0}</span>
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'var(--surface-2)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(((leetcodeData?.medium ?? 0) / (leetcodeData?.total || 1)) * 100, 100)}%`, height: '100%', background: '#f59e0b' }}></div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginTop: '4px' }}>
                      <span style={{ color: '#ef4444', fontWeight: '500' }}>Hard</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{leetcodeData?.hard ?? 0}</span>
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'var(--surface-2)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(((leetcodeData?.hard ?? 0) / (leetcodeData?.total || 1)) * 100, 100)}%`, height: '100%', background: '#ef4444' }}></div>
                    </div>
                  </div>

                  {/* Contest Rating */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Rating</span>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{leetcodeData?.rating ?? '--'}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Top</span>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{leetcodeData?.top ?? '--'}%</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Global Rank</span>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{leetcodeData?.globalRank ?? '--'}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Highest</span>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{leetcodeData?.highestRating ?? '--'}</span>
                    </div>
                  </div>

                </div>
              )}
              {editingLeetcode && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Update your LeetCode Username.</p>
                  <input
                    placeholder="New LeetCode Username"
                    value={leetcodeInput}
                    onChange={(e) => setLeetcodeInput(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: '13px' }}
                  />
                  <button
                    onClick={() => { setLeetcodeConnecting(true); connectService('leetcode').finally(() => setLeetcodeConnecting(false)); }}
                    disabled={!leetcodeInput || leetcodeConnecting}
                    style={{ width: '100%', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                  >
                    {leetcodeConnecting ? 'Updating...' : 'Update LeetCode'}
                  </button>
                  <button
                    onClick={() => setEditingLeetcode(false)}
                    style={{ width: '100%', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '4px' }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
