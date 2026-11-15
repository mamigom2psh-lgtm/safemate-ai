export type Scenario = 'normal' | 'acceleration' | 'braking' | 'longDrive';
export type RiskLevel = 'safe' | 'caution' | 'danger';
export type EventKind = 'hard_acceleration' | 'hard_braking' | 'long_drive' | 'mode_change';

export interface Telemetry {
  speedKmh: number;
  throttlePercent: number;
  brakePercent: number;
  updatedAt: number;
}

export interface DrivingEvent {
  id: string;
  kind: EventKind;
  occurredAt: number;
  elapsedSeconds: number;
  message: string;
}

export interface RiskSample {
  elapsedSeconds: number;
  score: number;
}

export interface DrivingSession {
  id: string;
  startedAt: number;
  endedAt: number | null;
  elapsedSeconds: number;
  events: DrivingEvent[];
  riskSamples: RiskSample[];
  /** Exact one-second/event observation aggregate; optional to read earlier v1 records. */
  riskTotal?: number;
  riskSampleCount?: number;
  maxRiskScore?: number;
  maxSpeedKmh: number;
  scenario: Scenario;
}

export interface CompletedSession extends Omit<DrivingSession, 'endedAt'> {
  endedAt: number;
}

export interface RiskFactor {
  key: string;
  label: string;
  detail: string;
  points: number;
}

export interface SessionSummary {
  durationMinutes: number;
  accelerationCount: number;
  brakingCount: number;
  averageRisk: number;
  maximumRisk: number;
}

export type AppPage = 'dashboard' | 'simulator' | 'coach' | 'reports';
