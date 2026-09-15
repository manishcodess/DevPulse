import { useState, useRef, useEffect, useCallback } from 'react';
import { streamAIChat } from '../services/aiService';
import {
  fetchConversations,
  fetchConversation,
  createConversation,
  updateConversation,
  deleteConversation
} from '../services/conversationService';

export function useChat(githubData, leetcodeData, userCredentials, dailyBrief, briefLoading, showToast) {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // ─── 1. Load Conversations List ─────────────────────────────────────────────
  const loadConversations = useCallback(async (selectId = null) => {
    if (!userCredentials?.id && !userCredentials?._id && !userCredentials?.name) return;
    setConversationsLoading(true);
    try {
      const list = await fetchConversations();
      setConversations(list);

      if (list.length > 0) {
        // Pick requested ID, or current active ID, or the first conversation
        const targetId = selectId || (activeConversationId && list.some(c => c.id === activeConversationId) ? activeConversationId : list[0].id);
        setActiveConversationId(targetId);
      } else {
        // Create initial default conversation
        const initial = await createConversation({
          title: 'Daily Check-in & Career Prep',
          category: 'general'
        });
        if (initial) {
          setConversations([initial]);
          setActiveConversationId(initial.id);
          setActiveConversation(initial);
          setMessages(initial.messages || []);
        }
      }
    } catch (err) {
      console.warn('Could not load conversations:', err.message);
    } finally {
      setConversationsLoading(false);
    }
  }, [userCredentials, activeConversationId]);

  useEffect(() => {
    loadConversations();
  }, [userCredentials]); // Load once user credentials are ready

  // ─── 2. Load Active Conversation Messages ──────────────────────────────────
  useEffect(() => {
    if (!activeConversationId) return;

    let isMounted = true;
    (async () => {
      try {
        const fullConv = await fetchConversation(activeConversationId);
        if (isMounted && fullConv) {
          setActiveConversation(fullConv);
          setMessages(fullConv.messages || []);
        }
      } catch (err) {
        console.warn(`Failed to load conversation ${activeConversationId}:`, err.message);
      }
    })();

    return () => { isMounted = false; };
  }, [activeConversationId]);

  // ─── 3. Integrate Daily Brief into Active Conversation ─────────────────────
  useEffect(() => {
    if (dailyBrief && activeConversationId) {
      setMessages(prev => {
        if (prev.some(m => m.isDailyBrief || m.content === dailyBrief)) return prev;
        return [{
          role: 'ai',
          content: dailyBrief,
          isDailyBrief: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }, ...prev];
      });
    }
  }, [dailyBrief, activeConversationId]);

  const scrollToBottom = (activeTab) => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // ─── 4. Conversation Operations ─────────────────────────────────────────────
  const createNewThread = async (title = 'New Coaching Session', category = 'general') => {
    try {
      const newConv = await createConversation({ title, category });
      if (newConv) {
        setConversations(prev => [newConv, ...prev]);
        setActiveConversationId(newConv.id);
        setActiveConversation(newConv);
        setMessages(newConv.messages || []);
        if (showToast) showToast(`Started new thread: "${newConv.title}"`, 'success');
        setTimeout(() => inputRef.current?.focus(), 50);
        return newConv;
      }
    } catch (err) {
      console.error('Failed to create new conversation:', err);
      if (showToast) showToast(err.message || 'Failed to create chat', 'error');
    }
  };

  const selectThread = (convId) => {
    if (convId === activeConversationId || isLoading || isStreaming) return;
    setActiveConversationId(convId);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const renameThread = async (convId, newTitle) => {
    if (!newTitle.trim()) return;
    try {
      const updated = await updateConversation(convId, { title: newTitle.trim() });
      if (updated) {
        setConversations(prev => prev.map(c => c.id === convId ? { ...c, title: updated.title } : c));
        if (activeConversationId === convId) {
          setActiveConversation(prev => prev ? { ...prev, title: updated.title } : prev);
        }
        if (showToast) showToast('Thread renamed!', 'success');
      }
    } catch (err) {
      console.error('Failed to rename thread:', err);
      if (showToast) showToast(err.message || 'Failed to rename thread', 'error');
    }
  };

  const togglePinThread = async (convId, currentPinned) => {
    try {
      const updated = await updateConversation(convId, { pinned: !currentPinned });
      if (updated) {
        setConversations(prev => {
          const list = prev.map(c => c.id === convId ? { ...c, pinned: updated.pinned } : c);
          return list.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
        });
        if (activeConversationId === convId) {
          setActiveConversation(prev => prev ? { ...prev, pinned: updated.pinned } : prev);
        }
        if (showToast) showToast(updated.pinned ? 'Thread pinned to top!' : 'Thread unpinned', 'info');
      }
    } catch (err) {
      console.error('Failed to pin thread:', err);
    }
  };

  const deleteThread = async (convId) => {
    try {
      await deleteConversation(convId);
      const remaining = conversations.filter(c => c.id !== convId);
      setConversations(remaining);

      if (activeConversationId === convId) {
        if (remaining.length > 0) {
          setActiveConversationId(remaining[0].id);
        } else {
          // If no threads remain, create a fresh one
          await createNewThread('New Coaching Session', 'general');
        }
      }
      if (showToast) showToast('Thread deleted', 'info');
    } catch (err) {
      console.error('Failed to delete thread:', err);
      if (showToast) showToast(err.message || 'Failed to delete thread', 'error');
    }
  };

  const updateCategory = async (convId, category) => {
    try {
      const updated = await updateConversation(convId, { category });
      if (updated) {
        setConversations(prev => prev.map(c => c.id === convId ? { ...c, category: updated.category } : c));
        if (activeConversationId === convId) {
          setActiveConversation(prev => prev ? { ...prev, category: updated.category } : prev);
        }
      }
    } catch (err) {
      console.error('Failed to update category:', err);
    }
  };

  // ─── 5. Submit Message (Streaming & Auto Persistence) ──────────────────────
  const submitMessage = async (userMessage) => {
    if (!userMessage.trim() || isLoading || isStreaming) return;

    let targetConvId = activeConversationId;

    // If somehow no active conversation exists, create one first
    if (!targetConvId) {
      const created = await createNewThread('New Coaching Session', 'general');
      if (created) targetConvId = created.id;
    }

    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updatedMessages = [...messages, { role: 'user', content: userMessage, timestamp: userTime }];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Build conversation history for Gemini
      const history = updatedMessages
        .filter(m => m.content && m.content.trim())
        .map(m => ({
          role: m.role === 'ai' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));

      const activeCat = activeConversation?.category || 'general';
      const response = await streamAIChat(history, targetConvId, activeCat);

      const reader = response.getReader();
      const decoder = new TextDecoder('utf-8');

      let fullText = '';
      const aiTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setIsLoading(false);
      setIsStreaming(true);
      setMessages(prev => [...prev, { role: 'ai', content: '', timestamp: aiTime }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const newChunk = decoder.decode(value, { stream: true });
        fullText += newChunk;

        setMessages(prev => {
          const list = [...prev];
          list[list.length - 1] = { ...list[list.length - 1], content: fullText };
          return list;
        });
      }

      // Schedule a background refresh of the conversation list to catch auto-titles and summaries
      setTimeout(() => {
        fetchConversations().then(latest => {
          if (latest) setConversations(latest);
        }).catch(() => {});
      }, 2500);

    } catch (error) {
      setMessages(prev => [
        ...prev,
        { role: 'ai', content: `Connection error: ${error.message}` },
      ]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  return {
    conversations,
    activeConversationId,
    activeConversation,
    conversationsLoading,
    messages,
    input,
    setInput,
    isLoading,
    isStreaming,
    messagesEndRef,
    inputRef,
    submitMessage,
    scrollToBottom,
    createNewThread,
    selectThread,
    renameThread,
    togglePinThread,
    deleteThread,
    updateCategory,
    refreshConversations: loadConversations
  };
}
