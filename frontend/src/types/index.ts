export type ToastType = 'info' | 'success' | 'error' | 'warning';

export type ToastFn = (message: string, type?: ToastType) => void;

export interface UserCredentials {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  github?: string;
  leetcode?: string;
  bio?: string;
  resumeContext?: string;
  targetRole?: string;
  targetCompanies?: string[];
  preferredLanguage?: string;
  avatar?: string;
  createdAt?: string;
}

export interface DevMemory {
  _id: string;
  text: string;
  category?: 'goal' | 'weakness' | 'strength' | 'tech_stack' | 'preference' | 'general' | string;
  source?: 'manual' | 'ai_extracted' | string;
  confidence?: number;
  createdAt?: string;
}

export interface LanguageStat {
  name: string;
  percentage?: number;
  color?: string;
}

export interface CommitItem {
  message: string;
  repo: string;
  date: string;
  url?: string;
}

export interface GithubData {
  error?: boolean;
  username?: string;
  avatarUrl?: string;
  totalCommits: number | string;
  publicRepos: number | string;
  streak: number | string;
  todayCommits?: number;
  yesterdayCommits?: number;
  activeDays?: number | string;
  languages: (LanguageStat | string)[];
  recentCommits?: CommitItem[];
}

export interface LeetCodeSubmission {
  title: string;
  titleSlug?: string;
  timestamp: string;
}

export interface LeetcodeData {
  error?: boolean;
  total: number | string;
  easy: number | string;
  medium: number | string;
  hard: number | string;
  rating?: number | string | null;
  top?: number | string | null;
  globalRank?: number | string | null;
  highestRating?: number | string | null;
  streak?: number;
  recentSubmissions?: LeetCodeSubmission[];
}

export interface ChatMessage {
  id?: string;
  _id?: string;
  role: 'user' | 'ai' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  isDailyBrief?: boolean;
  parts?: any[];
}

export interface Conversation {
  id?: string;
  _id: string;
  userId?: string;
  title: string;
  category?: 'general' | 'dsa' | 'system_design' | 'resume' | 'mock_interview' | 'career' | string;
  pinned?: boolean;
  tags?: string[];
  summary?: string;
  messageCount?: number;
  lastMessageSnippet?: string;
  lastMessageRole?: string | null;
  messages: ChatMessage[];
  updatedAt: string;
  createdAt?: string;
}

export interface StarBulletImprovement {
  original: string;
  improved: string;
  reason?: string;
}

export interface StructuredResumeMatch {
  matchScore: number;
  matchTier?: string;
  targetRoleIdentified?: string;
  matchingSkills: string[];
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  starBulletImprovements: StarBulletImprovement[];
  atsRecommendations: string[];
  verdict: string;
}

export interface ParsedResumeResult {
  isStructuredMatch: boolean;
  score: number;
  scoreColor: string;
  matchTier?: string;
  targetRole?: string;
  matchingSkills?: string[];
  missingSkills?: string[];
  strengths: string[];
  weaknesses: string[];
  keywords: string[];
  verdict: string;
  starBulletImprovements?: StarBulletImprovement[];
  atsRecommendations?: string[];
}
