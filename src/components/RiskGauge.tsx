import type { RiskLevel } from '../types';
import { getRiskLabel } from '../lib/risk';

interface RiskGaugeProps {
  score: number;
  level: RiskLevel;
}

export function RiskGauge({ score, level }: RiskGaugeProps) {
  const safeScore = Math.min(100, Math.max(0, score));
  const circumference = 2 * Math.PI * 80;
  const offset = circumference * (1 - safeScore / 100);
  return (
    <div className={`risk-gauge gauge-${level}`} role="img" aria-label={`위험 점수 ${safeScore}점, ${getRiskLabel(level)} 상태`}>
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <circle className="gauge-track" cx="100" cy="100" r="80" />
        <circle className="gauge-progress" cx="100" cy="100" r="80" strokeDasharray={circumference} strokeDashoffset={offset} />
        <circle className="gauge-inner" cx="100" cy="100" r="64" />
      </svg>
      <div className="gauge-copy">
        <span className="gauge-overline">위험 점수</span>
        <strong>{safeScore}<small>점</small></strong>
        <span className="gauge-state">{getRiskLabel(level)}</span>
      </div>
    </div>
  );
}
