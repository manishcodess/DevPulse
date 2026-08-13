import React from 'react';
import { Bot } from 'lucide-react';

export default function RightPanel({ dailyBrief, briefLoading, userCredentials }) {
  const isConnected = userCredentials?.github && userCredentials?.leetcode;

  return (
    <aside className="right-panel" style={{ padding: '20px', overflowY: 'auto' }}>
      <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick Overview</div>
      
      <div className="ai-brief-card" style={{ marginBottom: 0, flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="brief-bot-icon">
            <Bot size={18} color="currentColor" />
          </div>
          <div className="brief-title" style={{ marginBottom: 0 }}>AI Daily Brief</div>
        </div>
        <div className="brief-content">
          {!isConnected ? (
            <div className="brief-text" style={{ opacity: 0.8 }}>
              Connect LeetCode and GitHub to get your personalized daily AI brief.
            </div>
          ) : briefLoading ? (
            <div className="shimmer-loader"></div>
          ) : (
            <div className="brief-text">{dailyBrief}</div>
          )}
        </div>
      </div>
    </aside>
  );
}
