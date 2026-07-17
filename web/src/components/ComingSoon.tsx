interface Props {
  label: string;
}

export function ComingSoon({ label }: Props) {
  return (
    <section className="card coming-soon">
      <span className="coming-soon__mark" aria-hidden>◆</span>
      <h2 className="coming-soon__title">{label}</h2>
      <p className="coming-soon__body">
        This exam is coming soon. The engine is ready; its question bank is being
        written. GitHub Actions is live now, pick it from the tabs above to start
        practising.
      </p>
    </section>
  );
}
