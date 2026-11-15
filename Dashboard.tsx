import { ArrowDownRight, ArrowRight, ArrowUpRight, Clock3, Gauge, Play, ShieldAlert, ShieldCheck, Square, Wind } from 'lucide-react';
import type { DrivingEvent, DrivingSession, RiskFactor, RiskLevel, Scenario, Telemetry } from '../types';
import { formatDuration, formatTime } from '../lib/format';
import { getRiskLabel } from '../lib/risk';
import { MetricCard } from './MetricCard';
import { RiskGauge } from './RiskGauge';
import { StatusBadge } from './StatusBadge';

interface DashboardProps {
  session: DrivingSession | null;
  isDriving: boolean;
  scenario: Scenario;
  telemetry: Telemetry;
  riskScore: number;
  riskLevel: RiskLevel;
  coachMessage: string;
  riskFactors: RiskFactor[];
  events: DrivingEvent[];
  onStart: () => void;
  onStop: () => void;
  onNavigate: (page: 'simulator' | 'coach' | 'reports') => void;
}

const scenarioNames: Record<Scenario, string> = {
  normal: '정상 주행',
  acceleration: '급가속',
  braking: '급제동',
  longDrive: '장시간 운전',
};

export function Dashboard({
  session,
  isDriving,
  scenario,
  telemetry,
  riskScore,
  riskLevel,
  coachMessage,
  riskFactors,
  events,
  onStart,
  onStop,
  onNavigate,
}: DashboardProps) {
  const recentEvents = [...events].slice(-3).reverse();
  const statusIcon = riskLevel === 'danger' ? <ShieldAlert size={20} /> : <ShieldCheck size={20} />;

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> SAFE DRIVE MONITOR</div>
          <h1>안전 주행 대시보드</h1>
          <p>주행 흐름을 확인하고, 다음 안전 행동을 안내받으세요.</p>
        </div>
        <div className="heading-actions">
          <span className="sim-tag"><span className="simulation-dot" /> 실제 차량 미연결 · 모의 데이터</span>
          {isDriving ? (
            <button className="button button-stop" type="button" onClick={onStop}><Square size={16} fill="currentColor" aria-hidden="true" /> 주행 종료</button>
          ) : (
            <button className="button button-primary" type="button" onClick={onStart}><Play size={16} fill="currentColor" aria-hidden="true" /> 주행 시작</button>
          )}
        </div>
      </div>

      <section className="dashboard-hero" aria-label="현재 주행 상태">
        <div className={`hero-risk-pane risk-pane-${riskLevel}`}>
          <div className="hero-pane-top">
            <span className="panel-label">CURRENT RISK</span>
            <StatusBadge level={riskLevel} />
          </div>
          <div className="risk-display-row">
            <RiskGauge score={riskScore} level={riskLevel} />
            <div className="risk-summary">
              <div className="risk-state-title">{getRiskLabel(riskLevel)} 상태</div>
              <p>위험 지표를 바탕으로<br />안전 행동을 안내합니다.</p>
              <div className="risk-factor-list">
                {riskFactors.map((factor) => (
                  <div className="risk-factor-line" key={factor.key}>
                    <span>{factor.label}</span><b>+{factor.points}</b>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="hero-speed-pane">
          <div className="speed-pane-head">
            <div><span className="panel-label">VEHICLE TELEMETRY</span><h2>현재 속도</h2></div>
            <div className="signal-mark"><span /><span /><span /><span /></div>
          </div>
          <div className="speed-readout"><strong>{telemetry.speedKmh}</strong><span>km/h</span></div>
          <div className="speed-track" aria-hidden="true"><span style={{ width: `${Math.min(100, telemetry.speedKmh / 1.2)}%` }} /></div>
          <div className="speed-track-labels"><span>0</span><span>시뮬레이션 속도 · 제한속도 판정 없음</span><span>120</span></div>
          <div className="speed-meta-row">
            <div><Wind size={15} aria-hidden="true" /><span>시나리오</span><b>{scenarioNames[scenario]}</b></div>
            <div><Clock3 size={15} aria-hidden="true" /><span>연속 운전</span><b>{formatDuration(session?.elapsedSeconds ?? 0)}</b></div>
          </div>
        </div>

        <div className="coach-strip">
          <div className={`coach-strip-icon tone-${riskLevel}`} aria-hidden="true">{statusIcon}</div>
          <div className="coach-strip-copy"><span className="coach-kicker">SAFE COACH</span><p>{coachMessage}</p></div>
          <button className="text-action" type="button" onClick={() => onNavigate('coach')}>코치 보기 <ArrowRight size={15} aria-hidden="true" /></button>
        </div>
      </section>

      <section className="metric-grid" aria-label="운행 요약">
        <MetricCard icon={<Clock3 size={19} />} label="운전 시간" value={session ? Math.floor(session.elapsedSeconds / 60) : 0} unit="분" note={isDriving ? '연속 주행 시간' : '운행 시작 대기'} tone="blue" />
        <MetricCard icon={<ArrowUpRight size={20} />} label="급가속" value={events.filter((event) => event.kind === 'hard_acceleration').length} unit="회" note="현재 운행 누계" tone="amber" />
        <MetricCard icon={<ArrowDownRight size={20} />} label="급제동" value={events.filter((event) => event.kind === 'hard_braking').length} unit="회" note="현재 운행 누계" tone="red" />
        <MetricCard icon={<Gauge size={19} />} label="현재 상태" value={getRiskLabel(riskLevel)} note="시뮬레이션 기준" tone={riskLevel === 'danger' ? 'red' : riskLevel === 'caution' ? 'amber' : 'mint'} />
      </section>

      <section className="dashboard-bottom">
        <div className="panel recent-events-panel">
          <div className="section-heading"><div><span className="panel-label">LIVE EVENT LOG</span><h2>최근 주행 이벤트</h2></div><button className="text-action" type="button" onClick={() => onNavigate('reports')}>전체 리포트 <ArrowRight size={15} aria-hidden="true" /></button></div>
          {recentEvents.length === 0 ? (
            <div className="empty-inline"><span className="empty-check">✓</span>기록된 위험 이벤트가 없습니다.<small>시나리오를 선택하면 이벤트가 이곳에 기록됩니다.</small></div>
          ) : (
            <ol className="mini-event-list">
              {recentEvents.map((event) => (
                <li key={event.id}>
                  <span className={`event-dot event-${event.kind}`} />
                  <span className="mini-event-message">{event.message}</span>
                  <time dateTime={new Date(event.occurredAt).toISOString()}>{formatTime(event.occurredAt)}</time>
                </li>
              ))}
            </ol>
          )}
        </div>
        <div className="simulation-note panel">
          <span className="simulation-note-icon"><ShieldCheck size={18} aria-hidden="true" /></span>
          <div><b>시연용 안전 보조</b><p>속도만으로 과속을 판정하지 않으며<br />차량 제어 기능은 제공하지 않습니다.</p></div>
          <button className="note-arrow" type="button" onClick={() => onNavigate('simulator')} aria-label="주행 시뮬레이터로 이동"><ArrowRight size={17} aria-hidden="true" /></button>
        </div>
      </section>
    </div>
  );
}
