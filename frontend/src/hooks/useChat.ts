import { useState, useRef, useEffect, useCallback } from 'react';
import { streamAIChat } from '../services/aiService';
import {
  fetchConversations,
  fetchConversation,
  createConversation,
  updateConversation,
  deleteConversation
} from '../services/conversationService';
import { ToastFn, UserCredentials, Conversation, ChatMessage } from '../types';

export type ChatMsg = ChatMessage;

export function useChat(
  userCredentials?: UserCredentials | null,
  dailyBrief?: string,
  briefLoading?: boolean,
  showToast?: ToastFn
) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState<boolean>(false);

  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const getConvId = (conv: Conversation | null | undefined): string => conv?.id || conv?._id || '';

  // ─── 1. Load Conversations List ─────────────────────────────────────────────
  const loadConversations = useCallback(async (selectId: string | null = null) => {
    if (!userCredentials?.id && !userCredentials?._id && !userCredentials?.name) return;
    setConversationsLoading(true);
    try {
      const list = await fetchConversations();
      setConversations(list);

      if (list.length > 0) {
        const targetId = selectId || (activeConversationId && list.some(c => getConvId(c) === activeConversationId)
          ? activeConversationId
          : getConvId(list[0]));
        setActiveConversationId(targetId);
      } else {
        const initial = await createConversation({
          title: 'Daily Check-in & Career Prep',
          category: 'general'
        });
        if (initial) {
          setConversations([initial]);
          setActiveConversationId(getConvId(initial));
          setActiveConversation(initial);
          setMessages(initial.messages || []);
        }
      }
    } catch (err: any) {
      console.warn('Could not load conversations:', err.message);
    } finally {
      setConversationsLoading(false);
    }
  }, [userCredentials, activeConversationId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

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
      } catch (err: any) {
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

  const scrollToBottom = (activeTab?: string) => {
    if (activeTab === 'chat' || !activeTab) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // ─── 4. Conversation Operations ─────────────────────────────────────────────
  const createNewThread = async (title = 'New Coaching Session', category = 'general') => {
    try {
      const newConv = await createConversation({ title, category });
      if (newConv) {
        const newId = getConvId(newConv);
        setConversations(prev => [newConv, ...prev]);
        setActiveConversationId(newId);
        setActiveConversation(newConv);
        setMessages(newConv.messages || []);
        if (showToast) showToast(`Started new thread: "${newConv.title}"`, 'success');
        setTimeout(() => inputRef.current?.focus(), 50);
        return newConv;
      }
    } catch (err: any) {
      console.error('Failed to create new conversation:', err);
      if (showToast) showToast(err.message || 'Failed to create chat', 'error');
    }
  };

  const selectThread = (convId: string) => {
    if (convId === activeConversationId || isLoading || isStreaming) return;
    setActiveConversationId(convId);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const renameThread = async (convId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    try {
      const updated = await updateConversation(convId, { title: newTitle.trim() });
      if (updated) {
        setConversations(prev => prev.map(c => getConvId(c) === convId ? { ...c, title: updated.title } : c));
        if (activeConversationId === convId) {
          setActiveConversation(prev => prev ? { ...prev, title: updated.title } : prev);
        }
        if (showToast) showToast('Thread renamed!', 'success');
      }
    } catch (err: any) {
      console.error('Failed to rename thread:', err);
      if (showToast) showToast(err.message || 'Failed to rename thread', 'error');
    }
  };

  const togglePinThread = async (convId: string, currentPinned: boolean) => {
    try {
      const updated = await updateConversation(convId, { pinned: !currentPinned });
      if (updated) {
        setConversations(prev => {
          const list = prev.map(c => getConvId(c) === convId ? { ...c, pinned: updated.pinned } : c);
          return list.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
        });
        if (activeConversationId === convId) {
          setActiveConversation(prev => prev ? { ...prev, pinned: updated.pinned } : prev);
        }
        if (showToast) showToast(updated.pinned ? 'Thread pinned to top!' : 'Thread unpinned', 'info');
      }
    } catch (err: any) {
      console.error('Failed to pin thread:', err);
    }
  };

  const deleteThread = async (convId: string) => {
    try {
      await deleteConversation(convId);
      const remaining = conversations.filter(c => getConvId(c) !== convId);
      setConversations(remaining);

      if (activeConversationId === convId) {
        if (remaining.length > 0) {
          setActiveConversationId(getConvId(remaining[0]));
        } else {
          await createNewThread('New Coaching Session', 'general');
        }
      }
      if (showToast) showToast('Thread deleted', 'info');
    } catch (err: any) {
      console.error('Failed to delete thread:', err);
      if (showToast) showToast(err.message || 'Failed to delete thread', 'error');
    }
  };

  const updateCategory = async (convId: string, category: string) => {
    try {
      const updated = await updateConversation(convId, { category });
      if (updated) {
        setConversations(prev => prev.map(c => getConvId(c) === convId ? { ...c, category: updated.category } : c));
        if (activeConversationId === convId) {
          setActiveConversation(prev => prev ? { ...prev, category: updated.category } : prev);
        }
      }
    } catch (err: any) {
      console.error('Failed to update category:', err);
    }
  };

  // ─── 5. Submit Message (Streaming & Auto Persistence) ──────────────────────
  const submitMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading || isStreaming) return;

    let targetConvId = activeConversationId;
    if (!targetConvId) {
      const created = await createNewThread('New Coaching Session', 'general');
      if (created) targetConvId = getConvId(created);
    }

    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updatedMessages: ChatMessage[] = [...messages, { role: 'user', content: userMessage, timestamp: userTime }];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const history = updatedMessages
        .filter(m => m.content && m.content.trim())
        .map(m => ({
          role: m.role === 'ai' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));

      const activeCat = activeConversation?.category || 'general';
      const stream = await streamAIChat(history, targetConvId, activeCat);
      if (!stream) throw new Error('No response stream returned from server');

      const reader = stream.getReader();
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

    } catch (error: any) {
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
