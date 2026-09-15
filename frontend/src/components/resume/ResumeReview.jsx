import React, { useMemo, useState } from 'react';
import { 
  FileText, 
  Target, 
  Briefcase, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  X, 
  UploadCloud, 
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  RotateCcw
} from 'lucide-react';
import { parseResumeAnalysis } from '../../utils/resumeParser';

const PRESET_ROLES = [
  "Backend Engineer at Stripe",
  "Full-Stack SDE-2 at Google",
  "Frontend Engineer (React / Next.js)",
  "Systems & Cloud Engineer (AWS / Kubernetes)",
  "AI & LLM Backend Engineer (Python / FastAPI)"
];

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
  handleFileChange,
  clearSelectedFile,
  selectedFile,
  jobDescription,
  setJobDescription,
  analysisMode,
  setAnalysisMode,
  runAnalysis,
  resumeLoading,
  resumeAnalysis,
  userCredentials
}) {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Memoize the parsing logic so it only recalculates when resumeAnalysis changes
  const parsedAnalysis = useMemo(() => {
    return parseResumeAnalysis(resumeAnalysis);
  }, [resumeAnalysis]);

  const handleCopyBullet = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const renderStructuredMatchResults = () => {
    if (!parsedAnalysis) return null;
    const {
      score,
      scoreColor,
      matchTier,
      targetRole,
      matchingSkills,
      missingSkills,
      strengths,
      weaknesses,
      starBulletImprovements,
      atsRecommendations,
      verdict
    } = parsedAnalysis;

    return (
      <div className="ats-results-container">
        {/* Score & Verdict Hero Card */}
        <div className="ats-hero-card" style={{ '--score-color': scoreColor }}>
          <div className="ats-score-badge-group">
            <div className="ats-radial-gauge" style={{ borderColor: scoreColor }}>
              <span className="ats-radial-score" style={{ color: scoreColor }}>{score}%</span>
              <span className="ats-radial-label">ATS MATCH</span>
            </div>
            
            <div className="ats-hero-details">
              <div className="ats-target-pill">
                <Target size={14} />
                <span>Target: <strong>{targetRole || jobDescription || 'Target Role'}</strong></span>
              </div>
              <h2 className="ats-tier-title" style={{ color: scoreColor }}>
                {matchTier}
              </h2>
              {verdict && (
                <p className="ats-verdict-summary">
                  {formatText(verdict)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Skills Alignment Matrix: Matching vs Missing */}
        <div className="ats-skills-grid">
          {/* Matching Skills */}
          <div className="ats-skill-card match-card">
            <div className="ats-card-header">
              <div className="ats-header-icon match-icon">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <h3>Matching Verified Skills ({matchingSkills.length})</h3>
                <span className="ats-card-sub">Present in your resume & aligned with target role</span>
              </div>
            </div>
            <div className="ats-tags-wrapper">
              {matchingSkills.length > 0 ? (
                matchingSkills.map((skill, i) => (
                  <span key={i} className="ats-skill-tag match-tag">
                    <Check size={13} className="tag-check" />
                    {skill}
                  </span>
                ))
              ) : (
                <p className="empty-subtext">No direct keyword matches detected. Consider updating tech stack phrasing.</p>
              )}
            </div>
          </div>

          {/* Missing Skills & Keyword Gaps */}
          <div className="ats-skill-card gap-card">
            <div className="ats-card-header">
              <div className="ats-header-icon gap-icon">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3>Missing Critical Skills & Gaps ({missingSkills.length})</h3>
                <span className="ats-card-sub">Keywords required or strongly favored for this role</span>
              </div>
            </div>
            <div className="ats-tags-wrapper">
              {missingSkills.length > 0 ? (
                missingSkills.map((skill, i) => (
                  <span key={i} className="ats-skill-tag gap-tag" title="Add this to your resume or projects">
                    + {skill}
                  </span>
                ))
              ) : (
                <p className="empty-subtext">No critical skill gaps found! Great job!</p>
              )}
            </div>
          </div>
        </div>

        {/* Strengths & Weaknesses Breakdown */}
        {(strengths.length > 0 || weaknesses.length > 0) && (
          <div className="ats-eval-grid">
            {strengths.length > 0 && (
              <div className="ats-eval-card strengths-card">
                <h4><Sparkles size={16} color="#22c55e" /> Key Strengths for this Role</h4>
                <ul>
                  {strengths.map((item, idx) => (
                    <li key={idx}>{formatText(item.replace(/^-\s*/, ''))}</li>
                  ))}
                </ul>
              </div>
            )}
            {weaknesses.length > 0 && (
              <div className="ats-eval-card weaknesses-card">
                <h4><TrendingUp size={16} color="#f59e0b" /> Areas Needing More Depth</h4>
                <ul>
                  {weaknesses.map((item, idx) => (
                    <li key={idx}>{formatText(item.replace(/^-\s*/, ''))}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* STAR-Method Bullet Point Optimizer */}
        {starBulletImprovements.length > 0 && (
          <div className="ats-star-section">
            <div className="ats-section-heading">
              <div className="section-title-with-icon">
                <Zap size={20} color="#3b82f6" />
                <div>
                  <h3>STAR-Method Bullet Point Optimizer</h3>
                  <p>AI-rewritten resume bullets transforming passive statements into high-impact, quantifiable achievements.</p>
                </div>
              </div>
            </div>

            <div className="ats-star-list">
              {starBulletImprovements.map((item, idx) => (
                <div key={idx} className="ats-star-card">
                  <div className="star-card-before">
                    <span className="star-label before">Original / Standard Phrasing</span>
                    <p className="star-content">{item.original}</p>
                  </div>

                  <div className="star-card-divider">
                    <ArrowRight size={18} />
                  </div>

                  <div className="star-card-after">
                    <div className="star-after-header">
                      <span className="star-label after">✨ Optimized STAR Impact (Quantifiable)</span>
                      <button 
                        className="copy-bullet-btn" 
                        onClick={() => handleCopyBullet(item.improved, idx)}
                        title="Copy to clipboard"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check size={14} color="#22c55e" />
                            <span style={{ color: '#22c55e' }}>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            <span>Copy Bullet</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="star-content improved">{item.improved}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ATS Scanner Recommendations */}
        {atsRecommendations.length > 0 && (
          <div className="ats-recommendations-card">
            <div className="rec-header">
              <ShieldCheck size={18} color="#6366f1" />
              <h4>ATS Scanner & Recruiter Optimization Checklist</h4>
            </div>
            <ul className="rec-list">
              {atsRecommendations.map((rec, i) => (
                <li key={i} className="rec-item">
                  <span className="rec-bullet">{i + 1}</span>
                  <span>{formatText(rec.replace(/^-\s*/, ''))}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderGeneralAnalysis = () => {
    if (!parsedAnalysis) return null;
    const { score, scoreColor, strongPoints, weakPoints, keywords, verdict } = parsedAnalysis;

    return (
      <div className="resume-analysis-container">
        <div className="resume-score-card" style={{ borderColor: scoreColor }}>
          <div className="resume-score-label">General Resume Health Score</div>
          <div className="resume-score-value" style={{ color: scoreColor }}>{score}/10</div>
        </div>
        
        <div className="resume-feedback-grid">
          <div className="feedback-card strong">
            <h3>Strong Points</h3>
            <ul style={{ fontSize: '13.5px', lineHeight: 1.5 }}>
              {strongPoints.map((p, i) => (
                <li key={i} style={{ marginBottom: '6px' }}>{formatText(p.replace('-', '').trim())}</li>
              ))}
            </ul>
          </div>
          <div className="feedback-card weak">
            <h3>Areas to Improve</h3>
            <ul style={{ fontSize: '13.5px', lineHeight: 1.5 }}>
              {weakPoints.map((p, i) => (
                <li key={i} style={{ marginBottom: '6px' }}>{formatText(p.replace('-', '').trim())}</li>
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
      {/* Mode Switcher Tabs */}
      <div className="resume-mode-tabs">
        <button 
          className={`resume-mode-tab ${analysisMode === 'jd_match' ? 'active' : ''}`}
          onClick={() => setAnalysisMode('jd_match')}
        >
          <Target size={16} />
          <span>🎯 Target Job & ATS Matcher</span>
          <span className="badge-pro">High ROI</span>
        </button>

        <button 
          className={`resume-mode-tab ${analysisMode === 'general' ? 'active' : ''}`}
          onClick={() => setAnalysisMode('general')}
        >
          <FileText size={16} />
          <span>📋 360° Resume Health Audit</span>
        </button>
      </div>

      {/* Dual-Input Configuration Grid */}
      <div className="dual-input-grid">
        {/* Left Column: Upload Resume */}
        <div className="input-column-card">
          <div className="column-card-header">
            <div className="col-icon-wrap">
              <FileText size={18} color="#3b82f6" />
            </div>
            <div>
              <h3>1. Candidate Resume</h3>
              <p>Upload your latest software engineering resume (.pdf or .txt)</p>
            </div>
          </div>

          <div 
            className={`upload-dropzone-dual ${isDragOver ? 'drag-active' : ''} ${selectedFile ? 'has-file' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !selectedFile && fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              accept=".pdf,.txt" 
              hidden 
              ref={fileInputRef} 
              onChange={handleResumeUpload} 
            />

            {selectedFile ? (
              <div className="selected-file-badge">
                <div className="file-info-group">
                  <div className="file-doc-icon">
                    <FileText size={22} color="#60a5fa" />
                  </div>
                  <div>
                    <div className="file-name" title={selectedFile.name}>{selectedFile.name}</div>
                    <div className="file-meta">{(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type.includes('pdf') ? 'PDF Document' : 'Text File'}</div>
                  </div>
                </div>
                
                <div className="file-actions">
                  <button 
                    type="button" 
                    className="change-file-btn" 
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  >
                    Change
                  </button>
                  <button 
                    type="button" 
                    className="remove-file-btn" 
                    onClick={(e) => { e.stopPropagation(); clearSelectedFile(); }}
                    title="Remove file"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="dropzone-empty-state">
                <div className="upload-icon-pulse">
                  <UploadCloud size={28} color="#94a3b8" />
                </div>
                <div className="dropzone-primary-text">Drag & drop your resume here, or <span className="highlight-browse">browse</span></div>
                <div className="dropzone-secondary-text">PDF and TXT supported (up to 5MB)</div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Target Job Description / Target Role */}
        <div className="input-column-card">
          <div className="column-card-header">
            <div className="col-icon-wrap">
              <Briefcase size={18} color="#10b981" />
            </div>
            <div>
              <h3>2. Target Job / Role</h3>
              <p>Enter a role (e.g. "Backend Engineer at Stripe") or paste full JD</p>
            </div>
          </div>

          <div className="jd-input-container">
            {analysisMode === 'jd_match' ? (
              <>
                <div className="jd-preset-chips">
                  <span className="preset-label">Quick select:</span>
                  {PRESET_ROLES.map((role, idx) => (
                    <button 
                      key={idx} 
                      type="button" 
                      className={`preset-chip ${jobDescription === role ? 'selected' : ''}`}
                      onClick={() => setJobDescription(role)}
                    >
                      {role}
                    </button>
                  ))}
                </div>

                <textarea
                  className="jd-textarea"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste Job Description or type e.g. 'Backend Engineer at Stripe (Node.js, PostgreSQL, Kafka)'"
                  rows={4}
                />
              </>
            ) : (
              <div className="general-mode-banner">
                <Sparkles size={20} color="#f59e0b" />
                <div>
                  <h4>General Tech Resume Audit</h4>
                  <p>In this mode, DevPulse audits your resume against industry-wide 20+ LPA software engineering hiring standards, evaluating impact, tech stack depth, and ATS compatibility.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Banner */}
      <div className="analyze-action-bar">
        <button 
          className={`run-analysis-btn ${resumeLoading ? 'loading' : ''}`}
          onClick={() => runAnalysis()}
          disabled={resumeLoading}
        >
          {resumeLoading ? (
            <>
              <RotateCcw size={18} className="spin-icon" />
              <span>DevPulse AI is analyzing ATS alignment & hard-skill gaps...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} />
              <span>{analysisMode === 'jd_match' ? '🚀 Analyze ATS Match & Hard-Skill Gaps' : '📋 Run 360° Health Audit'}</span>
            </>
          )}
        </button>
      </div>

      {/* Loading Shimmer State */}
      {resumeLoading && (
        <div className="resume-loading">
          <div className="shimmer-loader" style={{ height: '240px', borderRadius: '12px' }}></div>
          <p style={{ textAlign: 'center', marginTop: '16px', color: 'var(--text-muted)' }}>
            Comparing resume tokens, extracting hard-skill overlap, and generating STAR bullet improvements...
          </p>
        </div>
      )}

      {/* Results View */}
      {!resumeLoading && parsedAnalysis && (
        parsedAnalysis.isStructuredMatch 
          ? renderStructuredMatchResults() 
          : renderGeneralAnalysis()
      )}
    </div>
  );
}
