export const parseResumeAnalysis = (analysisText) => {
  if (!analysisText) return null;

  const scoreMatch = analysisText.match(/SCORE:\s*(\d+)/i);
  const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
  const scoreColor = score > 7 ? '#22c55e' : score >= 5 ? '#f59e0b' : '#ef4444';

  const strongMatch = analysisText.match(/STRONG POINTS[^\n]*\n([\s\S]*?)(?=WEAK POINTS)/i);
  const strongPoints = strongMatch ? strongMatch[1].split('\n').filter(p => p.trim().startsWith('-')) : [];

  const weakMatch = analysisText.match(/WEAK POINTS[^\n]*\n([\s\S]*?)(?=MISSING KEYWORDS)/i);
  const weakPoints = weakMatch ? weakMatch[1].split('\n').filter(p => p.trim().startsWith('-')) : [];

  const keywordMatch = analysisText.match(/MISSING KEYWORDS:?\s*([^\n]*)/i);
  const keywords = keywordMatch ? keywordMatch[1].split(',').map(k => k.trim()).filter(Boolean) : [];

  const verdictMatch = analysisText.match(/ONE LINE VERDICT:?\s*([^\n]*)/i);
  const verdict = verdictMatch ? verdictMatch[1] : "";

  return {
    score,
    scoreColor,
    strongPoints,
    weakPoints,
    keywords,
    verdict
  };
};
