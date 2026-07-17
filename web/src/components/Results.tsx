import type { AttemptScore } from '../lib/quiz';
import type { ProgressResponse } from '../lib/api';

interface Props {
  score: AttemptScore;
  saved: boolean;
  progress: ProgressResponse | null;
  attemptCount: number | null;
  onRestart: () => void;
}

export function Results({ score, saved, progress, attemptCount, onRestart }: Props) {
  return (
    <section className="card results">
      <p className="results__eyebrow">Attempt complete</p>
      <div className="results__score">
        <span className="results__percent">{score.percent}%</span>
        <span className="results__fraction">
          {score.correct} of {score.total} correct
        </span>
      </div>

      {saved ? (
        <p className="save-note save-note--saved">
          Saved to your history{attemptCount ? ` · ${attemptCount} attempt${attemptCount === 1 ? '' : 's'} total` : ''}
        </p>
      ) : (
        <p className="save-note">Local practice · not saved</p>
      )}

      <h3 className="results__heading">This attempt, by domain</h3>
      <ul className="domain-list" role="list">
        {score.byDomain.map((d) => {
          const pct = d.total === 0 ? 0 : Math.round((d.correct / d.total) * 100);
          const weak = score.weakDomains.includes(d.domain);
          return (
            <li key={d.domain} className={`domain-row ${weak ? 'domain-row--weak' : ''}`}>
              <span className="domain-row__name">{d.domain}</span>
              <span className="domain-row__stat">
                {d.correct}/{d.total} ({pct}%)
              </span>
            </li>
          );
        })}
      </ul>

      {score.weakDomains.length > 0 && (
        <div className="weak-callout">
          <p className="weak-callout__label">Weak domains to review</p>
          <p className="weak-callout__list">{score.weakDomains.join(', ')}</p>
        </div>
      )}

      {progress && progress.progress.length > 0 && (
        <>
          <h3 className="results__heading">Your progress over all attempts</h3>
          <ul className="domain-list" role="list">
            {progress.progress.map((p) => {
              const pct = Math.round(p.accuracy * 100);
              const weak = progress.weakDomains.includes(p.domain);
              return (
                <li key={p.domain} className={`domain-row ${weak ? 'domain-row--weak' : ''}`}>
                  <span className="domain-row__name">{p.domain}</span>
                  <span className="domain-row__stat">
                    {p.questionsCorrect}/{p.questionsSeen} ({pct}%)
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <button type="button" className="btn btn--primary" onClick={onRestart}>
        Start a new attempt
      </button>
    </section>
  );
}
