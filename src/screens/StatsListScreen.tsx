import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSessions, type TestSession } from '../data/store';
import { useLocale } from '../i18n/LocaleContext';
import { formatDate, formatTime } from '../utils/format';

export default function StatsListScreen() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<TestSession[] | null>(null);
  const { t } = useLocale();

  useEffect(() => {
    setSessions(getSessions());
  }, []);

  if (!sessions) {
    return (
      <div className="app-container">
        <div className="loading"><div className="spinner" /></div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>{t('back')}</button>
        <span className="page-header-title">{t('header.stats')}</span>
      </div>

      <div className="scroll">
        <div className="scroll-content">
          {sessions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-emoji">📈</div>
              <div className="empty-text">{t('stats.empty.title')}</div>
              <div className="empty-subtext">{t('stats.empty.subtitle')}</div>
            </div>
          ) : (
            (() => {
              function getLocalDate(iso: string): string {
                const d = new Date(iso);
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${y}-${m}-${day}`;
              }
              const groups: { date: string; sessions: TestSession[] }[] = [];
              for (const s of sessions) {
                const day = getLocalDate(s.date);
                const last = groups[groups.length - 1];
                if (last && last.date === day) last.sessions.push(s);
                else groups.push({ date: day, sessions: [s] });
              }
              return groups.map(group => {
                const [y, m, d] = group.date.split('-').map(Number);
                const totalEx = group.sessions.reduce((s, x) => s + x.totalCount, 0);
                const correctEx = group.sessions.reduce((s, x) => s + x.correctCount, 0);
                const wrongEx = totalEx - correctEx;
                const hours = new Array(24).fill(0);
                for (const s of group.sessions) {
                  const h = new Date(s.date).getHours();
                  hours[h] += s.totalCount;
                }
                const maxVal = Math.max(...hours, 1);
                return (
                  <div key={group.date}>
                    <div className="day-card">
                      <div className="day-date">{String(d).padStart(2, '0')}.{String(m).padStart(2, '0')}.{y}</div>
                      <div className="day-bar-labels" style={{ margin: '0 auto' }}>
                        <span className="day-bar-label" style={{ color: '#22c55e' }}>{correctEx}</span>
                        <span className="day-bar-label" style={{ color: '#ef4444' }}>{wrongEx}</span>
                      </div>
                      <div className="day-bar-inner" style={{ margin: '4px auto 0' }}>
                        <div className="day-bar-seg" style={{ flex: correctEx, backgroundColor: '#22c55e' }} />
                        {wrongEx > 0 && <div className="day-bar-seg" style={{ flex: wrongEx, backgroundColor: '#ef4444' }} />}
                      </div>
                      <div className="day-total">{totalEx}</div>
                      <div className="hourly-bars">
                        {hours.map((val, h) => (
                          <div key={h} className="hourly-col">
                            <div className="hourly-bar-container">
                              <div className="hourly-bar" style={{ height: Math.max(2, (val / maxVal) * 36), backgroundColor: val > 0 ? '#6366f1' : 'transparent' }} />
                            </div>
                            <span className="hourly-value" style={{ opacity: val > 0 ? 1 : 0 }}>{val || 0}</span>
                            <span className="hourly-label">{h}</span>
                          </div>
                        ))}
                      </div>
                      <div className="hourly-title">{t('stats.activityByHour')}</div>
                    </div>
                    {group.sessions.map(session => {
                      const pct = session.totalCount > 0 ? Math.round((session.correctCount / session.totalCount) * 100) : 0;
                      const pctColor = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
                      return (
                        <button key={session.id} className="stats-card" onClick={() => navigate(`/stats/${session.id}`)}>
                          <div className="stats-card-top">
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span className="stats-card-title">{t(`task.${session.taskId}`)}</span>
                              <span className="task-toggle-example">
                                {session.examples[0] ? `${session.examples[0].a}${session.examples[0].op}${session.examples[0].b}` : ''}
                              </span>
                            </div>
                            <span className="stats-card-pct" style={{ color: pctColor }}>{pct}%</span>
                          </div>
                          <div className="stats-card-meta">
                            <span className="stats-card-date">{formatDate(session.date)}</span>
                            <div className="stats-card-stats">
                              <span className="stats-card-stat">{t('stats.correct', { correct: session.correctCount, total: session.totalCount })}</span>
                              <span className="stats-card-stat">{t('stats.time', { time: formatTime(session.totalTimeMs, t) })}</span>
                            </div>
                          </div>
                          <div className="mini-bar">
                            {session.correctCount > 0 && <div className="mini-bar-seg" style={{ flex: session.correctCount, backgroundColor: '#22c55e' }} />}
                            {session.totalCount - session.correctCount > 0 && <div className="mini-bar-seg" style={{ flex: session.totalCount - session.correctCount, backgroundColor: '#ef4444' }} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              });
            })()
          )}
        </div>
      </div>
    </div>
  );
}
