import { describe, it, expect } from 'vitest';
import { isCorrect, scoreAttempt, WEAK_DOMAIN_THRESHOLD } from './quiz';
import type { Question } from '../types';

function q(id: string, domain: string, correctId: string): Question {
  return {
    id,
    exam: 'github-actions',
    domain,
    difficulty: 'medium',
    stem: `stem ${id}`,
    options: [
      { id: 'o1', text: 'a' },
      { id: 'o2', text: 'b' },
      { id: 'o3', text: 'c' },
      { id: 'o4', text: 'd' },
    ],
    correctAnswerId: correctId,
    explanationCorrect: 'right',
    explanationIncorrect: 'wrong, in detail',
  };
}

describe('isCorrect', () => {
  it('matches by option id regardless of position', () => {
    const question = q('gha-1', 'D', 'o3');
    expect(isCorrect(question, 'o3')).toBe(true);
    expect(isCorrect(question, 'o1')).toBe(false);
  });

  it('treats a null (unanswered) choice as incorrect', () => {
    expect(isCorrect(q('gha-1', 'D', 'o2'), null)).toBe(false);
  });
});

describe('scoreAttempt', () => {
  it('counts correct answers and computes a rounded percent', () => {
    const questions = [q('a', 'D1', 'o1'), q('b', 'D1', 'o2'), q('c', 'D1', 'o3')];
    const answers = { a: 'o1', b: 'o2', c: 'o1' }; // 2 of 3
    const s = scoreAttempt(questions, answers);
    expect(s.correct).toBe(2);
    expect(s.total).toBe(3);
    expect(s.percent).toBe(67);
  });

  it('aggregates per domain', () => {
    const questions = [
      q('a', 'Workflows', 'o1'),
      q('b', 'Workflows', 'o2'),
      q('c', 'Actions', 'o3'),
    ];
    const answers = { a: 'o1', b: 'o1', c: 'o3' };
    const s = scoreAttempt(questions, answers);
    const wf = s.byDomain.find((d) => d.domain === 'Workflows');
    const ac = s.byDomain.find((d) => d.domain === 'Actions');
    expect(wf).toEqual({ domain: 'Workflows', correct: 1, total: 2 });
    expect(ac).toEqual({ domain: 'Actions', correct: 1, total: 1 });
  });

  it('flags weak domains at or below the threshold, worst first', () => {
    // Strong: 2/2 = 1.0. Mid: 1/2 = 0.5. Bad: 0/2 = 0.0.
    const questions = [
      q('a', 'Strong', 'o1'),
      q('b', 'Strong', 'o1'),
      q('c', 'Mid', 'o1'),
      q('d', 'Mid', 'o1'),
      q('e', 'Bad', 'o1'),
      q('f', 'Bad', 'o1'),
    ];
    const answers = { a: 'o1', b: 'o1', c: 'o1', d: 'o2', e: 'o2', f: 'o2' };
    const s = scoreAttempt(questions, answers);
    expect(WEAK_DOMAIN_THRESHOLD).toBe(0.7);
    // Strong (1.0) is above threshold; Mid (0.5) and Bad (0.0) are at/below it.
    expect(s.weakDomains).toEqual(['Bad', 'Mid']);
  });

  it('handles an empty attempt without dividing by zero', () => {
    const s = scoreAttempt([], {});
    expect(s).toEqual({ correct: 0, total: 0, percent: 0, byDomain: [], weakDomains: [] });
  });

  it('counts a missing answer as incorrect', () => {
    const questions = [q('a', 'D', 'o1'), q('b', 'D', 'o1')];
    const s = scoreAttempt(questions, { a: 'o1' }); // b unanswered
    expect(s.correct).toBe(1);
    expect(s.total).toBe(2);
  });
});
