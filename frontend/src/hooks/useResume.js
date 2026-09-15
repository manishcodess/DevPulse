import { useState, useRef } from 'react';
import { generateAIContent, matchResumeWithJD } from '../services/aiService';
import { readFileAsBase64, readFileAsText } from '../utils/file';
import { buildResumePrompt } from '../utils/prompts';
import { API_BASE_URL } from '../config';
import { apiFetch } from '../utils/api';

export function useResume(showToast, userCredentials, setUserCredentials) {
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('Backend Engineer at Stripe');
  const [analysisMode, setAnalysisMode] = useState('jd_match'); // 'jd_match' | 'general'
  const fileInputRef = useRef(null);

  const handleFileChange = (file) => {
    if (!file) return;
    setSelectedFile(file);
    showToast(`Loaded: ${file.name}`, 'info');
  };

  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    handleFileChange(file);
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const runAnalysis = async (customJD = null) => {
    const activeJD = (customJD !== null ? customJD : jobDescription).trim();

    if (!selectedFile && !userCredentials?.resumeContext) {
      showToast('Please upload a resume (PDF or TXT) to begin analysis', 'error');
      fileInputRef.current?.click();
      return;
    }

    if (analysisMode === 'jd_match' && !activeJD) {
      showToast('Please enter a Target Role or Job Description (e.g. "Backend Engineer at Stripe")', 'error');
      return;
    }

    setResumeLoading(true);
    setResumeAnalysis(null);

    try {
      let textContent = '';
      let pdfBase64 = null;

      if (selectedFile) {
        if (selectedFile.type === 'application/pdf') {
          pdfBase64 = await readFileAsBase64(selectedFile);
        } else {
          textContent = await readFileAsText(selectedFile);
        }
      }

      if (analysisMode === 'jd_match') {
        const parts = [];
        if (pdfBase64) {
          parts.push({
            inlineData: {
              data: pdfBase64,
              mimeType: 'application/pdf'
            }
          });
        }
        if (textContent) {
          parts.push({ text: textContent });
        }

        const matchResult = await matchResumeWithJD(parts.length ? parts : undefined, activeJD, textContent);
        setResumeAnalysis(matchResult);
        showToast(`Target Match Analysis Ready: ${matchResult.matchScore}% ATS Score 🎯`);

        // Refresh userCredentials if updated on backend
        if (userCredentials) {
          try {
            const meRes = await apiFetch(`${API_BASE_URL}/auth/me`, { credentials: 'include' });
            const meData = await meRes.json();
            if (meData.user) {
              setUserCredentials(meData.user);
            }
          } catch (e) {
            console.warn('Could not refresh user context after resume match:', e.message);
          }
        }
      } else {
        // Classic General Health Check
        const promptText = buildResumePrompt(textContent);
        const parts = [{ text: promptText }];
        if (pdfBase64) {
          parts.unshift({
            inlineData: {
              data: pdfBase64,
              mimeType: 'application/pdf'
            }
          });
        }

        const analysisText = await generateAIContent(parts);
        setResumeAnalysis(analysisText);
        showToast('General resume health audit completed ✨');

        // Save context
        if (userCredentials) {
          try {
            const res = await apiFetch(`${API_BASE_URL}/auth/resume`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ resumeContext: analysisText })
            });
            const data = await res.json();
            if (data.success) {
              setUserCredentials(data.user);
            }
          } catch (err) {
            console.error('Failed to save resume context', err.message);
          }
        }
      }
    } catch (err) {
      console.error('Resume Analysis Error:', err);
      showToast(`Analysis failed: ${err.message}`, 'error');
    } finally {
      setResumeLoading(false);
    }
  };

  return {
    resumeAnalysis,
    resumeLoading,
    selectedFile,
    jobDescription,
    setJobDescription,
    analysisMode,
    setAnalysisMode,
    fileInputRef,
    handleResumeUpload,
    handleFileChange,
    clearSelectedFile,
    runAnalysis
  };
}

