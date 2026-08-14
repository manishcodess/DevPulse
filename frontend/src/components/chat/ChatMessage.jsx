import React from 'react';
import ReactMarkdown from 'react-markdown';

export default function ChatMessage({ msg }) {
  return (
    <div className={`message-wrapper ${msg.role}`}>
      <div className={`message-group ${msg.role}`}>
        {msg.role === 'ai' && <div className="message-label">DevPulse</div>}
        <div className={`message ${msg.role}`}>
          <div className="message-content">
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        </div>
        {msg.timestamp && <div className="message-timestamp">{msg.timestamp}</div>}
      </div>
    </div>
  );
}
