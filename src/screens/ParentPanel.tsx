import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors } from '../types';
import { TASK_GROUPS, TASKS } from '../data/tasks';
import { getTaskConfigs, updateTaskConfig, getExamplesCount, setExamplesCount, getSoundEnabled, setSoundEnabled as storeSetSoundEnabled, clearSessions, type TaskConfig } from '../data/store';
import { useLocale } from '../i18n/LocaleContext';

export default function ParentPanel() {
  const navigate = useNavigate();
  const { t, locale, setLocale, supportedLocales } = useLocale();
  const [configs, setConfigs] = useState<TaskConfig[] | null>(null);
  const [count, setCount] = useState(10);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [langModalVisible, setLangModalVisible] = useState(false);

  useEffect(() => {
    const c = getTaskConfigs();
    const n = getExamplesCount();
    const s = getSoundEnabled();
    setConfigs(c);
    setCount(n);
    setSoundEnabled(s);
  }, []);

  const toggleTask = (taskId: number) => {
    const cfg = configs!.find(c => c.taskId === taskId)!;
    updateTaskConfig(taskId, { enabled: !cfg.enabled });
    setConfigs(getTaskConfigs());
  };

  const enableAll = () => {
    for (let i = 1; i <= 55; i++) updateTaskConfig(i, { enabled: true });
    setConfigs(getTaskConfigs());
  };

  const disableAll = () => {
    for (let i = 1; i <= 55; i++) updateTaskConfig(i, { enabled: false });
    setConfigs(getTaskConfigs());
  };

  const changeCount = (delta: number) => {
    const newCount = Math.min(100, Math.max(5, count + delta));
    setCount(newCount);
    setExamplesCount(newCount);
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    storeSetSoundEnabled(next);
  };

  const handleResetStats = () => {
    if (window.confirm('Все результаты будут удалены. Продолжить?')) {
      clearSessions();
    }
  };

  if (!configs) {
    return (
      <div className="app-container">
        <div className="loading"><div className="spinner" /></div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/', { replace: true })}>{t('back')}</button>
        <span className="page-header-title">{t('parent.title')}</span>
      </div>

      <div className="scroll">
        <div className="scroll-content">
          <button className="setting-card" onClick={() => setLangModalVisible(true)}>
            <span className="setting-label">{t('parent.language')}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 16, color: '#1f2937', fontWeight: 500 }}>
                {(() => {
                  const l = supportedLocales.find(l => l.code === locale);
                  return l ? `${l.flag} ${l.nativeLabel}` : '';
                })()}
              </span>
              <span style={{ fontSize: 22, color: '#9ca3af', fontWeight: 600 }}>›</span>
            </div>
          </button>

          <div className="setting-card" style={{ cursor: 'default' }}>
            <span className="setting-label">{t('parent.sound')}</span>
            <button className={`toggle ${soundEnabled ? 'toggle-on' : ''}`} onClick={toggleSound}>
              <div className="toggle-knob" />
            </button>
          </div>

          <div className="setting-card" style={{ cursor: 'default' }}>
            <span className="setting-label">{t('parent.examplesPerSession')}</span>
            <div className="stepper">
              <button className="stepper-btn" onClick={() => changeCount(-5)}>−</button>
              <span className="stepper-value">{count}</span>
              <button className="stepper-btn" onClick={() => changeCount(5)}>+</button>
            </div>
          </div>

          <div className="setting-card">
            <span className="setting-label">{t('parent.statistics')}</span>
            <button onClick={handleResetStats} style={{ fontSize: 15, color: '#ef4444', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
              {t('parent.resetStatistics')}
            </button>
          </div>

          <div className="section-title-wrapper">
            <div className="section-line" />
            <span className="section-title">{t('parent.taskTypes')}</span>
            <div className="section-line" />
          </div>

          <div className="bulk-actions">
            <button className="bulk-btn" onClick={enableAll}>{t('parent.enableAll')}</button>
            <button className="bulk-btn" onClick={disableAll}>{t('parent.disableAll')}</button>
          </div>

          {TASK_GROUPS.map(group => {
            const groupTasks = TASKS.filter(t => t.group === group.id);
            return (
              <div key={group.id} className="group-section">
                <div className="group-title">{t(`group.${group.id}`)}</div>
                {groupTasks.map(task => {
                  const cfg = configs.find(c => c.taskId === task.id)!;
                  return (
                    <div key={task.id} className={`task-toggle-card ${!cfg.enabled ? 'task-toggle-card-disabled' : ''}`}>
                      <div className="task-toggle-header">
                        <button className={`toggle ${cfg.enabled ? 'toggle-on' : ''}`} onClick={() => toggleTask(task.id)}>
                          <div className="toggle-knob" />
                        </button>
                        <div className="task-toggle-info">
                          <div className={`task-toggle-name ${!cfg.enabled ? 'task-toggle-name-disabled' : ''}`}>
                            #{task.id} {t(`task.${task.id}`)}
                          </div>
                          <div className={`task-toggle-example ${!cfg.enabled ? 'task-toggle-example-disabled' : ''}`}>
                            {task.example}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {langModalVisible && (
        <div className="modal-overlay" onClick={() => setLangModalVisible(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            {supportedLocales.map(item => (
              <button
                key={item.code}
                className={`modal-item ${locale === item.code ? 'modal-item-active' : ''}`}
                onClick={() => { setLocale(item.code); setLangModalVisible(false); }}
              >
                <span>{item.flag}  {item.nativeLabel}</span>
                {locale === item.code && <span className="modal-check">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
