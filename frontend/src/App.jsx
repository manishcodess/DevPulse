import { useState, useEffect } from 'react';
import { Menu, Zap, LogOut } from 'lucide-react';
import { useDevData } from './hooks/useDevData';
import { useChat } from './hooks/useChat';
import { API_BASE_URL } from './config';
import { useResume } from './hooks/useResume';
import Toast from './components/layout/Toast';
import LeftPanel from './components/layout/LeftPanel';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import ChatInterface from './components/chat/ChatInterface';
import ResumeReview from './components/resume/ResumeReview';
import Signup from './components/auth/Signup';
import Login from './components/auth/Login';
import Onboarding from './components/auth/Onboarding';

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userCredentials, setUserCredentials] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(window.innerWidth > 768);
  const [toast, setToast] = useState(null);
  const [skipOnboarding, setSkipOnboarding] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── Cookie‑based auth check ───────────────────────────────────────
  useEffect(() => {
    // No token needed; the auth cookie (HttpOnly) is sent automatically
    fetch(`${API_BASE_URL}/auth/me`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUserCredentials(data.user);
          setIsAuthenticated(true);
        } else {
          // If the server responded without a user, ensure the UI reflects logged‑out state
          setIsAuthenticated(false);
          setUserCredentials(null);
        }
      })
      .catch(err => {
        console.error('Auth check failed:', err);
        setIsAuthenticated(false);
        setUserCredentials(null);
      });
  }, []);

  const handleAuth = (data) => {
    setUserCredentials(data);
    setIsAuthenticated(true);
    showToast(`Welcome, ${data.name.split(' ')[0]}!`);
    navigate('/chat');
  };

  const handleOnboardingComplete = (data) => {
    setUserCredentials(data);
    showToast(`Profiles linked successfully!`);
    navigate('/chat');
  };

  const handleOnboardingSkip = () => {
    setSkipOnboarding(true);
    showToast('Onboarding skipped. You can connect accounts later.');
    navigate('/chat');
  };
  // Logout handler that clears HttpOnly cookie via backend
  const handleLogout = () => {
    fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' })
      .then(() => {
        setIsAuthenticated(false);
        setUserCredentials(null);
        showToast('Logged out successfully', 'info');
        navigate('/login');
      })
      .catch(err => {
        console.error('Logout failed:', err);
        showToast('Logout failed', 'error');
      });
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
  } = useChat(githubData, leetcodeData, userCredentials, dailyBrief, briefLoading);

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
        navigate('/chat');
        setTimeout(() => inputRef.current?.focus(), 10);
      } else if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        navigate('/resume');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputRef, navigate]);

  useEffect(() => {
    if (location.pathname === '/chat') {
      scrollToBottom('chat');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, isLoading, isStreaming, location.pathname]);

  if (!isAuthenticated && location.pathname !== '/login' && location.pathname !== '/signup') {
    return <Navigate to="/signup" replace />;
  }

  if (isAuthenticated && (!userCredentials?.github || !userCredentials?.leetcode) && !skipOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  if (isAuthenticated && (location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/')) {
     return <Navigate to="/chat" replace />;
  }

  return (
    <>
      <Toast toast={toast} />
      <Routes>
        <Route path="/signup" element={<Signup onSignup={handleAuth} onSwitchToLogin={() => navigate('/login')} />} />
        <Route path="/login" element={<Login onLogin={handleAuth} onSwitchToSignup={() => navigate('/signup')} />} />
        <Route path="/onboarding" element={<Onboarding onComplete={handleOnboardingComplete} onSkip={handleOnboardingSkip} />} />
        
        <Route path="/*" element={
          <div className="layout-container">
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
              logout={handleLogout}
              setUserCredentials={setUserCredentials}
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
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <Link to="/chat" className={`tab-btn ${location.pathname === '/chat' ? 'active' : ''}`}>💬 Coach Chat <span style={{fontSize:'10px', opacity:0.5, marginLeft:'4px'}}>Ctrl+K</span></Link>
                    <Link to="/resume" className={`tab-btn ${location.pathname === '/resume' ? 'active' : ''}`}>📄 Resume Review <span style={{fontSize:'10px', opacity:0.5, marginLeft:'4px'}}>Ctrl+R</span></Link>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {githubData?.avatarUrl ? (
                      <img src={githubData.avatarUrl} alt="avatar" style={{width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--border-color)'}} title={githubData?.username || userCredentials?.name?.split(' ')[0] || "Developer"} />
                    ) : (
                      <div className="user-avatar" style={{width: 32, height: 32, fontSize: '14px', border: '1px solid var(--border-color)'}} title={userCredentials?.name || "Developer"}>
                        {(userCredentials?.name || "M")[0].toUpperCase()}
                      </div>
                    )}
                    <button onClick={handleLogout} className="logout-btn-attractive">
                      <LogOut size={16} /> Log Out
                    </button>
                  </div>
                </div>

                <Routes>
                  <Route path="/chat" element={
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
                      briefLoading={briefLoading}
                    />
                  } />
                  <Route path="/resume" element={
                    <ResumeReview 
                      fileInputRef={fileInputRef}
                      handleResumeUpload={handleResumeUpload}
                      resumeLoading={resumeLoading}
                      resumeAnalysis={resumeAnalysis}
                    />
                  } />
                </Routes>
              </div>
            </main>
          </div>
        } />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
