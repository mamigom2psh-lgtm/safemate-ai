import { Check, TriangleAlert, OctagonAlert } from 'lucide-react';
import type { RiskLevel } from '../types';
import { getRiskLabel } from '../lib/risk';

interface StatusBadgeProps {
  level: RiskLevel;
  compact?: boolean;
}

export function StatusBadge({ level, compact = false }: StatusBadgeProps) {
  const Icon = level === 'danger' ? OctagonAlert : level === 'caution' ? TriangleAlert : Check;
  return (
    <span className={`status-badge status-${level}${compact ? ' status-compact' : ''}`} role="status">
      <Icon size={compact ? 15 : 17} strokeWidth={2.4} aria-hidden="true" />
      <span>{getRiskLabel(level)}</span>
    </span>
  );
}
