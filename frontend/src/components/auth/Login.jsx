import React, { useState } from 'react';
import { Zap, Mail, Lock, ArrowRight } from 'lucide-react';

export default function Login({ onLogin, onSwitchToSignup }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed');
      
      localStorage.setItem('devpulse_token', data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-blob blob-1"></div>
        <div className="auth-blob blob-2"></div>
      </div>
      
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-bg">
            <Zap size={24} color="#ffffff" />
          </div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Log in to continue your developer journey.</p>
        </div>

        {error && (
          <div style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center', marginBottom: '16px', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px' }}>
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <Mail className="input-icon" size={18} />
            <input 
              type="email" 
              name="email"
              placeholder="Email Address" 
              className="auth-input"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <Lock className="input-icon" size={18} />
            <input 
              type="password" 
              name="password"
              placeholder="Password" 
              className="auth-input"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button 
            type="submit" 
            className={`auth-submit-btn ${isSubmitting ? 'loading' : ''}`}
            disabled={isSubmitting}
            style={{ marginTop: '16px' }}
          >
            {isSubmitting ? (
              <div className="auth-spinner"></div>
            ) : (
              <>
                Log In
                <ArrowRight size={18} className="btn-icon" />
              </>
            )}
          </button>
        </form>
        
        <p className="auth-footer">
          Don't have an account? <span className="auth-link" onClick={onSwitchToSignup}>Sign up</span>
        </p>
      </div>
    </div>
  );
}
