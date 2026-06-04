export interface TaskConfig {
  taskId: number;
  enabled: boolean;
}

export interface ExampleResult {
  a: number;
  op: string;
  b: number;
  correctAnswer: number;
  childAnswer: number;
  isCorrect: boolean;
  timeMs: number;
}

export interface TestSession {
  id: string;
  taskId: number;
  taskName: string;
  date: string;
  examples: ExampleResult[];
  correctCount: number;
  totalCount: number;
  totalTimeMs: number;
}

export interface DailyStat {
  date: string;
  sessionCount: number;
  correctCount: number;
  wrongCount: number;
  totalCount: number;
}

const KEYS = {
  PIN: 'matemagic_pin',
  TASK_CONFIGS: 'matemagic_task_configs',
  SESSIONS: 'matemagic_sessions',
  EXAMPLES_COUNT: 'matemagic_examples_count',
  SOUND_ENABLED: 'matemagic_sound_enabled',
};

function getItem(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

function setItem(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch {}
}

function removeItem(key: string): void {
  try { localStorage.removeItem(key); } catch {}
}

export function getPin(): string | null {
  return getItem(KEYS.PIN);
}

export function setPin(pin: string): void {
  setItem(KEYS.PIN, pin);
}

export function hasPin(): boolean {
  return getPin() !== null;
}

export function getExamplesCount(): number {
  const raw = getItem(KEYS.EXAMPLES_COUNT);
  if (!raw) return 10;
  const n = parseInt(raw, 10);
  return isNaN(n) ? 10 : Math.max(5, Math.min(100, n));
}

export function getSoundEnabled(): boolean {
  const raw = getItem(KEYS.SOUND_ENABLED);
  return raw === null ? true : raw === '1';
}

export function setSoundEnabled(enabled: boolean): void {
  setItem(KEYS.SOUND_ENABLED, enabled ? '1' : '0');
}

export function setExamplesCount(count: number): void {
  setItem(KEYS.EXAMPLES_COUNT, String(count));
}

export function getTaskConfigs(): TaskConfig[] {
  const raw = getItem(KEYS.TASK_CONFIGS);
  if (!raw) {
    const defaults: TaskConfig[] = [];
    for (let i = 1; i <= 55; i++) {
      defaults.push({ taskId: i, enabled: [1, 5, 9, 15, 19, 27, 38].includes(i) });
    }
    saveTaskConfigs(defaults);
    return defaults;
  }
  const configs: TaskConfig[] = JSON.parse(raw);
  const existingIds = new Set(configs.map(c => c.taskId));
  for (let i = 1; i <= 55; i++) {
    if (!existingIds.has(i)) {
      configs.push({ taskId: i, enabled: [1, 5, 9, 15, 19, 27, 38].includes(i) });
    }
  }
  if (configs.length > existingIds.size) {
    saveTaskConfigs(configs);
  }
  return configs;
}

export function saveTaskConfigs(configs: TaskConfig[]): void {
  setItem(KEYS.TASK_CONFIGS, JSON.stringify(configs));
}

export function getTaskConfig(taskId: number): TaskConfig {
  const configs = getTaskConfigs();
  return configs.find(c => c.taskId === taskId) || { taskId, enabled: false };
}

export function updateTaskConfig(taskId: number, updates: Partial<TaskConfig>): void {
  const configs = getTaskConfigs();
  const idx = configs.findIndex(c => c.taskId === taskId);
  if (idx >= 0) {
    configs[idx] = { ...configs[idx], ...updates };
  } else {
    configs.push({ taskId, enabled: false, ...updates });
  }
  saveTaskConfigs(configs);
}

export function getSessions(): TestSession[] {
  const raw = getItem(KEYS.SESSIONS);
  if (!raw) return [];
  return JSON.parse(raw);
}

export function saveSession(session: TestSession): void {
  const sessions = getSessions();
  sessions.unshift(session);
  setItem(KEYS.SESSIONS, JSON.stringify(sessions));
}

export function getSessionById(id: string): TestSession | null {
  const sessions = getSessions();
  return sessions.find(s => s.id === id) || null;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function getBestResult(taskId: number): { percent: number; time: number } | null {
  const sessions = getSessions().filter(s => s.taskId === taskId);
  if (sessions.length === 0) return null;
  let best: TestSession | null = null;
  let bestPercent = -1;
  for (const s of sessions) {
    const pct = s.totalCount > 0 ? (s.correctCount / s.totalCount) * 100 : 0;
    if (pct > bestPercent || (pct === bestPercent && best && s.totalTimeMs < best.totalTimeMs)) {
      best = s;
      bestPercent = pct;
    }
  }
  if (!best) return null;
  return { percent: bestPercent, time: best.totalTimeMs };
}

export function clearSessions(): void {
  removeItem(KEYS.SESSIONS);
}

export function getDailyStats(): DailyStat[] {
  const sessions = getSessions();
  const map = new Map<string, DailyStat>();
  for (const s of sessions) {
    const d = new Date(s.date);
    const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const stat = map.get(day) || { date: day, sessionCount: 0, correctCount: 0, wrongCount: 0, totalCount: 0 };
    stat.sessionCount += 1;
    stat.correctCount += s.correctCount;
    stat.wrongCount += s.totalCount - s.correctCount;
    stat.totalCount += s.totalCount;
    map.set(day, stat);
  }
  return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
}
