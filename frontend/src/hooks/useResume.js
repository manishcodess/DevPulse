import { useState, useRef } from 'react';
import { generateAIContent } from '../services/aiService';
import { readFileAsBase64, readFileAsText } from '../utils/file';
import { API_BASE_URL } from '../config';

export function useResume(showToast, userCredentials, setUserCredentials) {
  const [resumeAnalysis, setResumeAnalysis] = useState("");
  const [resumeLoading, setResumeLoading] = useState(false);
  const fileInputRef = useRef(null);

  const analyzeResume = async (text, pdfBase64 = null) => {
    setResumeLoading(true);
    setResumeAnalysis("");
    try {
      const promptText = `You are a Senior Technical Recruiter and Hiring Manager at a top-tier tech company.
      Review the provided Software Engineering resume comprehensively, focusing on education, experience, impact, and projects.
      
      ${text ? text.slice(0, 3000) : 'See attached PDF.'}
      
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
      if (pdfBase64) {
        parts.unshift({
          inlineData: {
            data: pdfBase64,
            mimeType: "application/pdf"
          }
        });
      }

      const analysisText = await generateAIContent(parts);
      setResumeAnalysis(analysisText);
      showToast("Resume analyzed ✨");

      // Save to DB for context injection
      if (userCredentials) {
        const token = localStorage.getItem('devpulse_token');
        if (token) {
          try {
            const res = await fetch(`${API_BASE_URL}/auth/resume`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ resumeContext: analysisText })
            });
            const data = await res.json();
            if (data.success) {
              setUserCredentials(data.user);
            }
          } catch (err) {
            console.error("Failed to save resume context", err);
          }
        }
      }

    } catch {
      setResumeAnalysis("SCORE: 0/10\n\nONE LINE VERDICT: Failed to analyze resume.");
      showToast("Failed to analyze resume", "error");
    } finally {
      setResumeLoading(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    
    try {
      if (file.type === "application/pdf") {
        const base64Data = await readFileAsBase64(file);
        await analyzeResume("", base64Data);
      } else {
        const text = await readFileAsText(file);
        await analyzeResume(text, null);
      }
    } catch (err) {
      console.error("Error reading file:", err);
      showToast("Failed to read file", "error");
    }
  };

  return {
    resumeAnalysis,
    resumeLoading,
    fileInputRef,
    handleResumeUpload
  };
}
