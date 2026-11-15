import { useCallback, useEffect, useRef, useState } from 'react';
import type { CompletedSession, DrivingSession, RiskSample, Scenario, Telemetry } from '../types';
import { getRiskScore } from '../lib/risk';
import {
  applyScenarioTelemetry,
  createDrivingEvent,
  makeEmptyTelemetry,
  simulationTelemetryProvider,
} from '../lib/simulation';
import {
  clearPersistedSessions,
  loadCompletedSessions,
  persistCompletedSessions,
} from '../lib/storage';

const LONG_DRIVE_DEMO_SECONDS = 125 * 60;
const CHART_SAMPLE_INTERVAL_SECONDS = 5;
const MAX_CHART_SAMPLES = 1_500;

function makeNewSession(now: number): DrivingSession {
  return {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `trip-${now}`,
    startedAt: now,
    endedAt: null,
    elapsedSeconds: 0,
    events: [],
    riskSamples: [{ elapsedSeconds: 0, score: 10 }],
    riskTotal: 10,
    riskSampleCount: 1,
    maxRiskScore: 10,
    maxSpeedKmh: 0,
    scenario: 'normal',
  };
}

function recordChartSample(samples: RiskSample[], elapsedSeconds: number, score: number): RiskSample[] {
  const last = samples[samples.length - 1];
  let next = last?.elapsedSeconds === elapsedSeconds
    ? samples.map((sample, index) => index === samples.length - 1 ? { ...sample, score } : sample)
    : [...samples, { elapsedSeconds, score }];

  if (next.length > MAX_CHART_SAMPLES) {
    next = next.filter((_, index) => index === 0 || index === next.length - 1 || index % 2 === 0);
  }
  return next;
}

function addRiskObservation(session: DrivingSession, score: number) {
  const fallbackTotal = session.riskSamples.reduce((total, sample) => total + sample.score, 0);
  const fallbackCount = Math.max(1, session.riskSamples.length);
  const existingMaximum = session.maxRiskScore ?? Math.max(10, ...session.riskSamples.map((sample) => sample.score));
  return {
    riskTotal: (session.riskTotal ?? fallbackTotal) + score,
    riskSampleCount: (session.riskSampleCount ?? fallbackCount) + 1,
    maxRiskScore: Math.max(existingMaximum, score),
  };
}

export function useDrivingSession() {
  const [session, setSession] = useState<DrivingSession | null>(null);
  const [scenario, setScenarioState] = useState<Scenario>('normal');
  const [telemetry, setTelemetry] = useState<Telemetry>(makeEmptyTelemetry);
  const [stored, setStored] = useState(loadCompletedSessions);
  const sessionRef = useRef<DrivingSession | null>(null);
  const runningRef = useRef(false);
  const scenarioRef = useRef<Scenario>('normal');
  const telemetryRef = useRef<Telemetry>(makeEmptyTelemetry());

  const startSession = useCallback(() => {
    if (runningRef.current) return;
    const now = Date.now();
    const next = makeNewSession(now);
    const emptyTelemetry = makeEmptyTelemetry();
    runningRef.current = true;
    scenarioRef.current = 'normal';
    telemetryRef.current = emptyTelemetry;
    sessionRef.current = next;
    setScenarioState('normal');
    setTelemetry(emptyTelemetry);
    setSession(next);
  }, []);

  const stopSession = useCallback(() => {
    const active = sessionRef.current;
    if (!active || !runningRef.current) return;

    runningRef.current = false;
    const endedAt = Date.now();
    const finalScore = getRiskScore(active, endedAt);
    const completed: CompletedSession = {
      ...active,
      endedAt,
      riskSamples: recordChartSample(active.riskSamples, active.elapsedSeconds, finalScore),
      ...addRiskObservation(active, finalScore),
    };
    const nextSessions = [completed, ...stored.sessions.filter((item) => item.id !== completed.id)].slice(0, 30);
    const error = persistCompletedSessions(nextSessions);

    sessionRef.current = null;
    setSession(null);
    setStored({ sessions: nextSessions, error });
  }, [stored.sessions]);

  const selectScenario = useCallback((nextScenario: Scenario) => {
    if (!runningRef.current) startSession();
    const previous = sessionRef.current;
    if (!previous) return;

    const now = Date.now();
    const nextTelemetry = applyScenarioTelemetry(telemetryRef.current, nextScenario, now);
    telemetryRef.current = nextTelemetry;
    scenarioRef.current = nextScenario;
    setTelemetry(nextTelemetry);
    setScenarioState(nextScenario);

    const nextElapsed = nextScenario === 'longDrive'
      ? Math.max(previous.elapsedSeconds, LONG_DRIVE_DEMO_SECONDS)
      : previous.elapsedSeconds;
    const kind = nextScenario === 'acceleration'
      ? 'hard_acceleration'
      : nextScenario === 'braking'
        ? 'hard_braking'
        : nextScenario === 'longDrive'
          ? 'long_drive'
          : 'mode_change';
    const event = createDrivingEvent(kind, nextElapsed, now);
    const draft = { ...previous, elapsedSeconds: nextElapsed, events: [...previous.events, event] };
    const score = getRiskScore(draft, now);
    const next: DrivingSession = {
      ...draft,
      scenario: nextScenario,
      riskSamples: recordChartSample(previous.riskSamples, nextElapsed, score),
      ...addRiskObservation(previous, score),
      maxSpeedKmh: Math.max(previous.maxSpeedKmh, nextTelemetry.speedKmh),
    };
    sessionRef.current = next;
    setSession(next);
  }, [startSession]);

  const clearHistory = useCallback(() => {
    const error = clearPersistedSessions();
    if (!error) setStored({ sessions: [], error: null });
    else setStored((previous) => ({ ...previous, error }));
  }, []);

  useEffect(() => {
    if (!session) return undefined;
    const timer = window.setInterval(() => {
      if (!runningRef.current) return;
      const previous = sessionRef.current;
      if (!previous) return;
      const now = Date.now();
      const nextTelemetry = simulationTelemetryProvider.next(telemetryRef.current, scenarioRef.current, now);
      telemetryRef.current = nextTelemetry;
      setTelemetry(nextTelemetry);

      const elapsedSeconds = previous.elapsedSeconds + 1;
      const draft = {
        ...previous,
        elapsedSeconds,
        maxSpeedKmh: Math.max(previous.maxSpeedKmh, nextTelemetry.speedKmh),
      };
      const score = getRiskScore(draft, now);
      const shouldChartSample = elapsedSeconds % CHART_SAMPLE_INTERVAL_SECONDS === 0;
      const next: DrivingSession = {
        ...draft,
        riskSamples: shouldChartSample
          ? recordChartSample(previous.riskSamples, elapsedSeconds, score)
          : previous.riskSamples,
        ...addRiskObservation(previous, score),
      };
      sessionRef.current = next;
      setSession(next);
    }, 1_000);

    return () => window.clearInterval(timer);
  }, [session?.id]);

  return {
    session,
    scenario,
    telemetry,
    savedSessions: stored.sessions,
    storageError: stored.error,
    isDriving: session !== null,
    startSession,
    stopSession,
    selectScenario,
    clearHistory,
  };
}
