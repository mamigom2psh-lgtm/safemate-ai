import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import type { AppPage, DrivingEvent } from './types';
import { getCoachMessage, getRiskFactors, getRiskLevel, getRiskScore } from './lib/risk';
import { useDrivingSession } from './hooks/useDrivingSession';
import { useSpeechCoach } from './hooks/useSpeechCoach';
import { TopBar } from './components/TopBar';
import { Dashboard } from './components/Dashboard';
import { Simulator } from './components/Simulator';
import { Coach } from './components/Coach';

const Reports = lazy(() => import('./components/Reports').then((module) => ({ default: module.Reports })));
const EMPTY_EVENTS: DrivingEvent[] = [];

export default function App() {
  const [page, setPage] = useState<AppPage>('dashboard');
  const driving = useDrivingSession();
  const speech = useSpeechCoach();
  const riskScore = getRiskScore(driving.session);
  const riskLevel = getRiskLevel(riskScore);
  const coachMessage = getCoachMessage(driving.session);
  const riskFactors = getRiskFactors(driving.session);
  const previousLevel = useRef(riskLevel);
  const allEvents = driving.session?.events ?? EMPTY_EVENTS;

  useEffect(() => {
    if (riskLevel === 'danger' && previousLevel.current !== 'danger') {
      const detail = getCoachMessage(driving.session);
      speech.speak(`위험 상태입니다. ${detail}`);
    }
    previousLevel.current = riskLevel;
  }, [riskLevel, driving.session, speech.speak]);

  const onToggleVoice = useCallback(() => {
    const message = riskLevel === 'danger'
      ? `현재 위험 상태입니다. ${coachMessage}`
      : 'SafeMate AI 음성 안내를 시작합니다. 위험 상태로 바뀔 때 안전 행동을 안내합니다.';
    speech.toggle(message);
  }, [riskLevel, coachMessage, speech.toggle]);

  let pageContent;
  if (page === 'simulator') {
    pageContent = <Simulator
      session={driving.session}
      telemetry={driving.telemetry}
      scenario={driving.scenario}
      riskScore={riskScore}
      riskLevel={riskLevel}
      events={allEvents}
      isDriving={driving.isDriving}
      onStart={driving.startSession}
      onStop={driving.stopSession}
      onSelectScenario={driving.selectScenario}
    />;
  } else if (page === 'coach') {
    pageContent = <Coach
      session={driving.session}
      events={allEvents}
      riskScore={riskScore}
      riskLevel={riskLevel}
      factors={riskFactors}
      voiceEnabled={speech.enabled}
      speechSupported={speech.supported}
      onToggleVoice={onToggleVoice}
    />;
  } else if (page === 'reports') {
    pageContent = <Reports
      activeSession={driving.session}
      savedSessions={driving.savedSessions}
      storageError={driving.storageError}
      onClearHistory={driving.clearHistory}
    />;
  } else {
    pageContent = <Dashboard
      session={driving.session}
      isDriving={driving.isDriving}
      scenario={driving.scenario}
      telemetry={driving.telemetry}
      riskScore={riskScore}
      riskLevel={riskLevel}
      coachMessage={coachMessage}
      riskFactors={riskFactors}
      events={allEvents}
      onStart={driving.startSession}
      onStop={driving.stopSession}
      onNavigate={setPage}
    />;
  }

  return (
    <div className="app-shell min-h-screen">
      <TopBar
        page={page}
        onNavigate={setPage}
        isDriving={driving.isDriving}
        speechSupported={speech.supported}
        voiceEnabled={speech.enabled}
        onToggleVoice={onToggleVoice}
      />
      <main className="main-content">
        <Suspense fallback={<div className="report-empty panel" role="status">주행 리포트를 불러오는 중입니다.</div>}>
          {pageContent}
        </Suspense>
      </main>
      <footer className="app-footer">
        <span>SafeMate AI · 안심동행</span>
        <span>시뮬레이션 데모 · 실제 차량 미연결 · 운전자 주의 의무를 대체하지 않습니다.</span>
      </footer>
      <div className="sr-only" aria-live="assertive" aria-atomic="true">{riskLevel === 'danger' ? `위험 점수 ${riskScore}점` : ''}</div>
    </div>
  );
}
