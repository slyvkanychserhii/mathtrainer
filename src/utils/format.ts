export function formatDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
}

export function formatTime(ms: number, t: (key: string, params?: Record<string, string | number>) => string): string {
  const sec = Math.round(ms / 1000);
  if (sec >= 60) return t('time.format', { m: Math.floor(sec / 60), s: sec % 60 });
  return t('time.seconds', { s: sec });
}
