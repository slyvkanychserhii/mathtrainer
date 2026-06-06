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
  let statusColor: string;

  if (pct === 0) {
    statusEmoji = '🤬';
    statusText = t('result.giveUp');
    statusColor = '#dc2626';
  } else if (pct < 25) {
    statusEmoji = '😰';
    statusText = t('result.repeat');
    statusColor = '#f97316';
  } else if (pct < 50) {
    statusEmoji = '😐';
    statusText = t('result.normal');
    statusColor = '#eab308';
  } else if (pct < 75) {
    statusEmoji = '🙂';
    statusText = t('result.good');
    statusColor = '#22c55e';
  } else if (pct < 100) {
    statusEmoji = '😊';
    statusText = t('result.excellent');
    statusColor = '#16a34a';
  } else {
    statusEmoji = '🥳';
    statusText = t('result.perfect');
    statusColor = '#6366f1';
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
      <div className="result-header">
        <div className="result-emoji">{statusEmoji}</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: statusColor }}>{statusText}</div>
      </div>

      <div style={{ flex: 1, padding: 20 }}>
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{session.correctCount}/{session.totalCount}</div>
            <div className="stat-label">{t('result.label')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: statusColor }}>{pct}%</div>
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
