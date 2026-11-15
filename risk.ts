import type {
  DrivingEvent,
  DrivingSession,
  RiskFactor,
  RiskLevel,
  SessionSummary,
} from '../types';

const BASE_SCORE = 10;
const RECENT_EVENT_WINDOW_MS = 60_000;

function isRecent(event: DrivingEvent, now: number): boolean {
  const age = now - event.occurredAt;
  return age >= 0 && age < RECENT_EVENT_WINDOW_MS;
}

export function getRiskScore(session: Pick<DrivingSession, 'elapsedSeconds' | 'events'> | null, now = Date.now()): number {
  if (!session) return BASE_SCORE;

  const recentEvents = session.events.filter((event) => isRecent(event, now));
  const brakingCount = recentEvents.filter((event) => event.kind === 'hard_braking').length;
  const accelerationCount = recentEvents.filter((event) => event.kind === 'hard_acceleration').length;
  const driveMinutes = session.elapsedSeconds / 60;

  let score = BASE_SCORE + brakingCount * 20 + accelerationCount * 12;
  if (driveMinutes > 90) score += 20;
  if (driveMinutes > 120) score += 15;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 70) return 'danger';
  if (score >= 40) return 'caution';
  return 'safe';
}

export function getRiskLabel(level: RiskLevel): string {
  if (level === 'danger') return '위험';
  if (level === 'caution') return '주의';
  return '안전';
}

export function getRiskFactors(
  session: Pick<DrivingSession, 'elapsedSeconds' | 'events'> | null,
  now = Date.now(),
): RiskFactor[] {
  if (!session) {
    return [{ key: 'base', label: '기본 점수', detail: '시연 기본값', points: BASE_SCORE }];
  }

  const recentEvents = session.events.filter((event) => isRecent(event, now));
  const brakes = recentEvents.filter((event) => event.kind === 'hard_braking').length;
  const accelerations = recentEvents.filter((event) => event.kind === 'hard_acceleration').length;
  const minutes = session.elapsedSeconds / 60;
  const factors: RiskFactor[] = [{ key: 'base', label: '기본 점수', detail: '시연 기본값', points: BASE_SCORE }];

  if (brakes > 0) {
    factors.push({
      key: 'braking',
      label: '최근 급제동',
      detail: `최근 60초 ${brakes}회 × 20점`,
      points: brakes * 20,
    });
  }
  if (accelerations > 0) {
    factors.push({
      key: 'acceleration',
      label: '최근 급가속',
      detail: `최근 60초 ${accelerations}회 × 12점`,
      points: accelerations * 12,
    });
  }
  if (minutes > 90) {
    factors.push({ key: 'drive-90', label: '연속 주행 90분 초과', detail: `${Math.floor(minutes)}분 경과`, points: 20 });
  }
  if (minutes > 120) {
    factors.push({ key: 'drive-120', label: '연속 주행 120분 초과', detail: `${Math.floor(minutes)}분 경과`, points: 15 });
  }
  return factors;
}

export function getCoachMessage(session: Pick<DrivingSession, 'elapsedSeconds' | 'events'> | null, now = Date.now()): string {
  if (!session) return '시뮬레이션을 시작하면 현재 주행 신호에 맞춘 안전 안내를 제공합니다.';

  const recentEvents = session.events.filter((event) => isRecent(event, now));
  const hasBraking = recentEvents.some((event) => event.kind === 'hard_braking');
  const hasAcceleration = recentEvents.some((event) => event.kind === 'hard_acceleration');
  const minutes = session.elapsedSeconds / 60;

  if (minutes > 90) return '연속 운전 시간이 길어지고 있습니다. 안전한 장소에 정차한 뒤 충분히 휴식하세요.';
  if (hasBraking) return '최근 급제동이 기록되었습니다. 앞차와 안전거리를 넉넉히 확보하고 속도를 부드럽게 조절하세요.';
  if (hasAcceleration) return '최근 급가속이 기록되었습니다. 페달을 부드럽게 밟아 승차감과 안전거리를 확보하세요.';
  return '현재 시뮬레이션은 안정 상태입니다. 앞을 주시하고 여유 있는 차간 거리를 유지하세요.';
}

export function getEventCoachMessage(event: DrivingEvent): string {
  if (event.kind === 'hard_braking') return '급제동이 발생했습니다. 앞차와 안전거리를 넉넉히 확보하세요.';
  if (event.kind === 'hard_acceleration') return '급가속이 발생했습니다. 부드럽게 가속하고 주변 흐름을 살펴보세요.';
  if (event.kind === 'long_drive') return '장시간 운전 시나리오입니다. 안전한 장소에서 휴식을 고려하세요.';
  return event.message;
}

export function summarizeSession(
  session: Pick<DrivingSession, 'elapsedSeconds' | 'events' | 'riskSamples' | 'riskTotal' | 'riskSampleCount' | 'maxRiskScore'>,
): SessionSummary {
  const accelerationCount = session.events.filter((event) => event.kind === 'hard_acceleration').length;
  const brakingCount = session.events.filter((event) => event.kind === 'hard_braking').length;
  const scores = session.riskSamples.map((sample) => sample.score);
  const hasAggregate = typeof session.riskTotal === 'number'
    && typeof session.riskSampleCount === 'number'
    && session.riskSampleCount > 0;
  const averageRisk = hasAggregate
    ? Math.round(session.riskTotal! / session.riskSampleCount!)
    : scores.length > 0
      ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length)
      : BASE_SCORE;
  const maximumRisk = typeof session.maxRiskScore === 'number'
    ? session.maxRiskScore
    : scores.length > 0
      ? Math.max(...scores)
      : BASE_SCORE;

  return {
    durationMinutes: Math.floor(session.elapsedSeconds / 60),
    accelerationCount,
    brakingCount,
    averageRisk,
    maximumRisk,
  };
}
