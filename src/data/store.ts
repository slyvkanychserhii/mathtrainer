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

function hashPin(pin: string): string {
  let h = 0;
  for (let i = 0; i < pin.length; i++) {
    h = ((h << 5) - h) + pin.charCodeAt(i);
    h = h & h;
  }
  return 'h' + Math.abs(h).toString(36);
}

const KEYS = {
  PIN: 'mathtrainer_pin',
  TASK_CONFIGS: 'mathtrainer_task_configs',
  SESSIONS: 'mathtrainer_sessions',
  EXAMPLES_COUNT: 'mathtrainer_examples_count',
  SOUND_ENABLED: 'mathtrainer_sound_enabled',
  MEMORY_MODE: 'mathtrainer_memory_mode',
  MEMORY_SECONDS: 'mathtrainer_memory_seconds',
  TRANSITION_PAUSE: 'mathtrainer_transition_pause',
  WRONG_EXAMPLES: 'mathtrainer_wrong_examples',
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
  setItem(KEYS.PIN, hashPin(pin));
}

export function hasPin(): boolean {
  return getPin() !== null;
}

export function checkPin(pin: string): boolean {
  return getPin() === hashPin(pin);
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

export function getMemoryMode(): boolean {
  const raw = getItem(KEYS.MEMORY_MODE);
  return raw === null ? false : raw === '1';
}

export function setMemoryMode(mode: boolean): void {
  setItem(KEYS.MEMORY_MODE, mode ? '1' : '0');
}

export function getMemorySeconds(): number {
  const raw = getItem(KEYS.MEMORY_SECONDS);
  if (!raw) return 1;
  const n = parseFloat(raw);
  return isNaN(n) ? 1 : Math.max(0.5, Math.min(10, n));
}

export function setMemorySeconds(seconds: number): void {
  setItem(KEYS.MEMORY_SECONDS, String(seconds));
}

export function getTransitionPause(): number {
  const raw = getItem(KEYS.TRANSITION_PAUSE);
  if (!raw) return 1;
  const n = parseFloat(raw);
  return isNaN(n) ? 1 : Math.max(0.5, Math.min(5, n));
}

export function setTransitionPause(seconds: number): void {
  setItem(KEYS.TRANSITION_PAUSE, String(seconds));
}

function ensureConfigs(): void {
  const raw = getItem(KEYS.TASK_CONFIGS);
  if (!raw) {
    const defaults: TaskConfig[] = [];
    for (let i = 1; i <= 56; i++) {
      defaults.push({ taskId: i, enabled: true });
    }
    setItem(KEYS.TASK_CONFIGS, JSON.stringify(defaults));
    return;
  }
  let configs: TaskConfig[];
  try { configs = JSON.parse(raw); } catch { configs = []; }
  const existingIds = new Set(configs.map(c => c.taskId));
  let changed = false;
  for (let i = 1; i <= 56; i++) {
    if (!existingIds.has(i)) {
      configs.push({ taskId: i, enabled: true });
      changed = true;
    }
  }
  if (changed) {
    setItem(KEYS.TASK_CONFIGS, JSON.stringify(configs));
  }
}

export function getTaskConfigs(): TaskConfig[] {
  const raw = getItem(KEYS.TASK_CONFIGS);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export function initTaskConfigs(): void {
  ensureConfigs();
}

function saveTaskConfigs(configs: TaskConfig[]): void {
  setItem(KEYS.TASK_CONFIGS, JSON.stringify(configs));
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
  try { return JSON.parse(raw); } catch { return []; }
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

export function getWrongExamples(): ExampleResult[] {
  const raw = getItem(KEYS.WRONG_EXAMPLES);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export function addWrongExample(example: ExampleResult): void {
  const examples = getWrongExamples();
  const key = `${example.a}|${example.op}|${example.b}`;
  const idx = examples.findIndex(e => `${e.a}|${e.op}|${e.b}` === key);
  if (idx >= 0) {
    const existing = examples.splice(idx, 1)[0];
    examples.unshift(existing);
  } else {
    examples.unshift(example);
    if (examples.length > 500) examples.length = 500;
  }
  setItem(KEYS.WRONG_EXAMPLES, JSON.stringify(examples));
}

export function removeWrongExample(example: { a: number; op: string; b: number }): void {
  const examples = getWrongExamples();
  const key = `${example.a}|${example.op}|${example.b}`;
  const idx = examples.findIndex(e => `${e.a}|${e.op}|${e.b}` === key);
  if (idx >= 0) {
    examples.splice(idx, 1);
    setItem(KEYS.WRONG_EXAMPLES, JSON.stringify(examples));
  }
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
