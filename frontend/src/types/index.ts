export type ToastType = 'info' | 'success' | 'error' | 'warning';

export type ToastFn = (message: string, type?: ToastType) => void;

export interface UserCredentials {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  github?: string;
  leetcode?: string;
  targetRole?: string;
  targetCompanies?: string[];
  preferredLanguage?: string;
  avatar?: string;
  createdAt?: string;
}

export interface DevMemory {
  _id: string;
  text: string;
  category?: string;
  source?: 'manual' | 'ai' | string;
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
  activeDays?: number | string;
  languages: (LanguageStat | string)[];
  recentCommits?: CommitItem[];
}

export interface LeetCodeSubmission {
  title: string;
  status: string;
  timestamp: string;
}

export interface LeetcodeData {
  error?: boolean;
  totalSolved: number | string;
  easySolved: number | string;
  mediumSolved: number | string;
  hardSolved: number | string;
  ranking?: number | string;
  recentSubmissions?: LeetCodeSubmission[];
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string | Date;
  parts?: any[];
}

export interface Conversation {
  _id: string;
  userId?: string;
  title: string;
  category?: 'general' | 'dsa' | 'system_design' | 'resume' | 'mock_interview' | string;
  pinned?: boolean;
  tags?: string[];
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
  strengths?: string[];
  weaknesses?: string[];
  strongPoints?: string[];
  weakPoints?: string[];
  keywords?: string[];
  verdict?: string;
  starBulletImprovements?: StarBulletImprovement[];
  atsRecommendations?: string[];
}
