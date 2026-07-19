// Mirrors schema/question.schema.json at the repo root. Correctness is tracked
// by option id, never by position, so options may be shuffled freely.

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Option {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  exam: string;
  domain: string;
  difficulty: Difficulty;
  stem: string;
  options: Option[];
  correctAnswerId: string;
  explanationCorrect: string;
  explanationIncorrect: string;
  tags?: string[];
  isSeed?: boolean;
}

export type ExamStatus = 'active' | 'coming-soon';

export interface Exam {
  id: string;
  label: string;
  status: ExamStatus;
  domains: string[];
  // Seconds allotted per question in timed mode, matching (or tighter than) the
  // real certification's pace. A timed session's clock is this times the number
  // of questions in the session. Falls back to a default if absent.
  secondsPerQuestion?: number;
}

export interface ExamRegistry {
  exams: Exam[];
}
