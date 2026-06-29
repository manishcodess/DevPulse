import React, { useState } from 'react';
import { Code2, User, ArrowRight, Save } from 'lucide-react';

export default function Onboarding({ onComplete }) {
  const [formData, setFormData] = useState({
    github: '',
    leetcode: ''
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
      const token = localStorage.getItem('devpulse_token');
      const response = await fetch('http://localhost:3001/api/auth/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          githubUsername: formData.github,
          leetcodeUsername: formData.leetcode
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update profiles');

      onComplete(data.user);
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
      
      <div className="auth-card" style={{ maxWidth: '480px' }}>
        <div className="auth-header">
          <div className="auth-logo-bg" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <Save size={24} color="#ffffff" />
          </div>
          <h1 className="auth-title">Complete Your Profile</h1>
          <p className="auth-subtitle">Link your developer profiles to unlock personalized insights and stats.</p>
        </div>

        {error && (
          <div style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center', marginBottom: '16px', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px' }}>
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <User className="input-icon" size={18} />
            <input 
              type="text" 
              name="github"
              placeholder="GitHub Username (e.g. octocat)" 
              className="auth-input"
              value={formData.github}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <Code2 className="input-icon" size={18} />
            <input 
              type="text" 
              name="leetcode"
              placeholder="LeetCode Username (e.g. leetcode_user)" 
              className="auth-input"
              value={formData.leetcode}
              onChange={handleChange}
              required
            />
          </div>

          <button 
            type="submit" 
            className={`auth-submit-btn ${isSubmitting ? 'loading' : ''}`}
            disabled={isSubmitting}
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', marginTop: '16px' }}
          >
            {isSubmitting ? (
              <div className="auth-spinner"></div>
            ) : (
              <>
                Save & Continue
                <ArrowRight size={18} className="btn-icon" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
