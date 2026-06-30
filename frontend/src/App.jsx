import { useState, useEffect } from 'react';
import { Menu, Zap } from 'lucide-react';
import { useDevData } from './hooks/useDevData';
import { useChat } from './hooks/useChat';
import { API_BASE_URL } from './config';
import { useResume } from './hooks/useResume';
import Toast from './components/layout/Toast';
import LeftPanel from './components/layout/LeftPanel';
import RightPanel from './components/layout/RightPanel';
import ChatInterface from './components/chat/ChatInterface';
import ResumeReview from './components/resume/ResumeReview';
import Signup from './components/auth/Signup';
import Login from './components/auth/Login';
import Onboarding from './components/auth/Onboarding';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState('signup'); // 'signup' or 'login'
  const [userCredentials, setUserCredentials] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [isPanelOpen, setIsPanelOpen] = useState(window.innerWidth > 768);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const token = localStorage.getItem('devpulse_token');
    if (token) {
      fetch(`${API_BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUserCredentials(data.user);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('devpulse_token');
        }
      })
      .catch(err => {
        console.error("Auth check failed:", err);
      });
    }
  }, []);

  const handleAuth = (data) => {
    setUserCredentials(data);
    setIsAuthenticated(true);
    showToast(`Welcome, ${data.name.split(' ')[0]}!`);
  };

  const handleOnboardingComplete = (data) => {
    setUserCredentials(data);
    showToast(`Profiles linked successfully!`);
  };

  const { githubData, leetcodeData, dailyBrief, briefLoading } = useDevData(showToast, userCredentials);
  
  const {
    messages,
    input,
    setInput,
    isLoading,
    isStreaming,
    messagesEndRef,
    inputRef,
    submitMessage,
    scrollToBottom
  } = useChat(githubData, leetcodeData, userCredentials);

  const {
    resumeAnalysis,
    resumeLoading,
    fileInputRef,
    handleResumeUpload
  } = useResume(showToast, userCredentials, setUserCredentials);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  useEffect(() => {
    document.title = messages.length > 1 
      ? `DevPulse (${messages.length - 1} msgs) — Your Dev Coach`
      : "DevPulse — Your Dev Coach";
  }, [messages]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        setActiveTab('chat');
        setTimeout(() => inputRef.current?.focus(), 10);
      } else if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        setActiveTab('resume');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputRef]);

  useEffect(() => {
    scrollToBottom(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, isLoading, isStreaming, activeTab]);

  if (!isAuthenticated) {
    return (
      <>
        <Toast toast={toast} />
        {authView === 'signup' ? (
          <Signup onSignup={handleAuth} onSwitchToLogin={() => setAuthView('login')} />
        ) : (
          <Login onLogin={handleAuth} onSwitchToSignup={() => setAuthView('signup')} />
        )}
      </>
    );
  }

  if (isAuthenticated && (!userCredentials?.github || !userCredentials?.leetcode)) {
    return (
      <>
        <Toast toast={toast} />
        <Onboarding onComplete={handleOnboardingComplete} />
      </>
    );
  }

  return (
    <div className="layout-container">
      <Toast toast={toast} />
      
      <div 
        className={`mobile-overlay ${!isPanelOpen ? 'hidden' : ''}`}
        onClick={() => setIsPanelOpen(false)}
      />
      
      <LeftPanel 
        isPanelOpen={isPanelOpen}
        setIsPanelOpen={setIsPanelOpen}
        githubData={githubData} 
        leetcodeData={leetcodeData} 
        userCredentials={userCredentials}
      />

      <div className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="logo-icon-bg" style={{ width: '32px', height: '32px', borderRadius: '8px' }}>
            <Zap size={16} color="#ffffff" />
          </div>
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>DevPulse</span>
        </div>
        <button onClick={() => setIsPanelOpen(true)} className="mobile-menu-btn">
          <Menu size={24} />
        </button>
      </div>

      <main className="main-content" style={{ position: 'relative' }}>
        <div className="app-container">
          <div className="tabs-container">
             <button className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>💬 Coach Chat <span style={{fontSize:'10px', opacity:0.5, marginLeft:'4px'}}>Ctrl+K</span></button>
             <button className={`tab-btn ${activeTab === 'resume' ? 'active' : ''}`} onClick={() => setActiveTab('resume')}>📄 Resume Review <span style={{fontSize:'10px', opacity:0.5, marginLeft:'4px'}}>Ctrl+R</span></button>
          </div>

          {activeTab === 'chat' && (
            <ChatInterface 
              messages={messages}
              isLoading={isLoading}
              isStreaming={isStreaming}
              input={input}
              setInput={setInput}
              inputRef={inputRef}
              messagesEndRef={messagesEndRef}
              submitMessage={submitMessage}
              getGreeting={getGreeting}
              userCredentials={userCredentials}
            />
          )}

          {activeTab === 'resume' && (
            <ResumeReview 
              fileInputRef={fileInputRef}
              handleResumeUpload={handleResumeUpload}
              resumeLoading={resumeLoading}
              resumeAnalysis={resumeAnalysis}
            />
          )}
        </div>
      </main>
      
      <RightPanel dailyBrief={dailyBrief} briefLoading={briefLoading} />
    </div>
  );
}

export default App;
