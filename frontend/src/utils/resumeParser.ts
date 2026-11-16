import { ParsedResumeResult } from '../types';

export const getScoreColor = (score: number, max = 100): string => {
  const percentage = max === 10 ? score * 10 : score;
  if (percentage >= 80) return '#22c55e'; // Green
  if (percentage >= 60) return '#f59e0b'; // Amber
  return '#ef4444'; // Red
};

export const parseResumeAnalysis = (analysisInput: any): ParsedResumeResult | null => {
  if (!analysisInput) return null;

  // 1. Structured JSON from JD match endpoint
  if (typeof analysisInput === 'object' && analysisInput.matchScore !== undefined) {
    const score = Number(analysisInput.matchScore) || 0;
    return {
      isStructuredMatch: true,
      score,
      scoreColor: getScoreColor(score, 100),
      matchTier: analysisInput.matchTier || (score >= 80 ? 'Strong Match' : score >= 60 ? 'Moderate Match' : 'Needs Work'),
      targetRole: analysisInput.targetRoleIdentified || '',
      matchingSkills: Array.isArray(analysisInput.matchingSkills) ? analysisInput.matchingSkills : [],
      missingSkills: Array.isArray(analysisInput.missingSkills) ? analysisInput.missingSkills : [],
      strengths: Array.isArray(analysisInput.strengths) ? analysisInput.strengths : [],
      weaknesses: Array.isArray(analysisInput.weaknesses) ? analysisInput.weaknesses : [],
      keywords: [],
      starBulletImprovements: Array.isArray(analysisInput.starBulletImprovements) ? analysisInput.starBulletImprovements : [],
      atsRecommendations: Array.isArray(analysisInput.atsRecommendations) ? analysisInput.atsRecommendations : [],
      verdict: analysisInput.verdict || ''
    };
  }

  // 2. String that might be JSON
  if (typeof analysisInput === 'string' && analysisInput.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(analysisInput);
      if (parsed.matchScore !== undefined) {
        return parseResumeAnalysis(parsed);
      }
    } catch {
      // Continue to regex parser
    }
  }

  // 3. Fallback: Parse string formatted output (classic general audit)
  const analysisText = typeof analysisInput === 'string' ? analysisInput : '';
  const scoreMatch = analysisText.match(/SCORE:\s*(\d+)/i);
  const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;
  const scoreColor = getScoreColor(score, 10);

  const strongMatch = analysisText.match(/STRONG POINTS[^\n]*\n([\s\S]*?)(?=WEAK POINTS)/i);
  const strengths = strongMatch ? strongMatch[1].split('\n').filter(p => p.trim().startsWith('-')) : [];

  const weakMatch = analysisText.match(/WEAK POINTS[^\n]*\n([\s\S]*?)(?=MISSING KEYWORDS)/i);
  const weaknesses = weakMatch ? weakMatch[1].split('\n').filter(p => p.trim().startsWith('-')) : [];

  const keywordMatch = analysisText.match(/MISSING KEYWORDS[^\n]*\n([\s\S]*?)(?=ONE LINE VERDICT)/i);
  const keywords = keywordMatch 
    ? keywordMatch[1]
        .split(/,|\n/)
        .map(k => k.trim().replace(/^-/, '').trim())
        .filter(k => k && !k.includes('comma separated'))
    : [];

  const verdictMatch = analysisText.match(/ONE LINE VERDICT:?\s*([^\n]*)/i);
  const verdict = verdictMatch ? verdictMatch[1].trim() : "";

  return {
    isStructuredMatch: false,
    score,
    scoreColor,
    strengths,
    weaknesses,
    keywords,
    verdict
  };
};
