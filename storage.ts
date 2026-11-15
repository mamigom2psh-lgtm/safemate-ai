import type { CompletedSession, DrivingEvent, EventKind, RiskSample, Scenario } from '../types';

const STORAGE_KEY = 'safemate-ai:trip-history:v1';
const MAX_SAVED_SESSIONS = 30;
const EVENT_KINDS = new Set<EventKind>(['hard_acceleration', 'hard_braking', 'long_drive', 'mode_change']);
const SCENARIOS = new Set<Scenario>(['normal', 'acceleration', 'braking', 'longDrive']);

export interface StorageReadResult {
  sessions: CompletedSession[];
  error: string | null;
}

export function loadCompletedSessions(): StorageReadResult {
  if (typeof window === 'undefined') return { sessions: [], error: null };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { sessions: [], error: null };
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { sessions: [], error: '저장된 기록 형식이 올바르지 않습니다. 새 기록 저장은 계속 시도할 수 있습니다.' };

    const sessions = parsed.filter(isCompletedSession).slice(0, MAX_SAVED_SESSIONS);
    const error = sessions.length === parsed.length
      ? null
      : '일부 저장 기록을 읽지 못했습니다. 확인 가능한 기록만 표시합니다.';
    return { sessions, error };
  } catch {
    return { sessions: [], error: '브라우저 저장 기록을 읽지 못했습니다. 저장 공간 또는 데이터 형식을 확인하세요.' };
  }
}

export function persistCompletedSessions(sessions: CompletedSession[]): string | null {
  if (typeof window === 'undefined') return '이 환경에서는 브라우저 저장소를 사용할 수 없습니다.';
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, MAX_SAVED_SESSIONS)));
    return null;
  } catch {
    return '주행 기록을 저장하지 못했습니다. 브라우저 저장 공간과 개인정보 보호 설정을 확인하세요.';
  }
}

export function clearPersistedSessions(): string | null {
  if (typeof window === 'undefined') return '이 환경에서는 브라우저 저장소를 사용할 수 없습니다.';
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  } catch {
    return '저장 기록을 초기화하지 못했습니다. 브라우저 저장소 설정을 확인하세요.';
  }
}

function isCompletedSession(value: unknown): value is CompletedSession {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<CompletedSession>;
  if (
    typeof item.id !== 'string'
    || item.id.length === 0
    || !isFiniteNumber(item.startedAt)
    || !isFiniteNumber(item.endedAt)
    || item.endedAt < item.startedAt
    || !isFiniteNumber(item.elapsedSeconds)
    || item.elapsedSeconds < 0
    || !isFiniteNumber(item.maxSpeedKmh)
    || item.maxSpeedKmh < 0
    || item.maxSpeedKmh > 120
    || !isScenario(item.scenario)
    || !Array.isArray(item.events)
    || !Array.isArray(item.riskSamples)
    || !item.events.every((event) => isDrivingEvent(event, item))
    || !item.riskSamples.every((sample) => isRiskSample(sample, item.elapsedSeconds!))
  ) return false;

  const hasAnyAggregate = item.riskTotal !== undefined || item.riskSampleCount !== undefined || item.maxRiskScore !== undefined;
  if (!hasAnyAggregate) return true;

  return isFiniteNumber(item.riskTotal)
    && item.riskTotal >= 0
    && isFiniteNumber(item.riskSampleCount)
    && Number.isInteger(item.riskSampleCount)
    && item.riskSampleCount > 0
    && item.riskTotal <= item.riskSampleCount * 100
    && isFiniteNumber(item.maxRiskScore)
    && item.maxRiskScore >= 0
    && item.maxRiskScore <= 100;
}

function isDrivingEvent(value: unknown, session: Partial<CompletedSession>): value is DrivingEvent {
  if (!value || typeof value !== 'object') return false;
  const event = value as Partial<DrivingEvent>;
  return typeof event.id === 'string'
    && EVENT_KINDS.has(event.kind as EventKind)
    && isFiniteNumber(event.occurredAt)
    && event.occurredAt >= session.startedAt!
    && event.occurredAt <= session.endedAt!
    && isFiniteNumber(event.elapsedSeconds)
    && event.elapsedSeconds >= 0
    && event.elapsedSeconds <= session.elapsedSeconds!
    && typeof event.message === 'string';
}

function isRiskSample(value: unknown, sessionElapsedSeconds: number): value is RiskSample {
  if (!value || typeof value !== 'object') return false;
  const sample = value as Partial<RiskSample>;
  return isFiniteNumber(sample.elapsedSeconds)
    && sample.elapsedSeconds >= 0
    && sample.elapsedSeconds <= sessionElapsedSeconds
    && isFiniteNumber(sample.score)
    && sample.score >= 0
    && sample.score <= 100;
}

function isScenario(value: unknown): value is Scenario {
  return typeof value === 'string' && SCENARIOS.has(value as Scenario);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
