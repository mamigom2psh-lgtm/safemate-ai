import { Activity, AudioLines, BellOff, ChartNoAxesCombined, Gauge, LayoutDashboard, ShieldCheck, Volume2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AppPage } from '../types';

const navigation: { id: AppPage; label: string; icon: LucideIcon }[] = [
  { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
  { id: 'simulator', label: '시뮬레이터', icon: Gauge },
  { id: 'coach', label: '안전 코치', icon: ShieldCheck },
  { id: 'reports', label: '주행 리포트', icon: ChartNoAxesCombined },
];

interface TopBarProps {
  page: AppPage;
  onNavigate: (page: AppPage) => void;
  isDriving: boolean;
  speechSupported: boolean;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
}

export function TopBar({ page, onNavigate, isDriving, speechSupported, voiceEnabled, onToggleVoice }: TopBarProps) {
  return (
    <header className="topbar">
      <button className="brand-lockup" type="button" onClick={() => onNavigate('dashboard')} aria-label="SafeMate AI 대시보드로 이동">
        <span className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 42 42" fill="none">
            <path d="M21 3.5 35.5 9v10.2c0 9.4-6.1 15.6-14.5 19.3C12.6 34.8 6.5 28.6 6.5 19.2V9L21 3.5Z" stroke="currentColor" strokeWidth="2.1" />
            <path d="M21 10v5.5m0 5v3.5m0 3.5v4.4M14 16.8l-3 .9m17-0.9 3 .9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        <span className="brand-name">SafeMate <b>AI</b><small>안심동행 · SAFETY COMPANION</small></span>
      </button>

      <nav className="main-nav" aria-label="주요 메뉴">
        {navigation.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`nav-button${page === id ? ' nav-active' : ''}`}
            onClick={() => onNavigate(id)}
            aria-current={page === id ? 'page' : undefined}
          >
            <Icon size={17} strokeWidth={2.1} aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="topbar-actions">
        <div className="simulation-pill"><span className="simulation-dot" /><Activity size={14} aria-hidden="true" /> 시뮬레이션</div>
        <span className={`drive-indicator${isDriving ? ' drive-indicator-on' : ''}`} aria-live="polite"><span />{isDriving ? '주행 중' : '대기 중'}</span>
        <button
          className={`voice-button${voiceEnabled ? ' voice-on' : ''}`}
          type="button"
          onClick={onToggleVoice}
          disabled={!speechSupported}
          aria-label={!speechSupported ? '이 브라우저는 음성 합성을 지원하지 않습니다' : voiceEnabled ? '음성 안내 음소거' : '음성 안내 시작'}
          title={!speechSupported ? '브라우저 음성 합성을 사용할 수 없습니다' : voiceEnabled ? '음성 안내 음소거' : '버튼을 눌러 음성 안내 시작'}
        >
          {!speechSupported ? <BellOff size={18} aria-hidden="true" /> : voiceEnabled ? <Volume2 size={18} aria-hidden="true" /> : <AudioLines size={18} aria-hidden="true" />}
          <span>{!speechSupported ? '음성 미지원' : voiceEnabled ? '음성 켜짐' : '음성 안내'}</span>
        </button>
      </div>
    </header>
  );
}
