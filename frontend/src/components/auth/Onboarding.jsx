import React, { useState } from 'react';
import { Code2, User, ArrowRight, Save, MessageSquare, FileText } from 'lucide-react';
import { generateAIContent } from '../../services/aiService';
import { readFileAsBase64, readFileAsText } from '../../utils/file';
import { API_BASE_URL } from '../../config';

export default function Onboarding({ onComplete, onSkip }) {
  const [formData, setFormData] = useState({
    github: '',
    leetcode: '',
    bio: ''
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoadingText("Saving profile...");
    setError(null);

    let generatedResumeContext = undefined;

    try {
      if (resumeFile) {
        setLoadingText("Analyzing resume via AI...");
        const promptText = `You are a Senior Technical Recruiter and Hiring Manager at a top-tier tech company.
      Review the provided Software Engineering resume comprehensively, focusing on education, experience, impact, and projects.
      
      ${resumeFile.type !== "application/pdf" ? (await readFileAsText(resumeFile)).slice(0, 3000) : 'See attached PDF.'}
      
      Provide your objective evaluation in EXACTLY the following format:
      SCORE: X/10
      
      STRONG POINTS (3 bullet points):
      - 
      
      WEAK POINTS (3 bullet points):
      - 
      
      MISSING KEYWORDS (comma separated, max 8 - only include highly relevant industry keywords that are missing):
      
      ONE LINE VERDICT:
      [Provide a single, highly actionable, professional sentence on what the candidate must do to improve their chances of passing an ATS and recruiter screen.]`;
        
        const parts = [{ text: promptText }];
        if (resumeFile.type === "application/pdf") {
          const pdfBase64 = await readFileAsBase64(resumeFile);
          parts.unshift({
            inlineData: {
              data: pdfBase64,
              mimeType: "application/pdf"
            }
          });
        }

        const generatedText = await generateAIContent(parts);
        generatedResumeContext = generatedText;
      }

      setLoadingText("Finalizing setup...");
      const token = localStorage.getItem('devpulse_token');
      const response = await fetch(`${API_BASE_URL}/auth/onboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          githubUsername: formData.github,
          leetcodeUsername: formData.leetcode,
          bio: formData.bio,
          resumeContext: generatedResumeContext
        })
      });

      const contentType = response.headers.get('content-type');
      let data = {};
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server returned error (${response.status}): ${text.slice(0, 100)}`);
      }

      if (!response.ok) throw new Error(data.error || 'Failed to update profiles');

      onComplete(data.user);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong during onboarding.");
    } finally {
      setIsSubmitting(false);
      setLoadingText("");
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
              placeholder="GitHub Username (e.g. manishcodess)" 
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
              placeholder="LeetCode Username (e.g. manishsharmacodes)" 
              className="auth-input"
              value={formData.leetcode}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group" style={{ alignItems: 'flex-start' }}>
            <MessageSquare className="input-icon" size={18} style={{ marginTop: '14px' }} />
            <textarea 
              name="bio"
              placeholder="Tell me about yourself (Optional). E.g. 'I am a backend dev trying to learn React...'" 
              className="auth-input"
              value={formData.bio}
              onChange={handleChange}
              style={{ minHeight: '80px', resize: 'vertical', paddingTop: '12px' }}
            />
          </div>

          <div className="input-group" style={{ position: 'relative', cursor: 'pointer' }}>
            <FileText className="input-icon" size={18} style={{ zIndex: 2 }} />
            <input 
              type="file" 
              accept=".pdf,.txt"
              onChange={(e) => setResumeFile(e.target.files[0])}
              style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer',
                zIndex: 3
              }}
              title="Add Resume"
            />
            <div 
              className="auth-input" 
              style={{ 
                padding: '12px 16px 12px 44px', 
                color: resumeFile ? '#fff' : '#71717a',
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              {resumeFile ? resumeFile.name : "Add Resume"}
            </div>
          </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button 
                type="submit" 
                className={`auth-submit-btn ${isSubmitting ? 'loading' : ''}`} 
                disabled={isSubmitting}
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', flex: '1' }}
              >
                {isSubmitting ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="auth-spinner"></div>
                    <span style={{ fontSize: '14px' }}>{loadingText}</span>
                  </div>
                ) : (
                  <>
                    Save & Continue
                    <ArrowRight size={18} className="btn-icon" />
                  </>
                )}
              </button>
              <button 
                type="button" 
                onClick={onSkip}
                style={{
                  background: 'var(--surface-2)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  flex: '1',
                  cursor: 'pointer',
                }}
              >
                Skip
              </button>
            </div>
        </form>
      </div>
    </div>
  );
}
