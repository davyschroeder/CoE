/** The English edition uses one language for menus, rules and authored story content. */
import { EN } from './en';

export function t(key: string, vars: Record<string, string | number> = {}): string {
  const str = EN[key] ?? key;
  return str.replace(/\{(\w+)\}/g, (_m, k) => String(vars[k] ?? `{${k}}`));
}
