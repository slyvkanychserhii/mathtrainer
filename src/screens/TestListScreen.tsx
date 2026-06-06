import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TASK_GROUPS, TASKS } from '../data/tasks';
import { useLocale } from '../i18n/LocaleContext';
import { getTaskConfigs, getDailyStats, getWrongExamples, getSessions, type TaskConfig, type DailyStat } from '../data/store';

const COL_W = 12;

export default function TestListScreen() {
  const navigate = useNavigate();
  const { t } = useLocale();
  const [configs, setConfigs] = useState<TaskConfig[] | null>(null);
  const [bestResults, setBestResults] = useState<Record<number, { percent: number; time: number } | null>>({});
  const [lastResults, setLastResults] = useState<Record<number, { percent: number; time: number } | null>>({});
  const [lastDates, setLastDates] = useState<Record<number, string | null>>({});
  const [wrongCount, setWrongCount] = useState(0);
  const [dailyStats, setDailyStats] = useState<DailyStat[] | null>(null);
  const [containerW, setContainerW] = useState(Math.min(window.innerWidth, 500));

  const load = useCallback(() => {
    const cfg = getTaskConfigs();
    const ds = getDailyStats();
    setConfigs(cfg);
    setDailyStats(ds);
    const best: Record<number, { percent: number; time: number } | null> = {};
    const lastR: Record<number, { percent: number; time: number } | null> = {};
    const lastD: Record<number, string | null> = {};
    const allSessions = getSessions();
    for (const task of TASKS) {
      const taskSessions = allSessions.filter(s => s.taskId === task.id);
      if (taskSessions.length > 0) {
        let bestSession: (typeof taskSessions)[0] | null = null;
        let bestPercent = -1;
        for (const s of taskSessions) {
          const pct = s.totalCount > 0 ? (s.correctCount / s.totalCount) * 100 : 0;
          if (pct > bestPercent || (pct === bestPercent && bestSession && s.totalTimeMs < bestSession.totalTimeMs)) {
            bestSession = s;
            bestPercent = pct;
          }
        }
        if (bestSession) {
          best[task.id] = { percent: bestPercent, time: bestSession.totalTimeMs };
        }
        const s = taskSessions[0];
        const pct = s.totalCount > 0 ? (s.correctCount / s.totalCount) * 100 : 0;
        lastR[task.id] = { percent: pct, time: s.totalTimeMs };
        lastD[task.id] = s.date.slice(0, 10);
      }
    }
    setBestResults(best);
    setLastResults(lastR);
    setLastDates(lastD);
    setWrongCount(getWrongExamples().length);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const handler = () => setContainerW(Math.min(window.innerWidth, 500));
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  const yesterdayStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  const getPlayColor = (lastDate: string | null): string => {
    if (!lastDate) return '#6366f1';
    if (lastDate === todayStr) return '#22c55e';
    if (lastDate === yesterdayStr) return '#f59e0b';
    return '#ef4444';
  };
  const getRecencyLabel = (dateStr: string | null): string => {
    if (!dateStr) return '';
    if (dateStr === todayStr) return t('date.today');
    if (dateStr === yesterdayStr) return t('date.yesterday');
    const d = new Date(dateStr + 'T00:00:00');
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  };

  const weeks: { date: string; level: number; empty: boolean }[][] = [];
  if (dailyStats) {
    const statsMap = new Map(dailyStats.map(s => [s.date, s]));
    const now = new Date();
    const end = new Date(now);
    const maxCols = Math.max(1, Math.floor((containerW - 48) / COL_W));

    const start = new Date(now);
    start.setDate(start.getDate() - maxCols * 7);
    start.setDate(1);
    while (true) {
      const gs = new Date(start);
      gs.setDate(gs.getDate() - ((gs.getDay() + 6) % 7));
      const actualCols = Math.ceil((end.getTime() - gs.getTime()) / (7 * 86400000)) + 1;
      if (actualCols <= maxCols) break;
      start.setMonth(start.getMonth() + 1);
      start.setDate(1);
    }
    start.setMonth(start.getMonth() + 1);
    if (start > now) start.setMonth(start.getMonth() - 1);
    const gridStart = new Date(start);
    gridStart.setDate(gridStart.getDate() - ((gridStart.getDay() + 6) % 7));

    const activeCounts = dailyStats.filter(s => s.totalCount > 0).map(s => s.totalCount).sort((a, b) => a - b);
    const len = activeCounts.length;
    const q1 = len > 0 ? activeCounts[Math.floor(len * 0.25)] : 1;
    const q2 = len > 0 ? activeCounts[Math.floor(len * 0.5)] : 3;
    const q3 = len > 0 ? activeCounts[Math.floor(len * 0.75)] : 8;

    const cur = new Date(gridStart);
    while (true) {
      const week: { date: string; level: number; empty: boolean }[] = [];
      for (let i = 0; i < 7; i++) {
        const ds = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
        const empty = cur < start || cur > end;
        const stat = statsMap.get(ds);
        let level = 0;
        if (stat && !empty) {
          const n = stat.totalCount;
          if (n > 0) level = 1;
          if (n >= q1) level = 2;
          if (n >= q2) level = 3;
          if (n >= q3) level = 4;
        }
        week.push({ date: ds, level, empty });
        cur.setDate(cur.getDate() + 1);
      }
      weeks.push(week);
      const afterMidnight = new Date(cur);
      afterMidnight.setHours(0, 0, 0, 0);
      if (afterMidnight > end) break;
    }
  }

  if (!configs) {
    return (
      <div className="app-container">
        <div className="loading"><div className="spinner" /></div>
      </div>
    );
  }


  const enabledTasks = TASKS.filter(t => {
    const cfg = configs.find(c => c.taskId === t.id);
    return cfg?.enabled;
  });

  return (
    <div className="app-container">
      <div className="header">
        <span className="header-title">{t('app.title')}</span>
        <div className="header-buttons">
          <button className="header-btn" onClick={() => navigate('/stats')}>📊 {t('header.stats')}</button>
          <button className="header-btn" onClick={() => navigate('/pin')}>⚙️ {t('header.settings')}</button>
        </div>
      </div>

      <div className="scroll">
        <div className="scroll-content">
          {dailyStats && (
            <div className="graph-card">
              <div className="graph-row">
                <div className="graph-labels" />
                <div className="graph-months" style={{ position: 'relative' }}>
                  {(() => {
                    const monthNames = Array.from({ length: 12 }, (_, i) => t(`month.short.${i}`));
                    const labels: { name: string; left: number; key: string }[] = [];
                    let prevM = -1;
                    for (let wi = 0; wi < weeks.length; wi++) {
                      for (const day of weeks[wi]) {
                        if (day.empty) continue;
                        const d = new Date(day.date + 'T00:00:00');
                        if (d.getDate() === 1) {
                          const m = d.getMonth();
                          if (m !== prevM) {
                            labels.push({ name: monthNames[m], left: wi * 12, key: `${d.getFullYear()}-${m}` });
                            prevM = m;
                          }
                          break;
                        }
                      }
                    }
                    return labels.map(l => (
                      <span key={l.key} className="graph-month-label" style={{ left: l.left }}>{l.name}</span>
                    ));
                  })()}
                  {weeks.map((week, wi) => (
                    <div key={wi} style={{ width: 12 }} />
                  ))}
                </div>
              </div>
              <div className="graph-row">
                <div className="graph-labels">
                  {[1, 2, 3, 4, 5, 6, 7].map(i => (
                    <span key={i} className="graph-label">{t(`weekday.short.${i}`)}</span>
                  ))}
                </div>
                <div className="graph-grid">
                  {weeks.map((week, wi) => (
                    <div key={wi} className="graph-week">
                      {week.map(day => (
                        <div
                          key={day.date}
                          className={`graph-cell ${!day.empty ? `graphColors-${day.level}` : ''} ${day.date === todayStr ? 'graph-cell-today' : ''}`}
                          style={{ backgroundColor: day.empty ? 'transparent' : undefined }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              {(() => {
                const activeDates = new Set(
                  dailyStats.filter(s => s.totalCount > 0).map(s => s.date)
                );
                let streak = 0;
                const d = new Date();
                while (true) {
                  const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                  if (activeDates.has(ds)) {
                    streak++;
                    d.setDate(d.getDate() - 1);
                  } else break;
                }
                const streakDaysKey = streak === 1 ? 'streak.day' : (streak >= 2 && streak <= 4 ? 'streak.days2' : 'streak.days');
                return <div className="streak-text">{t('streak.label', { count: streak, days: t(streakDaysKey) })}</div>;
              })()}
            </div>
          )}

          {enabledTasks.length > 0 && (
            <div className="hint-card">
              <span className="hint-text">{t('home.howToChangeTasks')}</span>
            </div>
          )}

          {enabledTasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-text">{t('empty.noActiveTests')}</div>
              <div className="empty-subtext">{t('empty.askParent')}</div>
            </div>
          ) : (
            TASK_GROUPS.map(group => {
              const groupTasks = enabledTasks.filter(t => t.group === group.id);
              if (groupTasks.length === 0) return null;
              return (
                <div key={group.id} className="group-section">
                  <div className="group-title">{t(`group.${group.id}`)}</div>
                  {groupTasks.map(task => {
                    const best = bestResults[task.id];
                    const last = lastResults[task.id];
                    const lastDate = lastDates[task.id];
                    return (
                      <button
                        key={task.id}
                        className="task-card"
                        onClick={() => navigate(`/test/${task.id}`)}
                      >
                        <div className="task-left">
                          <div className="task-info">
                            <div className="task-name">{t(`task.${task.id}`)}</div>
                            <div className="task-example">{task.example}</div>
                          </div>
                          {task.id === 56 ? (
                            <div className="task-stats">
                              <span className="task-best">❌ {wrongCount}</span>
                            </div>
                          ) : best ? (
                            <div className="task-stats">
                              <span className="task-best">🏆 {Math.round(best.percent)}%{' '}
                                {best.time < 60000
                                  ? `${Math.round(best.time / 1000)}с`
                                  : `${Math.floor(best.time / 60000)}м ${Math.round((best.time % 60000) / 1000)}с`}
                              </span>
                              {last && (
                                <span className="task-last" style={{ color: getPlayColor(lastDates[task.id] ?? null) }}>🎖️ {Math.round(last.percent)}%{' '}
                                  {last.time < 60000
                                    ? `${Math.round(last.time / 1000)}с`
                                    : `${Math.floor(last.time / 60000)}м ${Math.round((last.time % 60000) / 1000)}с`}
                                  {lastDate && <> ({getRecencyLabel(lastDate)})</>}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="task-stats">
                              <span className="task-new">{t('task.new')}</span>
                            </div>
                          )}
                        </div>
                        <div className="play-btn" onClick={(e) => { e.stopPropagation(); navigate(`/test/${task.id}`); }} style={{ backgroundColor: getPlayColor(lastDates[task.id] ?? null) }}>▶</div>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
