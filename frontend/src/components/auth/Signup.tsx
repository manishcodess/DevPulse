import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Zap, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { API_BASE_URL } from '../../config';
import { apiFetch } from '../../utils/api';
import { UserCredentials } from '../../types';

interface SignupProps {
  onSignup: (user: UserCredentials) => void;
  onSwitchToLogin: () => void;
}

export default function Signup({ onSignup, onSwitchToLogin }: SignupProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiFetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      onSignup(data.user);
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-bg">
            <Zap size={22} color="#ffffff" />
          </div>
          <h1 className="auth-title">Create an Account</h1>
          <p className="auth-subtitle">Join DevPulse to level up your developer journey.</p>
        </div>

        {error && (
          <div className="auth-error-banner">
            {error}
          </div>
        )}

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
                Create Account
                <ArrowRight size={18} className="btn-icon" />
              </>
            )}
          </button>
        </form>
        
        <p className="auth-footer">
          Already have an account? <span className="auth-link" onClick={onSwitchToLogin}>Log in</span>
        </p>
      </div>
    </div>
  );
}

