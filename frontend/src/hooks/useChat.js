import { useState, useRef } from 'react';
import { streamAIChat } from '../services/aiService';

export function useChat(githubData, leetcodeData, userCredentials) {
  const firstName = userCredentials?.name?.split(' ')[0] || 'User';

  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: `Hello, ${firstName}. I'm DevPulse, your Own AI developer coach. What are we working on today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = (activeTab) => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const submitMessage = async (userMessage) => {
    if (!userMessage.trim() || isLoading || isStreaming) return;

    // 1. Add user message to state
    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: userTime }]);
    setIsLoading(true);

    try {
      // 2. Request streaming response from backend
      // Backend now handles system instructions securely using user context
      const response = await streamAIChat(userMessage);

      // 4. Get stream reader and text decoder
      const reader = response.getReader();
      const decoder = new TextDecoder('utf-8');

      let fullText = '';
      const aiTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Add empty AI message slot to list
      setIsLoading(false);
      setIsStreaming(true);
      setMessages(prev => [...prev, { role: 'ai', content: '', timestamp: aiTime }]);

      // 5. Read incoming text stream chunk-by-chunk
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode binary chunk to text and append
        const newChunk = decoder.decode(value, { stream: true });
        fullText += newChunk;

        // Update UI live
        setMessages(prev => {
          const list = [...prev];
          list[list.length - 1] = { ...list[list.length - 1], content: fullText };
          return list;
        });
      }
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
    messages,
    input,
    setInput,
    isLoading,
    isStreaming,
    messagesEndRef,
    inputRef,
    submitMessage,
    scrollToBottom,
  };
}
