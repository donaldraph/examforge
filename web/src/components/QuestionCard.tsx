import { useMemo } from 'react';
import type { Option, Question } from '../types';
import { fisherYatesShuffle } from '../lib/shuffle';
import { isCorrect } from '../lib/quiz';

interface Props {
  question: Question;
  /** Bumped when a new attempt starts, so options reshuffle for the same question. */
  shuffleNonce: number;
  chosenOptionId: string | null;
  onChoose: (optionId: string) => void;
  /**
   * Practice mode (true) locks in the choice and reveals correctness plus the
   * explanation immediately. Timed mode (false) hides the outcome until the exam
   * is submitted and lets the candidate change or skip answers, like the real exam.
   */
  reveal?: boolean;
}

export function QuestionCard({
  question,
  shuffleNonce,
  chosenOptionId,
  onChoose,
  reveal = true,
}: Props) {
  // Shuffle once per question presentation, not on every React render, so the
  // options do not jump around while the candidate is reading. The nonce forces
  // a fresh order when a new attempt begins.
  const options: Option[] = useMemo(
    () => fisherYatesShuffle(question.options),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [question.id, shuffleNonce],
  );

  const answered = chosenOptionId !== null;
  const gotItRight = isCorrect(question, chosenOptionId);
  // Only show correctness and the explanation once the choice is revealed
  // (practice mode). In timed mode the choice stays changeable and hidden.
  const showResult = answered && reveal;

  return (
    <article className="card question">
      <div className="question__meta">
        <span className="badge badge--domain">{question.domain}</span>
        <span className={`badge badge--diff badge--${question.difficulty}`}>
          {question.difficulty}
        </span>
      </div>

      <h2 className="question__stem">{question.stem}</h2>

      <ul className="options" role="list">
        {options.map((opt) => {
          const isChosen = chosenOptionId === opt.id;
          const isTheCorrect = question.correctAnswerId === opt.id;
          let state = '';
          if (showResult) {
            if (isTheCorrect) state = 'option--correct';
            else if (isChosen) state = 'option--wrong';
            else state = 'option--muted';
          } else if (isChosen) {
            state = 'option--chosen';
          }
          return (
            <li key={opt.id}>
              <button
                type="button"
                className={`option ${state}`}
                disabled={showResult}
                aria-pressed={isChosen}
                onClick={() => onChoose(opt.id)}
              >
                <span className="option__text">{opt.text}</span>
                {showResult && isTheCorrect && <span className="option__mark" aria-hidden>✓</span>}
                {showResult && isChosen && !isTheCorrect && (
                  <span className="option__mark" aria-hidden>✕</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {showResult && (
        <div
          className={`explanation ${gotItRight ? 'explanation--correct' : 'explanation--incorrect'}`}
          role="status"
        >
          <p className="explanation__label">{gotItRight ? 'Correct' : 'Not quite'}</p>
          <p className="explanation__body">
            {gotItRight ? question.explanationCorrect : question.explanationIncorrect}
          </p>
        </div>
      )}
    </article>
  );
}
