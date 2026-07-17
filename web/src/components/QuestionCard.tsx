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
}

export function QuestionCard({ question, shuffleNonce, chosenOptionId, onChoose }: Props) {
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
          if (answered) {
            if (isTheCorrect) state = 'option--correct';
            else if (isChosen) state = 'option--wrong';
            else state = 'option--muted';
          }
          return (
            <li key={opt.id}>
              <button
                type="button"
                className={`option ${state}`}
                disabled={answered}
                aria-pressed={isChosen}
                onClick={() => onChoose(opt.id)}
              >
                <span className="option__text">{opt.text}</span>
                {answered && isTheCorrect && <span className="option__mark" aria-hidden>✓</span>}
                {answered && isChosen && !isTheCorrect && (
                  <span className="option__mark" aria-hidden>✕</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {answered && (
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
