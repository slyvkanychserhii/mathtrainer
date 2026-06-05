import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSessionById, type TestSession } from '../data/store';
import { useLocale } from '../i18n/LocaleContext';

export default function TestResultScreen() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<TestSession | null>(null);
  const { t } = useLocale();

  useEffect(() => {
    if (sessionId) setSession(getSessionById(sessionId));
  }, [sessionId]);

  if (!session) {
    return (
      <div className="app-container">
        <div className="loading"><div className="spinner" /></div>
      </div>
    );
  }

  const pct = session.totalCount > 0
    ? Math.round((session.correctCount / session.totalCount) * 100)
    : 0;

  let statusEmoji: string;
  let statusText: string;
  let statusGradient: string;

  if (pct >= 80) {
    statusEmoji = '🎉';
    statusText = t('result.excellent');
    statusGradient = '#22c55e';
  } else if (pct >= 50) {
    statusEmoji = '👍';
    statusText = t('result.good');
    statusGradient = '#f59e0b';
  } else {
    statusEmoji = '💪';
    statusText = t('result.practice');
    statusGradient = '#ef4444';
  }

  const totalSec = Math.round(session.totalTimeMs / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  const timeStr = totalSec >= 60
    ? t('time.format', { m: minutes, s: seconds })
    : t('time.seconds', { s: seconds });

  const errorCount = session.totalCount - session.correctCount;

  return (
    <div className="app-container">
      <div className="result-header" style={{ background: statusGradient }}>
        <div className="result-emoji">{statusEmoji}</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>{statusText}</div>
      </div>

      <div style={{ flex: 1, padding: 20 }}>
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{session.correctCount}/{session.totalCount}</div>
            <div className="stat-label">{t('result.label')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{pct}%</div>
            <div className="stat-label">{t('percent.label')}</div>
          </div>
        </div>

        <div className="time-card">
          <span className="time-icon">⏱</span>
          <span className="time-value">{timeStr}</span>
        </div>

        <div className="bar-container">
          {session.correctCount > 0 && (
            <div className="bar-segment bar-correct" style={{ flex: session.correctCount }} />
          )}
          {errorCount > 0 && (
            <div className="bar-segment bar-error" style={{ flex: errorCount }} />
          )}
        </div>

        <div className="actions">
          <button className="btn-primary" onClick={() => navigate(`/test/${session.taskId}`, { replace: true })}>
            {t('button.tryAgain')}
          </button>
          <button className="btn-primary btn-outline" onClick={() => navigate(`/stats/${session.id}`)}>
            {t('button.stats')}
          </button>
          <button className="btn-primary btn-outline" onClick={() => navigate('/', { replace: true })}>
            {t('button.home')}
          </button>
        </div>
      </div>
    </div>
  );
}
