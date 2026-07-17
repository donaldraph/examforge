import type { Exam } from '../types';

interface Props {
  exams: Exam[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function ExamTabs({ exams, selectedId, onSelect }: Props) {
  return (
    <nav className="tabs" role="tablist" aria-label="Exams">
      {exams.map((e) => {
        const active = e.id === selectedId;
        const soon = e.status === 'coming-soon';
        return (
          <button
            key={e.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={`tab ${active ? 'tab--active' : ''} ${soon ? 'tab--soon' : ''}`}
            onClick={() => onSelect(e.id)}
          >
            <span className="tab__label">{e.label}</span>
            {soon && <span className="tab__soon">soon</span>}
          </button>
        );
      })}
    </nav>
  );
}
