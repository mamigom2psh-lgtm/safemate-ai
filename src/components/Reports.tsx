import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDownRight, ArrowUpRight, CalendarClock, ChartNoAxesCombined, Clock3, ShieldCheck, Trash2 } from 'lucide-react';
import type { CompletedSession, DrivingEvent, DrivingSession, RiskSample } from '../types';
import { formatDateTime, formatDuration, formatTime } from '../lib/format';
import { summarizeSession } from '../lib/risk';

interface ReportsProps {
  activeSession: DrivingSession | null;
  savedSessions: CompletedSession[];
  storageError: string | null;
  onClearHistory: () => void;
}

function eventTitle(event: DrivingEvent): string {
  if (event.kind === 'hard_braking') return '급제동';
  if (event.kind === 'hard_acceleration') return '급가속';
  if (event.kind === 'long_drive') return '장시간 운전';
  return '정상 주행 전환';
}

function chartPoints(samples: RiskSample[]) {
  if (samples.length === 0) return [];
  const step = Math.max(1, Math.ceil(samples.length / 72));
  const filtered = samples.filter((_, index) => index % step === 0 || index === samples.length - 1);
  return filtered.map((sample) => ({
    time: sample.elapsedSeconds >= 3_600
      ? `${Math.floor(sample.elapsedSeconds / 3_600)}h ${String(Math.floor((sample.elapsedSeconds % 3_600) / 60)).padStart(2, '0')}m`
      : `${Math.floor(sample.elapsedSeconds / 60)}m ${String(sample.elapsedSeconds % 60).padStart(2, '0')}s`,
    risk: sample.score,
  }));
}

