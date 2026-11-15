import type { ReactNode } from 'react';

interface MetricCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  note?: string;
  tone?: 'mint' | 'amber' | 'red' | 'blue';
}

export function MetricCard({ icon, label, value, unit, note, tone = 'mint' }: MetricCardProps) {
  return (
    <article className={`metric-card tone-${tone}`}>
      <div className="metric-icon" aria-hidden="true">{icon}</div>
      <div className="metric-copy">
        <span className="metric-label">{label}</span>
        <div className="metric-value">{value}<small>{unit}</small></div>
        {note && <span className="metric-note">{note}</span>}
      </div>
    </article>
  );
}
