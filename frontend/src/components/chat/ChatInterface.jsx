import React from 'react';
import { Send } from 'lucide-react';

const SUGGESTED_PROMPTS = [
  "How do I get my first 20 LPA job?",
  "What mistakes should I avoid this year?",
  "How to master Dynamic Programming?",
  "Roast my GitHub profile"
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
  userCredentials
}) {
  const userName = userCredentials?.name?.split(' ')[0] || "User";
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
    <>
      <div className="greeting-section">
        <h2 className="greeting-text">{getGreeting()}, {userName} 👋</h2>
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
                <button key={i} className="prompt-chip" onClick={() => handleSuggestedPrompt(prompt)} disabled={isLoading || isStreaming}>
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
        <form className="input-container" onSubmit={handleSubmit}>
          <input
            type="text"
            className="input-field"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your future self..."
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
