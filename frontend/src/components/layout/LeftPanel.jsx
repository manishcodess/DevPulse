import React from 'react';
import { Zap, ExternalLink, Menu } from 'lucide-react';

export default function LeftPanel({ isPanelOpen, setIsPanelOpen, githubData, leetcodeData, userCredentials, logout }) {
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
      {/* Logout Button */}
      <button
        onClick={logout}
        style={{
          marginTop: '12px',
          width: '100%',
          padding: '8px',
          background: 'var(--danger)',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: '600'
        }}
      >
        Log Out
      </button>

      {/* GitHub Summary */}
      {githubData && (
        <div className="github-summary" style={{ marginBottom: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Repos: {githubData.publicRepos} | Commits: {githubData.totalCommits} | Streak: {githubData.streak}
          </div>
          <a href={`https://github.com/${githubData?.username || userCredentials?.github || 'github'}`} target="_blank" rel="noreferrer" style={{ marginTop: '6px', display: 'inline-block', color: 'var(--primary)', textDecoration: 'underline' }}>
            View GitHub
          </a>
        </div>
      )}
      <div className="sidebar-content">
        <div className="integration-card">
          <div className="card-header">
            <span className="card-label">GITHUB STATS</span>
            <a href={`https://github.com/${githubData?.username || userCredentials?.github || 'github'}`} target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)' }}>
              <ExternalLink size={14} />
            </a>
          </div>
          
          {!githubData ? (
            <div className="shimmer-loader" style={{ height: '40px', marginTop: '8px' }}></div>
          ) : (
            <>
              <div className="dev-stats-grid">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Commits</span>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'green' }}>{githubData.totalCommits}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Repositories</span>
                  <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{githubData.publicRepos}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Current Streak</span>
                  <span style={{ 
                    fontSize: Number(githubData.streak) > 0 ? '16px' : '13px', 
                    fontWeight: Number(githubData.streak) > 0 ? 'bold' : 'normal',
                    color: Number(githubData.streak) > 0 ? 'inherit' : 'var(--text-muted)'
                  }}>
                    {Number(githubData.streak) > 0 ? `🔥 ${githubData.streak}` : "Start your streak today!"}
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
        </div>

        <div className="integration-card">
          <div className="card-header">
            <span className="card-label">PROBLEM SOLVING</span>
          </div>
          
          {/* LeetCode Detailed Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            {/* Total Solved */}
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>
              {leetcodeData?.total ?? 0} Problems Solved
            </div>
            {/* Difficulty Graph */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                Easy {" ".repeat(10 - Math.min(leetcodeData?.easy ?? 0, 10))}█{"█".repeat(Math.min(leetcodeData?.easy ?? 0, 10))} {leetcodeData?.easy ?? 0}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                Medium {" ".repeat(10 - Math.min(leetcodeData?.medium ?? 0, 10))}█{"█".repeat(Math.min(leetcodeData?.medium ?? 0, 10))} {leetcodeData?.medium ?? 0}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                Hard {" ".repeat(10 - Math.min(leetcodeData?.hard ?? 0, 10))}█{"█".repeat(Math.min(leetcodeData?.hard ?? 0, 10))} {leetcodeData?.hard ?? 0}
              </div>
            </div>
            {/* Contest Rating */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
              <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>🏅 Contest Rating</div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Rating {leetcodeData?.rating ?? '--'}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Top {leetcodeData?.top ?? '--'}%</div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Global Rank {leetcodeData?.globalRank ?? '--'}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Highest Rating {leetcodeData?.highestRating ?? '--'}</div>
            </div>
            {/* View Profile Link */}
            <a href={leetcodeData?.profileUrl || `https://leetcode.com/${leetcodeData?.username || ''}`} target="_blank" rel="noreferrer"
               style={{ marginTop: '6px', color: 'var(--primary)', textDecoration: 'underline', fontSize: '14px' }}>
              View Profile
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}
