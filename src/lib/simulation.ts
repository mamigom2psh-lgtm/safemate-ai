import type { DrivingEvent, Scenario, Telemetry } from '../types';

/** Pleos SDK 도입 시 모의 공급자 대신 차량 데이터 어댑터로 교체할 계약입니다. */
export interface TelemetryProvider {
  next(previous: Telemetry, scenario: Scenario, now?: number): Telemetry;
}

export const simulationTelemetryProvider: TelemetryProvider = {
  next(previous, scenario, now = Date.now()) {
    let speedKmh = previous.speedKmh;
    let throttlePercent = 14;
    let brakePercent = 0;

    if (scenario === 'normal') {
      speedKmh = clamp(speedKmh + Math.round(Math.random() * 6 - 3), 28, 88);
      throttlePercent = clamp(14 + Math.round(Math.random() * 12 - 6), 5, 30);
    } else if (scenario === 'acceleration') {
      speedKmh = clamp(speedKmh + Math.round(Math.random() * 2), 0, 120);
      throttlePercent = 76 + Math.round(Math.random() * 12);
    } else if (scenario === 'braking') {
      speedKmh = clamp(speedKmh - Math.round(Math.random() * 2), 0, 120);
      brakePercent = 68 + Math.round(Math.random() * 16);
      throttlePercent = 0;
    } else {
      speedKmh = clamp(speedKmh + Math.round(Math.random() * 4 - 2), 32, 82);
      throttlePercent = 12 + Math.round(Math.random() * 8);
    }

    return { speedKmh, throttlePercent, brakePercent, updatedAt: now };
  },
};

export function createDrivingEvent(kind: DrivingEvent['kind'], elapsedSeconds: number, occurredAt = Date.now()): DrivingEvent {
  const messages: Record<DrivingEvent['kind'], string> = {
    hard_acceleration: '급가속 시나리오 이벤트가 발생했습니다.',
    hard_braking: '급제동 시나리오 이벤트가 발생했습니다.',
    long_drive: '장시간 운전 시나리오: 연속 주행 시간을 125분으로 이동했습니다.',
    mode_change: '정상 주행 시나리오로 전환했습니다.',
  };

  return {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${occurredAt}-${Math.random().toString(16).slice(2)}`,
    kind,
    occurredAt,
    elapsedSeconds,
    message: messages[kind],
  };
}

export function applyScenarioTelemetry(current: Telemetry, scenario: Scenario, now = Date.now()): Telemetry {
  if (scenario === 'acceleration') {
    return { speedKmh: clamp(current.speedKmh + 16, 0, 120), throttlePercent: 84, brakePercent: 0, updatedAt: now };
  }
  if (scenario === 'braking') {
    return { speedKmh: clamp(current.speedKmh - 22, 0, 120), throttlePercent: 0, brakePercent: 82, updatedAt: now };
  }
  if (scenario === 'normal') {
    return { speedKmh: Math.max(0, current.speedKmh), throttlePercent: 14, brakePercent: 0, updatedAt: now };
  }
  return { speedKmh: Math.max(0, current.speedKmh), throttlePercent: 16, brakePercent: 0, updatedAt: now };
}

export function makeEmptyTelemetry(): Telemetry {
  return { speedKmh: 0, throttlePercent: 0, brakePercent: 0, updatedAt: Date.now() };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
