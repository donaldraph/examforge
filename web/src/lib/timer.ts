// Timed-mode helpers. A timed session's clock is the exam's per-question pace
// times the number of questions in the session, matching (or tighter than) the
// real certification. Kept pure and separate from React so it can be unit tested.

export const DEFAULT_SECONDS_PER_QUESTION = 90;

/** Total seconds allotted for a timed session of `questionCount` questions. */
export function sessionSeconds(
  secondsPerQuestion: number | undefined,
  questionCount: number,
): number {
  const rate =
    secondsPerQuestion && secondsPerQuestion > 0
      ? secondsPerQuestion
      : DEFAULT_SECONDS_PER_QUESTION;
  return Math.max(0, Math.floor(questionCount)) * rate;
}

/** Format a whole number of seconds as M:SS, or H:MM:SS past an hour. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hh > 0 ? `${hh}:${pad(mm)}:${pad(ss)}` : `${mm}:${pad(ss)}`;
}
