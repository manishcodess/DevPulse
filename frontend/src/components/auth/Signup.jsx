import React, { useState } from 'react';
import { Zap, Github, Code2, Mail, Lock, User, ArrowRight } from 'lucide-react';

export default function Signup({ onSignup }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    github: '',
    leetcode: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate network delay for effect
    setTimeout(() => {
      setIsSubmitting(false);
      onSignup(formData);
    }, 1200);
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
          <h1 className="auth-title">Welcome to DevPulse</h1>
          <p className="auth-subtitle">Your AI developer coach is waiting. Let's get started.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <User className="input-icon" size={18} />
            <input 
              type="text" 
              name="name"
              placeholder="Full Name" 
              className="auth-input"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

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

          <div className="auth-divider">
            <span>Developer Profiles</span>
          </div>

          <div className="input-group">
            <Github className="input-icon" size={18} />
            <input 
              type="text" 
              name="github"
              placeholder="GitHub Username" 
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
              placeholder="LeetCode Username" 
              className="auth-input"
              value={formData.leetcode}
              onChange={handleChange}
            />
          </div>

          <button 
            type="submit" 
            className={`auth-submit-btn ${isSubmitting ? 'loading' : ''}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="auth-spinner"></div>
            ) : (
              <>
                Create Account
                <ArrowRight size={18} className="btn-icon" />
              </>
            )}
          </button>
        </form>
        
        <p className="auth-footer">
          Already have an account? <span className="auth-link">Log in</span>
        </p>
      </div>
    </div>
  );
}
