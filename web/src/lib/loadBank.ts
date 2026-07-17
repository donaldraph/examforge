// Loads the exam registry and a per-exam question bank from the static data
// assets synced into public/data. In production these are served from S3 behind
// CloudFront; in step 4 the same shapes can come from the API instead.

import type { ExamRegistry, Question } from '../types';

const base = `${import.meta.env.BASE_URL}data`;

export async function loadRegistry(): Promise<ExamRegistry> {
  const res = await fetch(`${base}/exams.json`);
  if (!res.ok) throw new Error(`failed to load exam registry: ${res.status}`);
  return (await res.json()) as ExamRegistry;
}

export async function loadQuestions(examId: string): Promise<Question[]> {
  const res = await fetch(`${base}/questions/${examId}.json`);
  if (!res.ok) throw new Error(`failed to load questions for ${examId}: ${res.status}`);
  return (await res.json()) as Question[];
}
