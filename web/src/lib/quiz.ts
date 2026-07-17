// Grading and scoring. Everything here matches on option id, never on position,
// so it is unaffected by how options were shuffled for display.

import type { Question } from '../types';

export interface DomainScore {
  domain: string;
  correct: number;
  total: number;
}

export interface AttemptScore {
  correct: number;
  total: number;
  /** 0..100, rounded to the nearest integer; 0 when there are no questions. */
  percent: number;
  byDomain: DomainScore[];
  /** Domains scored below WEAK_DOMAIN_THRESHOLD, worst first. */
  weakDomains: string[];
}

/** A domain at or below this accuracy (0..1) is flagged as weak. */
export const WEAK_DOMAIN_THRESHOLD = 0.7;

/** True when the chosen option is the correct one. Matches by id. */
export function isCorrect(question: Question, chosenOptionId: string | null): boolean {
  return chosenOptionId !== null && chosenOptionId === question.correctAnswerId;
}

/**
 * Scores a finished attempt. `answers` maps question id to the chosen option id
 * (a missing or null entry counts as unanswered, i.e. incorrect).
 */
export function scoreAttempt(
  questions: Question[],
  answers: Record<string, string | null>,
): AttemptScore {
  const domainTally = new Map<string, { correct: number; total: number }>();
  let correct = 0;

  for (const q of questions) {
    const chosen = answers[q.id] ?? null;
    const right = isCorrect(q, chosen);
    if (right) correct += 1;

    const d = domainTally.get(q.domain) ?? { correct: 0, total: 0 };
    d.total += 1;
    if (right) d.correct += 1;
    domainTally.set(q.domain, d);
  }

  const byDomain: DomainScore[] = [...domainTally.entries()]
    .map(([domain, t]) => ({ domain, correct: t.correct, total: t.total }))
    .sort((a, b) => a.domain.localeCompare(b.domain));

  const weakDomains = byDomain
    .filter((d) => d.total > 0 && d.correct / d.total <= WEAK_DOMAIN_THRESHOLD)
    .sort((a, b) => a.correct / a.total - b.correct / b.total)
    .map((d) => d.domain);

  const total = questions.length;
  const percent = total === 0 ? 0 : Math.round((correct / total) * 100);

  return { correct, total, percent, byDomain, weakDomains };
}
