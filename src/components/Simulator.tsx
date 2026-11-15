import { Activity, ArrowDownRight, ArrowUpRight, Clock3, Gauge, Play, Radio, Square } from 'lucide-react';
import type { DrivingEvent, DrivingSession, RiskLevel, Scenario, Telemetry } from '../types';
import { formatDuration, formatTime } from '../lib/format';
import { StatusBadge } from './StatusBadge';

interface SimulatorProps {
  session: DrivingSession | null;
  telemetry: Telemetry;
  scenario: Scenario;
  riskScore: number;
  riskLevel: RiskLevel;
  events: DrivingEvent[];
  isDriving: boolean;
  onStart: () => void;
  onStop: () => void;
  onSelectScenario: (scenario: Scenario) => void;
}

const scenarios: { id: Scenario; title: string; detail: string; icon: typeof Activity; tag: string }[] = [
  { id: 'normal', title: '정상 주행', detail: '완만한 속도 변화', icon: Activity, tag: 'BASELINE' },
  { id: 'acceleration', title: '급가속', detail: '위험 이벤트 +12점', icon: ArrowUpRight, tag: 'EVENT +12' },
  { id: 'braking', title: '급제동', detail: '위험 이벤트 +20점', icon: ArrowDownRight, tag: 'EVENT +20' },
  { id: 'longDrive', title: '장시간 운전', detail: '125분으로 시간 이동', icon: Clock3, tag: 'TIME JUMP' },
];

const scenarioLabel: Record<Scenario, string> = {
  normal: '정상 주행',
  acceleration: '급가속',
  braking: '급제동',
  longDrive: '장시간 운전',
};

export function Simulator({ session, telemetry, scenario, riskScore, riskLevel, events, isDriving, onStart, onStop, onSelectScenario }: SimulatorProps) {
  return (
    <div className="page-stack">
      <div className="page-heading">
        <div><div className="eyebrow"><span className="eyebrow-line" /> SIMULATION LAB</div><h1>주행 시뮬레이터</h1><p>실제 차량에 연결하지 않고 안전 시나리오를 재생합니다.</p></div>
        <div className="heading-actions">
          <span className="sim-tag"><span className="simulation-dot" /> MOCK DATA ONLY</span>
          {isDriving ? <button className="button button-stop" type="button" onClick={onStop}><Square size={16} fill="currentColor" aria-hidden="true" /> 주행 종료</button> : <button className="button button-primary" type="button" onClick={onStart}><Play size={16} fill="currentColor" aria-hidden="true" /> 주행 시작</button>}
        </div>
      </div>

      <section className="sim-live-panel panel">
        <div className="sim-live-header">
          <div className="live-heading"><span className={`live-pulse${isDriving ? ' live-pulse-on' : ''}`} /><div><span className="panel-label">LIVE FEED · SIMULATED</span><h2>{isDriving ? '모의 주행 신호 수신 중' : '시뮬레이션 대기 중'}</h2></div></div>
          <StatusBadge level={riskLevel} compact />
        </div>
        <div className="sim-live-metrics">
          <div className="sim-live-metric"><span>현재 속도</span><strong>{telemetry.speedKmh}<small> km/h</small></strong><div className="sim-metric-line"><span style={{ width: `${Math.min(100, telemetry.speedKmh / 1.2)}%` }} /></div></div>
          <div className="sim-live-metric"><span>연속 주행</span><strong>{formatDuration(session?.elapsedSeconds ?? 0)}</strong><small>1초마다 갱신</small></div>
          <div className="sim-live-metric"><span>위험 점수</span><strong className={`text-${riskLevel}`}>{riskScore}<small> / 100</small></strong><small>현재 시나리오 {scenarioLabel[scenario]}</small></div>
          <div className="sim-live-metric"><span>시뮬레이션 입력</span><strong className="signal-value"><Radio size={19} /> 연결됨</strong><small>실제 차량 미연결</small></div>
        </div>
        <p className="sim-hint"><Gauge size={15} aria-hidden="true" /> 시나리오 입력은 화면에서만 데이터로 반영됩니다. 속도 자체는 위험도에 포함되지 않습니다.</p>
      </section>

      <div className="sim-content-grid">
        <section className="panel scenario-panel">
          <div className="section-heading"><div><span className="panel-label">CHOOSE A SCENARIO</span><h2>시나리오 선택</h2></div><span className="scenario-refresh">주행 중 전환 가능</span></div>
          <div className="scenario-grid">
            {scenarios.map(({ id, title, detail, icon: Icon, tag }) => (
              <button key={id} type="button" className={`scenario-card${scenario === id && isDriving ? ' scenario-selected' : ''} scenario-${id}`} onClick={() => onSelectScenario(id)} aria-pressed={scenario === id && isDriving}>
                <span className="scenario-icon"><Icon size={20} strokeWidth={2.2} aria-hidden="true" /></span>
                <span className="scenario-title">{title}</span>
                <span className="scenario-detail">{detail}</span>
                <span className="scenario-tag">{tag}</span>
              </button>
            ))}
          </div>
          <div className="scenario-footer"><span>시나리오 선택 시 운행을 시작하거나 현재 운행에 이벤트를 추가합니다.</span><span>시연용 가정</span></div>
        </section>

        <section className="panel event-log-panel">
          <div className="section-heading"><div><span className="panel-label">SESSION TIMELINE</span><h2>위험 이벤트 기록</h2></div><span className="event-count">{events.length}건</span></div>
          {events.length === 0 ? (
            <div className="event-empty"><span className="event-empty-icon"><Activity size={20} /></span><p>아직 기록된 이벤트가 없습니다.</p><small>위 시나리오를 선택해 주행을 시작하세요.</small></div>
          ) : (
            <ol className="event-list">
              {[...events].sort((a, b) => a.occurredAt - b.occurredAt).slice(-8).reverse().map((event) => (
                <li key={event.id}>
                  <span className={`event-dot event-${event.kind}`} />
                  <div className="event-entry-copy"><b>{event.kind === 'hard_braking' ? '급제동' : event.kind === 'hard_acceleration' ? '급가속' : event.kind === 'long_drive' ? '장시간 운전' : '정상 주행'}</b><span>{event.message}</span></div>
                  <time>{formatTime(event.occurredAt)}</time>
                </li>
              ))}
            </ol>
          )}
          <div className="event-log-footer">시각은 이벤트 발생 시각 · 최근 이벤트부터 표시</div>
        </section>
      </div>
    </div>
  );
}
