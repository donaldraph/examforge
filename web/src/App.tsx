import { useEffect, useState } from 'react';
import type { Exam, Question } from './types';
import { loadQuestions, loadRegistry } from './lib/loadBank';
import { scoreAttempt, type AttemptScore } from './lib/quiz';
import { backendEnabled } from './lib/config';
import { fetchAttempts, fetchProgress, submitAttempt, type ProgressResponse } from './lib/api';
import { QuestionCard } from './components/QuestionCard';
import { Results } from './components/Results';

type Answers = Record<string, string | null>;

// v1 drives the active exam only. The six-exam tab switcher is step 5.
const ACTIVE_EXAM = 'github-actions';

export default function App() {
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [attempt, setAttempt] = useState(0); // reshuffle nonce, bumped on restart

  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [finalScore, setFinalScore] = useState<AttemptScore | null>(null);
  const [saved, setSaved] = useState(false);
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [attemptCount, setAttemptCount] = useState<number | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const registry = await loadRegistry();
        const active = registry.exams.find((e) => e.id === ACTIVE_EXAM) ?? null;
        const qs = await loadQuestions(ACTIVE_EXAM);
        if (!live) return;
        setExam(active);
        setQuestions(qs);
      } catch (e) {
        if (live) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  async function finish() {
    if (!questions) return;
    const clientScore = scoreAttempt(questions, answers);

    if (!backendEnabled()) {
      setFinalScore(clientScore);
      setSaved(false);
      setFinished(true);
      return;
    }

    // Backend on: the server is the authority on the score, and it saves history.
    setSubmitting(true);
    try {
      const serverScore = await submitAttempt(ACTIVE_EXAM, answers);
      setFinalScore(serverScore);
      setSaved(true);
      const [prog, hist] = await Promise.all([fetchProgress(), fetchAttempts()]);
      setProgress(prog);
      setAttemptCount(hist.length);
    } catch {
      // Never trap the user on a network hiccup: fall back to the client score.
      setFinalScore(clientScore);
      setSaved(false);
    } finally {
      setSubmitting(false);
      setFinished(true);
    }
  }

  function restart() {
    setAnswers({});
    setIndex(0);
    setFinished(false);
    setFinalScore(null);
    setSaved(false);
    setProgress(null);
    setAttemptCount(null);
    setAttempt((n) => n + 1);
  }

  if (error) {
    return (
      <Shell>
        <p className="notice notice--error">Could not load the question bank: {error}</p>
      </Shell>
    );
  }

  if (!questions || !exam) {
    return (
      <Shell>
        <p className="notice">Loading…</p>
      </Shell>
    );
  }

  if (finished && finalScore) {
    return (
      <Shell examLabel={exam.label}>
        <Results
          score={finalScore}
          saved={saved}
          progress={progress}
          attemptCount={attemptCount}
          onRestart={restart}
        />
      </Shell>
    );
  }

  const current = questions[index];
  const chosen = answers[current.id] ?? null;
  const answered = chosen !== null;
  const isLast = index === questions.length - 1;

  return (
    <Shell examLabel={exam.label}>
      <div className="progress-row">
        <span className="progress-row__count">
          Question {index + 1} of {questions.length}
        </span>
        <span className="progress-row__mode">Practice mode</span>
      </div>

      <QuestionCard
        question={current}
        shuffleNonce={attempt}
        chosenOptionId={chosen}
        onChoose={(optionId) => setAnswers((prev) => ({ ...prev, [current.id]: optionId }))}
      />

      <div className="nav">
        <button
          type="button"
          className="btn"
          disabled={index === 0 || submitting}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          Back
        </button>
        {isLast ? (
          <button
            type="button"
            className="btn btn--primary"
            disabled={!answered || submitting}
            onClick={finish}
          >
            {submitting ? 'Saving…' : 'Finish'}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn--primary"
            disabled={!answered || submitting}
            onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
          >
            Next
          </button>
        )}
      </div>
    </Shell>
  );
}

function Shell({ children, examLabel }: { children: React.ReactNode; examLabel?: string }) {
  return (
    <div className="app">
      <header className="masthead">
        <div className="masthead__brand">
          <span className="masthead__mark" aria-hidden>◆</span>
          <span className="masthead__name">ExamForge</span>
        </div>
        {examLabel && <span className="masthead__exam">{examLabel}</span>}
      </header>
      <main className="content">{children}</main>
      <footer className="footer">
        Practice mode. Answers are shuffled every attempt. v1 has no AI, by design.
      </footer>
    </div>
  );
}
