/**
 * UI string localisation. Narrative content is authored in English in data files; a localisation
 * pass would add per-locale content packs keyed by the same stable ids (see GAME_DESIGN.md).
 */
import { EN } from './en';
import { NL } from './nl';
import { settings } from '../core/settings';

const TABLES: Record<string, Record<string, string>> = { en: EN, nl: NL };

export function t(key: string, vars: Record<string, string | number> = {}): string {
  const lang = settings().language;
  const str = TABLES[lang]?.[key] ?? EN[key] ?? key;
  return str.replace(/\{(\w+)\}/g, (_m, k) => String(vars[k] ?? `{${k}}`));
}
