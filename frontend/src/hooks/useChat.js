import { useState, useRef } from 'react';
import { streamAIChat, buildSystemPrompt } from '../services/aiService';

export function useChat(githubData, leetcodeData, userCredentials) {
  const userName = userCredentials?.name?.split(' ')[0] || "User";
  const [messages, setMessages] = useState([
    { 
      role: 'ai', 
      content: `Hello, ${userName}. I am DevPulse, your AI developer coach. Let's crush those goals. What are we working on today?`,
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
      const systemInstruction = buildSystemPrompt(githubData, leetcodeData, userCredentials);
      const stream = await streamAIChat(userMessage, systemInstruction);
      
      let fullText = '';
      let isFirstChunk = true;
      const aiTimestamp = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});

      const reader = stream.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.text) {
                if (isFirstChunk) {
                  setIsLoading(false);
                  setIsStreaming(true);
                  isFirstChunk = false;
                  setMessages((prev) => [
                    ...prev,
                    { role: 'ai', content: '', timestamp: aiTimestamp }
                  ]);
                }

                const text = parsed.text;
                for (let i = 0; i < text.length; i++) {
                  fullText += text[i];
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].content = fullText;
                    return newMessages;
                  });
                  await new Promise(resolve => setTimeout(resolve, 5));
                }
              }
            } catch (err) {
              console.error("Error parsing SSE:", err);
            }
          }
        }
      }

      setIsStreaming(false);
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
