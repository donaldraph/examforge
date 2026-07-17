import type { AttemptScore } from '../lib/quiz';

interface Props {
  score: AttemptScore;
  onRestart: () => void;
}

export function Results({ score, onRestart }: Props) {
  return (
    <section className="card results">
      <p className="results__eyebrow">Attempt complete</p>
      <div className="results__score">
        <span className="results__percent">{score.percent}%</span>
        <span className="results__fraction">
          {score.correct} of {score.total} correct
        </span>
      </div>

      <h3 className="results__heading">By domain</h3>
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

      <button type="button" className="btn btn--primary" onClick={onRestart}>
        Start a new attempt
      </button>
    </section>
  );
}
