export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
export const signed = (n: number) => (n >= 0 ? `+${n}` : `${n}`);
export const deepClone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
export function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e9).toString(36)}`;
}
export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
export function capitalize(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }
