import { useState, useRef } from 'react';
import { ai, buildSystemPrompt } from '../services/aiService';

export function useChat(githubData, leetcodeData, gfgData) {
  const [messages, setMessages] = useState([
    { 
      role: 'ai', 
      content: "Hello, Manish. I am DevPulse, your AI developer coach. Let's crush those goals. What are we working on today?",
      timestamp: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})
    }
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

    const userTimestamp = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    setMessages((prev) => [...prev, { role: 'user', content: userMessage, timestamp: userTimestamp }]);
    setIsLoading(true);

    try {
      const responseStream = await ai.models.generateContentStream({
        model: "gemini-3.1-flash-lite",
        contents: userMessage,
        config: {
          systemInstruction: buildSystemPrompt(githubData, leetcodeData, gfgData),
        },
      });

      let fullText = '';
      let isFirstChunk = true;
      const aiTimestamp = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});

      for await (const chunk of responseStream) {
        if (isFirstChunk) {
          setIsLoading(false);
          setIsStreaming(true);
          isFirstChunk = false;
          setMessages((prev) => [
            ...prev,
            { role: 'ai', content: '', timestamp: aiTimestamp }
          ]);
        }
        
        const text = chunk.text;
        for (let i = 0; i < text.length; i++) {
          fullText += text[i];
          setMessages((prev) => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = { 
              ...newMessages[newMessages.length - 1],
              content: fullText 
            };
            return newMessages;
          });
          // 15ms delay per character for a "medium" reading speed
          await new Promise(r => setTimeout(r, 15));
        }
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: `Sorry, I am having trouble connecting. Error: ${error.message}` }
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
    scrollToBottom
  };
}
