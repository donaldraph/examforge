// Thin client for the persistence API. Every call keys on the anonymous device
// id. Callers only reach here when backendEnabled() is true.

import { apiBase, userId } from './config';
import type { AttemptScore } from './quiz';

export interface DomainProgress {
  examId: string;
  domain: string;
  questionsSeen: number;
  questionsCorrect: number;
  attempts: number;
  accuracy: number;
}

export interface ProgressResponse {
  progress: DomainProgress[];
  weakDomains: string[];
}

export interface StoredAttempt {
  attemptId?: string;
  examId: string;
  createdAt: string;
  correct: number;
  total: number;
  percent: number;
  byDomain: { domain: string; correct: number; total: number }[];
  weakDomains: string[];
}

function base(): string {
  const b = apiBase();
  if (!b) throw new Error('API is not configured');
  return b;
}

/** Submit a finished attempt; the server grades it and returns the score. */
export async function submitAttempt(
  examId: string,
  answers: Record<string, string | null>,
): Promise<AttemptScore> {
  const res = await fetch(`${base()}/attempts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: userId(), examId, answers }),
  });
  if (!res.ok) throw new Error(`submit failed: ${res.status}`);
  const data = (await res.json()) as { score: AttemptScore };
  return data.score;
}

export async function fetchProgress(): Promise<ProgressResponse> {
  const res = await fetch(`${base()}/progress?userId=${encodeURIComponent(userId())}`);
  if (!res.ok) throw new Error(`progress failed: ${res.status}`);
  return (await res.json()) as ProgressResponse;
}

export async function fetchAttempts(): Promise<StoredAttempt[]> {
  const res = await fetch(`${base()}/attempts?userId=${encodeURIComponent(userId())}`);
  if (!res.ok) throw new Error(`history failed: ${res.status}`);
  const data = (await res.json()) as { attempts: StoredAttempt[] };
  return data.attempts;
}
