import React from 'react';
import { Zap, ExternalLink, Menu } from 'lucide-react';

export default function LeftPanel({ isPanelOpen, setIsPanelOpen, githubData, leetcodeData, userCredentials }) {
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
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '32px', fontWeight: 'bold', color:'green' , letterSpacing: '-1px' }}>
                {leetcodeData?.total ?? 0}
              </span>
              <span style={{ fontSize: '15px', color: 'var(--text-muted)' }}>total solved</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '4px' }}>
              <span className="pill" style={{ fontSize: '11px', padding: '4px 8px' }}>LeetCode: {leetcodeData?.total ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
