import { useState, useRef } from 'react';
import { generateAIContent } from '../services/aiService';
import { readFileAsBase64, readFileAsText } from '../utils/file';
import { buildResumePrompt } from '../utils/prompts';
import { API_BASE_URL } from '../config';
import { apiFetch } from '../utils/api';

export function useResume(showToast, userCredentials, setUserCredentials) {
  const [resumeAnalysis, setResumeAnalysis] = useState("");
  const [resumeLoading, setResumeLoading] = useState(false);
  const fileInputRef = useRef(null);

  const analyzeResume = async (text, pdfBase64 = null) => {
    setResumeLoading(true);
    setResumeAnalysis("");
    try {
      const promptText = buildResumePrompt(text);
      
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
        try {
          const res = await apiFetch(`${API_BASE_URL}/auth/resume`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ resumeContext: analysisText })
          });
          const data = await res.json();
          if (data.success) {
            setUserCredentials(data.user);
          }
        } catch (err) {
          console.error("Failed to save resume context", err.message);
        }
      }

    } catch (err) {
      setResumeAnalysis("SCORE: 0/10\n\nONE LINE VERDICT: Failed to analyze resume.");
      showToast(`Failed to analyze resume: ${err.message}`, "error");
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