export function Reports({ activeSession, savedSessions, storageError, onClearHistory }: ReportsProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const activeAsRecord = activeSession ? { ...activeSession, endedAt: Date.now() } as CompletedSession : null;
  const records = useMemo(
    () => [...(activeAsRecord ? [activeAsRecord] : []), ...savedSessions.filter((item) => item.id !== activeAsRecord?.id)],
    [activeAsRecord, savedSessions],
  );
  const selected: CompletedSession | undefined = records.find((item) => item.id === selectedId) ?? records[0];
  const summary = selected ? summarizeSession(selected) : null;
  const chartData = selected ? chartPoints(selected.riskSamples) : [];
  const orderedEvents = selected ? [...selected.events].sort((a, b) => a.occurredAt - b.occurredAt) : [];

  const clearHistory = () => {
    if (savedSessions.length === 0) return;
    if (window.confirm('저장된 운행 기록을 모두 초기화할까요? 현재 진행 중인 운행은 삭제되지 않습니다.')) {
      onClearHistory();
      setSelectedId(null);
    }
  };

  return (
    <div className="page-stack reports-page">
      <div className="page-heading">
        <div><div className="eyebrow"><span className="eyebrow-line" /> DRIVE HISTORY</div><h1>주행 리포트</h1><p>종료된 시뮬레이션 기록은 이 브라우저에 저장됩니다.</p></div>
        <div className="heading-actions"><span className="sim-tag"><span className="simulation-dot" /> LOCAL STORAGE</span><button className="button button-muted" type="button" onClick={clearHistory} disabled={savedSessions.length === 0}><Trash2 size={16} aria-hidden="true" /> 기록 초기화</button></div>
      </div>

      {storageError && <div className="storage-warning" role="status"><CalendarClock size={17} aria-hidden="true" /><span>{storageError}</span></div>}

      {records.length === 0 ? (
        <section className="report-empty panel">
          <div className="report-empty-icon"><ChartNoAxesCombined size={27} aria-hidden="true" /></div>
          <h2>아직 저장된 주행 기록이 없습니다</h2>
          <p>시뮬레이션을 시작하고 종료하면 주행 요약과 위험도 차트가 이곳에 저장됩니다.</p>
        </section>
      ) : (
        <>
          {activeSession && <div className="active-report-note"><span className="live-pulse live-pulse-on" /> 현재 주행 중인 세션을 실시간으로 보고 있습니다. 종료하면 기록이 저장됩니다.</div>}
          <div className="report-layout">
            <section className="report-main-column">
              {summary && selected && (
                <div className="report-summary-grid">
                  <article className="report-stat"><span className="report-stat-icon blue"><Clock3 size={17} /></span><span>총 주행 시간</span><strong>{summary.durationMinutes}<small>분</small></strong></article>
                  <article className="report-stat"><span className="report-stat-icon amber"><ArrowUpRight size={17} /></span><span>급가속 횟수</span><strong>{summary.accelerationCount}<small>회</small></strong></article>
                  <article className="report-stat"><span className="report-stat-icon red"><ArrowDownRight size={17} /></span><span>급제동 횟수</span><strong>{summary.brakingCount}<small>회</small></strong></article>
                  <article className="report-stat"><span className="report-stat-icon mint"><ShieldCheck size={17} /></span><span>평균 / 최대 위험도</span><strong>{summary.averageRisk}<small> / {summary.maximumRisk}</small></strong></article>
                </div>
              )}

              <section className="panel chart-panel">
                <div className="section-heading"><div><span className="panel-label">RISK SCORE TREND</span><h2>위험도 변화</h2></div>{selected && <span className="chart-subtitle">선택 세션 · 최대 100</span>}</div>
                <div className="chart-area">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
                        <defs><linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#70e4c3" stopOpacity={0.25} /><stop offset="100%" stopColor="#70e4c3" stopOpacity={0.01} /></linearGradient></defs>
                        <CartesianGrid stroke="#243545" strokeDasharray="3 6" vertical={false} />
                        <XAxis dataKey="time" tick={{ fill: '#8494a4', fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
                        <YAxis domain={[0, 100]} ticks={[0, 40, 70, 100]} tick={{ fill: '#8494a4', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: '#14212e', border: '1px solid #2a3d4f', borderRadius: 12, color: '#f5f8fa' }} labelStyle={{ color: '#9db0bf' }} formatter={(value) => [`${value}점`, '위험도']} />
                        <Area type="monotone" dataKey="risk" stroke="#70e4c3" strokeWidth={2.5} fill="url(#riskFill)" isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : <div className="chart-empty">위험도 샘플이 모이면 그래프가 표시됩니다.</div>}
                </div>
                <div className="chart-legend"><span><i className="legend-safe" /> 안전 0–39</span><span><i className="legend-caution" /> 주의 40–69</span><span><i className="legend-danger" /> 위험 70–100</span><small>위험 점수 임계값은 시연용 가정</small></div>
              </section>

              <section className="panel report-events-panel">
                <div className="section-heading"><div><span className="panel-label">CHRONOLOGICAL LOG</span><h2>시간순 이벤트</h2></div><span className="event-count">{orderedEvents.length}건</span></div>
                {orderedEvents.length === 0 ? <div className="event-empty compact-empty"><p>이 세션에 기록된 시나리오 이벤트가 없습니다.</p></div> : (
                  <ol className="report-event-list">
                    {orderedEvents.map((event) => <li key={event.id}><time>{formatTime(event.occurredAt)}</time><span className={`event-dot event-${event.kind}`} /><div><b>{eventTitle(event)}</b><small>{event.message}</small></div></li>)}
                  </ol>
                )}
              </section>
            </section>

            <aside className="panel session-list-panel">
              <div className="section-heading"><div><span className="panel-label">LOCAL ARCHIVE</span><h2>운행 기록</h2></div><span className="event-count">{records.length}</span></div>
              <p className="session-list-note">이 기기의 브라우저에 저장된 시뮬레이션입니다.</p>
              <ul className="session-list">
                {records.map((record, index) => (
                  <li key={record.id}>
                    <button className={`session-select${selected?.id === record.id ? ' session-selected' : ''}`} type="button" onClick={() => setSelectedId(record.id)} aria-pressed={selected?.id === record.id}>
                      <span className="session-index">{activeSession?.id === record.id ? 'LIVE' : String(index + 1).padStart(2, '0')}</span>
                      <span className="session-copy"><b>{activeSession?.id === record.id ? '현재 주행 중' : `운행 ${formatDateTime(record.startedAt)}`}</b><small>{formatDuration(record.elapsedSeconds)} · {record.events.length}개 이벤트</small></span>
                      <span className="session-chevron">›</span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="session-retention"><CalendarClock size={15} aria-hidden="true" /> 최근 30건을 보관합니다.</div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
