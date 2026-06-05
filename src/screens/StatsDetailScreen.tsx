import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSessionById, type TestSession } from '../data/store';
import { useLocale } from '../i18n/LocaleContext';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
}

function formatTime(ms: number): string {
  const sec = Math.round(ms / 1000);
  if (sec >= 60) return `${Math.floor(sec / 60)}м ${sec % 60}с`;
  return `${sec}с`;
}

export default function StatsDetailScreen() {
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

  const avgTime = session.totalCount > 0
    ? Math.round(session.totalTimeMs / session.totalCount)
    : 0;

  const maxTime = Math.max(...session.examples.map(e => e.timeMs), 0);

  return (
    <div className="app-container">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>{t('back')}</button>
        <span className="page-header-title">{t('header.stats')}</span>
      </div>

      <div className="summary">
        <div className="summary-task-name">{t(`task.${session.taskId}`)}</div>
        <div className="summary-pct" style={{ color: pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444' }}>
          {pct}%
        </div>
        <div className="summary-date">{formatDate(session.date)}</div>
      </div>

      <div className="detail-stats-row">
        <div className="detail-stat-card">
          <div className="detail-stat-value">{session.correctCount}/{session.totalCount}</div>
          <div className="detail-stat-label">{t('result.label')}</div>
        </div>
        <div className="detail-stat-card">
          <div className="detail-stat-value">{formatTime(session.totalTimeMs)}</div>
          <div className="detail-stat-label">{t('stats.totalTime')}</div>
        </div>
        <div className="detail-stat-card">
          <div className="detail-stat-value">{formatTime(avgTime)}</div>
          <div className="detail-stat-label">{t('stats.averagePerExample')}</div>
        </div>
      </div>

      <div className="scroll">
        <div className="scroll-content">
          {session.examples.map((example, idx) => {
            const isSlowest = example.timeMs === maxTime && session.examples.length > 2;
            return (
              <div
                key={idx}
                className={`example-card ${example.isCorrect ? 'example-correct' : 'example-wrong'}`}
              >
                <div className="example-icon">{example.isCorrect ? '✅' : '❌'}</div>
                <div className="example-info">
                  <div className="example-expr">{example.a} {example.op} {example.b} = {example.correctAnswer}</div>
                  {!example.isCorrect && (
                    <div className="example-error">{t('stats.yourAnswer', { answer: example.childAnswer })}</div>
                  )}
                </div>
                <div className="example-time">
                  {isSlowest ? '🐌 ' : ''}{formatTime(example.timeMs)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
