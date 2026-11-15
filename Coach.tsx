import { ArrowDownRight, ArrowUpRight, CheckCircle2, Clock3, Headphones, Info, ShieldAlert, ShieldCheck, Volume2, VolumeX } from 'lucide-react';
import type { DrivingEvent, DrivingSession, RiskFactor, RiskLevel } from '../types';
import { getCoachMessage, getRiskLabel } from '../lib/risk';
import { StatusBadge } from './StatusBadge';

interface CoachProps {
  session: DrivingSession | null;
  events: DrivingEvent[];
  riskScore: number;
  riskLevel: RiskLevel;
  factors: RiskFactor[];
  voiceEnabled: boolean;
  speechSupported: boolean;
  onToggleVoice: () => void;
}

export function Coach({ session, events, riskScore, riskLevel, factors, voiceEnabled, speechSupported, onToggleVoice }: CoachProps) {
  const recentEvents = events.filter((event) => Date.now() - event.occurredAt < 60_000);
  const hasBrake = recentEvents.some((event) => event.kind === 'hard_braking');
  const hasAcceleration = recentEvents.some((event) => event.kind === 'hard_acceleration');
  const hasLongDrive = (session?.elapsedSeconds ?? 0) / 60 > 90;
  const currentMessage = getCoachMessage(session);
  const urgentIcon = riskLevel === 'danger' ? <ShieldAlert size={21} /> : <ShieldCheck size={21} />;

  return (
    <div className="page-stack coach-page">
      <div className="page-heading">
        <div><div className="eyebrow"><span className="eyebrow-line" /> PERSONAL SAFETY COACH</div><h1>안전 코치</h1><p>현재 주행 신호가 어떤 행동을 권고하는지 확인하세요.</p></div>
        <div className="heading-actions"><span className="sim-tag"><span className="simulation-dot" /> 시뮬레이션 기준 안내</span></div>
      </div>

      <section className={`coach-status-card coach-status-${riskLevel}`} aria-live="polite">
        <div className="coach-status-icon" aria-hidden="true">{urgentIcon}</div>
        <div className="coach-status-copy"><span className="panel-label">CURRENT GUIDANCE · {riskScore}점</span><h2>{getRiskLabel(riskLevel)} 상태에서의 안내</h2><p>{currentMessage}</p></div>
        <StatusBadge level={riskLevel} />
      </section>

      <div className="coach-body-grid">
        <section className="panel coach-reasons-panel">
          <div className="section-heading"><div><span className="panel-label">WHY THIS SCORE</span><h2>현재 위험 원인</h2></div><span className="coach-score">{riskScore}<small> / 100</small></span></div>
          <div className="factor-list">
            {factors.map((factor) => (
              <div className="factor-row" key={factor.key}>
                <span className={`factor-indicator${factor.key === 'base' ? ' factor-base' : ''}`} />
                <div><b>{factor.label}</b><small>{factor.detail}</small></div>
                <strong>+{factor.points}</strong>
              </div>
            ))}
          </div>
          {factors.length === 1 && <p className="factor-footnote"><CheckCircle2 size={15} />최근 60초에 급가속·급제동 이벤트가 없습니다.</p>}
          <div className="coach-rule-note"><Info size={15} />점수 임계값과 가중치는 검증되지 않은 시연용 가정입니다.</div>
        </section>

        <section className="panel recommendation-panel">
          <div className="section-heading"><div><span className="panel-label">NEXT SAFE ACTION</span><h2>안전 행동 제안</h2></div></div>
          <div className="recommendation-list">
            <article className={`recommendation-item${hasBrake ? ' recommendation-active recommendation-red' : ''}`}>
              <span className="recommendation-icon"><ArrowDownRight size={18} aria-hidden="true" /></span>
              <div><b>급제동 기록</b><p>{hasBrake ? '앞차와 안전거리를 넉넉히 확보하고 속도를 부드럽게 조절하세요.' : '이벤트 발생 시 안전거리 확보를 권고합니다.'}</p></div>
              {hasBrake && <span className="recommendation-now">현재 원인</span>}
            </article>
            <article className={`recommendation-item${hasAcceleration ? ' recommendation-active recommendation-amber' : ''}`}>
              <span className="recommendation-icon"><ArrowUpRight size={18} aria-hidden="true" /></span>
              <div><b>급가속 기록</b><p>{hasAcceleration ? '가속 페달을 부드럽게 밟아 승차감과 안전거리를 확보하세요.' : '급가속 이벤트를 줄이고 점진적으로 가속하세요.'}</p></div>
              {hasAcceleration && <span className="recommendation-now">현재 원인</span>}
            </article>
            <article className={`recommendation-item${hasLongDrive ? ' recommendation-active recommendation-blue' : ''}`}>
              <span className="recommendation-icon"><Clock3 size={18} aria-hidden="true" /></span>
              <div><b>연속 운전 시간</b><p>{hasLongDrive ? '안전한 장소에 정차한 뒤 충분히 휴식하세요.' : '장시간 운전 시 안전한 장소에서 휴식을 계획하세요.'}</p></div>
              {hasLongDrive && <span className="recommendation-now">현재 원인</span>}
            </article>
          </div>
        </section>
      </div>

      <section className="panel voice-coach-panel">
        <div className="voice-coach-icon" aria-hidden="true">{voiceEnabled ? <Volume2 size={21} /> : <Headphones size={21} />}</div>
        <div className="voice-coach-copy"><span className="panel-label">VOICE GUIDANCE · KOREAN</span><h2>{voiceEnabled ? '한국어 음성 안내가 켜져 있습니다' : '운행 전 음성 안내를 설정하세요'}</h2><p>{speechSupported ? '위험 상태로 전환될 때만 한 번 안내합니다. 음소거는 언제든 변경할 수 있습니다.' : '현재 브라우저에서 음성 합성을 지원하지 않아 화면 안내만 제공합니다.'}</p></div>
        <button className={`button ${voiceEnabled ? 'button-muted' : 'button-primary'}`} type="button" onClick={onToggleVoice} disabled={!speechSupported}>
          {voiceEnabled ? <><VolumeX size={17} aria-hidden="true" /> 음성 음소거</> : <><Volume2 size={17} aria-hidden="true" /> 음성 켜기</>}
        </button>
      </section>
    </div>
  );
}
