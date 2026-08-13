import React, { useMemo } from 'react';
import { parseResumeAnalysis } from '../../utils/resumeParser';

const formatText = (text) => {
  if (!text) return text;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

export default function ResumeReview({
  fileInputRef,
  handleResumeUpload,
  resumeLoading,
  resumeAnalysis
}) {
  // Memoize the parsing logic so it only recalculates when resumeAnalysis changes
  const parsedAnalysis = useMemo(() => {
    return parseResumeAnalysis(resumeAnalysis);
  }, [resumeAnalysis]);

  const renderResumeAnalysis = () => {
    if (!parsedAnalysis) return null;
    
    const { score, scoreColor, strongPoints, weakPoints, keywords, verdict } = parsedAnalysis;

    return (
      <div className="resume-analysis-container">
        <div className="resume-score-card" style={{ borderColor: scoreColor }}>
          <div className="resume-score-label">Resume Score</div>
          <div className="resume-score-value" style={{ color: scoreColor }}>{score}/10</div>
        </div>
        
        <div className="resume-feedback-grid">
          <div className="feedback-card strong">
            <h3>Strong Points</h3>
            <ul style={{ fontSize: '13.5px', lineHeight: 1.5 }}>
              {strongPoints.map((p, i) => (
                <li key={i} style={{ marginBottom: '6px' }}>{formatText(p.replace('-','').trim())}</li>
              ))}
            </ul>
          </div>
          <div className="feedback-card weak">
            <h3>Areas to Improve</h3>
            <ul style={{ fontSize: '13.5px', lineHeight: 1.5 }}>
              {weakPoints.map((p, i) => (
                <li key={i} style={{ marginBottom: '6px' }}>{formatText(p.replace('-','').trim())}</li>
              ))}
            </ul>
          </div>
        </div>

        {keywords.length > 0 && (
          <div className="resume-keywords-section">
            <h3>Suggested Missing Keywords</h3>
            <div className="keyword-pills">
              {keywords.map((k, i) => <span key={i} className="pill pill-hard">{k}</span>)}
            </div>
          </div>
        )}

        {verdict && (
          <div className="resume-verdict-box" style={{ fontSize: '14px', lineHeight: 1.5 }}>
            <strong>Verdict:</strong> {formatText(verdict)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="resume-container">
      <div 
        className="upload-dropzone" 
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          accept=".pdf,.txt" 
          hidden 
          ref={fileInputRef} 
          onChange={handleResumeUpload} 
        />
        <div className="upload-icon">📄</div>
        <div>Drop your resume PDF/TXT here or click to upload</div>
        <div className="upload-subtext">(Basic text extraction works for .txt and text-based PDFs)</div>
      </div>

      {resumeLoading && (
        <div className="resume-loading">
          <div className="shimmer-loader" style={{ height: '200px' }}></div>
          <p style={{textAlign:'center', marginTop:'16px', color:'var(--text-muted)'}}>DevPulse is reviewing your resume against 20+ LPA standards...</p>
        </div>
      )}

      {!resumeLoading && parsedAnalysis && renderResumeAnalysis()}
    </div>
  );
}
