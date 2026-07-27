import { useState, useRef } from 'react';
import { streamAIChat, buildSystemPrompt } from '../services/aiService';

// useChat manages all chat state and the SSE (streaming) logic.
// It is called once in App.jsx and exposes state + the submitMessage function.
export function useChat(githubData, leetcodeData, userCredentials) {
  const firstName = userCredentials?.name?.split(' ')[0] || 'User';

  // Chat history — each message has a role ('user' or 'ai'), content, and timestamp
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: `Hello, ${firstName}. I'm DevPulse, your AI developer coach. What are we working on today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);   // True: waiting for first chunk
  const [isStreaming, setIsStreaming] = useState(false); // True: receiving chunks

  const messagesEndRef = useRef(null); // Used to scroll to bottom after new messages
  const inputRef = useRef(null);       // Used to focus the input box (e.g. Ctrl+K)

  // Smoothly scrolls the chat to the latest message
  const scrollToBottom = (activeTab) => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const submitMessage = async (userMessage) => {
    if (!userMessage.trim() || isLoading || isStreaming) return;

    // 1. Add the user's message to the chat immediately
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp }]);
    setIsLoading(true);

    try {
      // 2. Build the system prompt (gives AI context about the user's stats)
      const systemInstruction = buildSystemPrompt(githubData, leetcodeData, userCredentials);

      // 3. Open a streaming connection to the backend
      // streamAIChat returns response.body, which is a ReadableStream
      const stream = await streamAIChat(userMessage, systemInstruction);

      // 4. Read the stream chunk by chunk using the Streams API
      const reader = stream.getReader();
      const decoder = new TextDecoder('utf-8');

      let fullText = '';
      let aiMessageAdded = false;
      const aiTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Each chunk is raw bytes — decode to a string
        const chunkStr = decoder.decode(value, { stream: true });

        // The backend sends SSE format: "data: {...}\n\n"
        // We split by newline and process each line
        for (const line of chunkStr.split('\n')) {
          if (!line.startsWith('data: ') || line === 'data: [DONE]') continue;

          try {
            const parsed = JSON.parse(line.slice(6)); // Remove "data: " prefix
            if (!parsed.text) continue;

            // On the very first chunk: stop the loading spinner and add an empty AI message
            if (!aiMessageAdded) {
              setIsLoading(false);
              setIsStreaming(true);
              aiMessageAdded = true;
              setMessages(prev => [...prev, { role: 'ai', content: '', timestamp: aiTimestamp }]);
            }

            // Append text character-by-character to create a typewriter effect
            for (const char of parsed.text) {
              fullText += char;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...updated[updated.length - 1], content: fullText };
                return updated;
              });
              await new Promise(resolve => setTimeout(resolve, 5)); // 5ms delay per character
            }
          } catch {
            // Ignore malformed SSE lines
          }
        }
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { role: 'ai', content: `Sorry, I'm having trouble connecting. Error: ${error.message}` },
      ]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  return { messages, input, setInput, isLoading, isStreaming, messagesEndRef, inputRef, submitMessage, scrollToBottom };
}
