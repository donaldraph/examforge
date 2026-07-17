import { useEffect, useState } from 'react';
import type { Exam, Question } from './types';
import { loadQuestions, loadRegistry } from './lib/loadBank';
import { scoreAttempt, WEAK_DOMAIN_THRESHOLD, type AttemptScore } from './lib/quiz';
import { backendEnabled } from './lib/config';
import { fetchAttempts, fetchProgress, submitAttempt, type ProgressResponse } from './lib/api';
import { QuestionCard } from './components/QuestionCard';
import { Results } from './components/Results';
import { ExamTabs } from './components/ExamTabs';
import { ComingSoon } from './components/ComingSoon';

type Answers = Record<string, string | null>;

export default function App() {
  const [exams, setExams] = useState<Exam[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [loading, setLoading] = useState(false);
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

  const selectedExam = exams?.find((e) => e.id === selectedId) ?? null;

  useEffect(() => {
    let live = true;
    loadRegistry()
      .then((r) => {
        if (!live) return;
        setExams(r.exams);
        const firstActive = r.exams.find((e) => e.status === 'active') ?? r.exams[0];
        setSelectedId(firstActive?.id ?? null);
      })
      .catch((e) => {
        if (live) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      live = false;
    };
  }, []);

  // Load the selected exam's bank (active exams only) and start it fresh.
  useEffect(() => {
    if (!selectedExam) return;
    resetQuiz();
    if (selectedExam.status !== 'active') {
      setQuestions(null);
      return;
    }
    let live = true;
    setLoading(true);
    loadQuestions(selectedExam.id)
      .then((qs) => {
        if (!live) return;
        setQuestions(qs);
        setLoading(false);
      })
      .catch((e) => {
        if (!live) return;
        setError(e instanceof Error ? e.message : String(e));
        setLoading(false);
      });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  function resetQuiz() {
    setIndex(0);
    setAnswers({});
    setFinished(false);
    setFinalScore(null);
    setSaved(false);
    setProgress(null);
    setAttemptCount(null);
    setAttempt((n) => n + 1);
  }

  async function finish() {
    if (!questions || !selectedId) return;
    const clientScore = scoreAttempt(questions, answers);

    if (!backendEnabled()) {
      setFinalScore(clientScore);
      setSaved(false);
      setFinished(true);
      return;
    }

    setSubmitting(true);
    try {
      const serverScore = await submitAttempt(selectedId, answers);
      setFinalScore(serverScore);
      setSaved(true);
      const [prog, hist] = await Promise.all([fetchProgress(), fetchAttempts()]);
      // Show only this exam's cumulative rows, and derive its weak domains.
      const rows = prog.progress.filter((p) => p.examId === selectedId);
      const weak = rows
        .filter((p) => p.questionsSeen > 0 && p.accuracy <= WEAK_DOMAIN_THRESHOLD)
        .sort((a, b) => a.accuracy - b.accuracy)
        .map((p) => p.domain);
      setProgress({ progress: rows, weakDomains: weak });
      setAttemptCount(hist.filter((a) => a.examId === selectedId).length);
    } catch {
      setFinalScore(clientScore);
      setSaved(false);
    } finally {
      setSubmitting(false);
      setFinished(true);
    }
  }

  if (error) {
    return (
      <Shell exams={exams} selectedId={selectedId} onSelect={setSelectedId}>
        <p className="notice notice--error">Could not load the question bank: {error}</p>
      </Shell>
    );
  }

  if (!exams || !selectedExam) {
    return (
      <Shell exams={exams} selectedId={selectedId} onSelect={setSelectedId}>
        <p className="notice">Loading…</p>
      </Shell>
    );
  }

  let body: React.ReactNode;
  if (selectedExam.status !== 'active') {
    body = <ComingSoon label={selectedExam.label} />;
  } else if (loading || !questions) {
    body = <p className="notice">Loading…</p>;
  } else if (finished && finalScore) {
    body = (
      <Results
        score={finalScore}
        saved={saved}
        progress={progress}
        attemptCount={attemptCount}
        onRestart={resetQuiz}
      />
    );
  } else {
    const current = questions[index];
    const chosen = answers[current.id] ?? null;
    const answered = chosen !== null;
    const isLast = index === questions.length - 1;
    body = (
      <>
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
      </>
    );
  }

  return (
    <Shell exams={exams} selectedId={selectedId} onSelect={setSelectedId}>
      {body}
    </Shell>
  );
}

function Shell({
  children,
  exams,
  selectedId,
  onSelect,
}: {
  children: React.ReactNode;
  exams: Exam[] | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="app">
      <header className="masthead">
        <div className="masthead__brand">
          <span className="masthead__mark" aria-hidden>◆</span>
          <span className="masthead__name">ExamForge</span>
        </div>
      </header>
      {exams && selectedId && (
        <ExamTabs exams={exams} selectedId={selectedId} onSelect={onSelect} />
      )}
      <main className="content">{children}</main>
      <footer className="footer">
        Practice mode. Answers are shuffled every attempt. v1 has no AI, by design.
      </footer>
    </div>
  );
}
