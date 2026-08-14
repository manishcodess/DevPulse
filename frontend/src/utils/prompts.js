/**
 * Builds the resume analysis prompt for the AI.
 * Used by both the Onboarding flow and the Resume Review feature.
 * @param {string} textContent - Extracted text from the resume (empty if PDF is attached separately)
 * @returns {string} The formatted prompt string
 */
export const buildResumePrompt = (textContent = '') => {
  return `You are a Senior Technical Recruiter and Hiring Manager at a top-tier tech company.
Review the provided Software Engineering resume comprehensively, focusing on education, experience, impact, and projects.

${textContent ? textContent.slice(0, 3000) : 'See attached PDF.'}

Provide your objective evaluation in EXACTLY the following format:
SCORE: X/10

STRONG POINTS (3 bullet points):
- 

WEAK POINTS (3 bullet points):
- 

MISSING KEYWORDS (comma separated, max 8 - only include highly relevant industry keywords that are missing):

ONE LINE VERDICT:
[Provide a single, highly actionable, professional sentence on what the candidate must do to improve their chances of passing an ATS and recruiter screen.]`;
};
