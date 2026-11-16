import React, { useState, FormEvent, RefObject } from 'react';
import {
  Send,
  Plus,
  Pin,
  Edit2,
  Check,
  X,
  MessageSquare
} from 'lucide-react';
import ChatMessage from './ChatMessage';
import { Conversation, UserCredentials, ChatMessage as ChatMessageType } from '../../types';

interface ChatInterfaceProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  isStreaming: boolean;
  input: string;
  setInput: (val: string) => void;
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  submitMessage: (msg: string) => void;
  userCredentials?: UserCredentials | null;
  briefLoading?: boolean;
  activeConversation?: Conversation | null;
  createNewThread?: (title?: string) => Promise<any>;
  renameThread?: (id: string, newTitle: string) => Promise<void>;
  togglePinThread?: (id: string, currentPinned: boolean) => Promise<void>;
}

export default function ChatInterface({
  messages,
  isLoading,
  isStreaming,
  input,
  setInput,
  inputRef,
  messagesEndRef,
  submitMessage,
  userCredentials,
  briefLoading,
  activeConversation,
  createNewThread,
  renameThread,
  togglePinThread
}: ChatInterfaceProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  const convId = activeConversation?.id || activeConversation?._id;

  const handleStartEditTitle = () => {
    setTitleDraft(activeConversation?.title || 'New Coaching Session');
    setIsEditingTitle(true);
  };

  const handleSaveTitle = () => {
    if (titleDraft.trim() && convId && renameThread) {
      renameThread(convId, titleDraft.trim());
    }
    setIsEditingTitle(false);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const userMessage = input.trim();
    if (!userMessage) return;
    setInput('');
    submitMessage(userMessage);
  };

  const firstName = userCredentials?.name?.split(' ')[0] || '';

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
                {activeConversation?.title || 'New Coaching Session'}
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
          {/* New Chat Button */}
          {createNewThread && (
            <button
              onClick={() => createNewThread('New Coaching Session')}
              className="header-new-chat-btn"
              title="Start a new chat thread"
            >
              <Plus size={14} />
              <span>New Chat</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Clean Chat Messages Container ─────────────────────────────────── */}
      <main className="chat-container">
        {messages.length === 0 ? (
          <div className="chat-empty-clean">
            <div className="chat-empty-icon-wrap">
              <MessageSquare size={26} color="#3b82f6" />
            </div>
            <h3>How can I help you today{firstName ? `, ${firstName}` : ''}?</h3>
            <p>Ask anything about coding, system design, DSA, debugging, or interview prep.</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <ChatMessage key={index} msg={msg} />
          ))
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

      {/* ─── Clean Input Area ─────────────────────────────────────────────── */}
      <div className="input-area">
        <form className="input-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="input-field"
            ref={inputRef as RefObject<HTMLInputElement>}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask DevPulse anything (DSA, system design, code review, career)..."
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
