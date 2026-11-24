import type { App, Screen } from '../app';
import { h, clear, toast } from '../dom';
import { ANCESTRIES, ANCESTRY_BY_ID } from '../../data/ancestries';
import { CLASSES, CLASS_BY_ID, FIGHTING_STYLES } from '../../data/classes';
import { BACKGROUNDS, BACKGROUND_BY_ID } from '../../data/backgrounds';
import { COMPANIONS } from '../../data/companions';
import { ACTION_BY_ID, spellsForClass } from '../../data/actions';
import { ITEM_BY_ID } from '../../data/items';
import { ABILITY_NAMES, abilityMod, POINT_BUY_BUDGET, POINT_BUY_COST, SKILL_NAMES, STANDARD_ARRAY } from '../../rules/abilities';
import { ABILITIES, type Ability, type Skill, type Difficulty } from '../../engine/types';
import { createCharacter, preparedLimit } from '../../engine/character';
import { newGame } from '../../engine/state';
import { addItem } from '../../engine/state';
import { rollDie } from '../../core/dice';
import { signed } from '../../core/util';
import { charPortrait, companionPortrait, portraitCardSvg, PLAYER_PORTRAITS, DEFAULT_PLAYER_PORTRAIT } from '../portraits';
import { sfx } from '../../audio/audio';

const TRAITS = ['Brave', 'Curious', 'Cautious', 'Honest', 'Sly', 'Kind', 'Proud', 'Pious', 'Sceptical', 'Hot-headed', 'Patient', 'Witty', 'Melancholy', 'Ambitious', 'Loyal', 'Restless'];

interface Draft {
  name: string; hue: number; appearance: string; art: string;
  ancestry: string; classId: string; background: string; style: string;
  abilityMode: 'pointbuy' | 'array' | 'roll';
  base: Record<Ability, number>;
  pool: number[]; assign: Partial<Record<Ability, number>>;
  skills: Skill[]; expertise: Skill[];
  cantrips: string[]; spells: string[];
  traits: string[]; motivation: string;
  companions: string[];
  difficulty: Difficulty; permadeath: boolean; limitedRest: boolean;
}

const STEPS = ['Identity', 'Ancestry', 'Class', 'Background', 'Abilities', 'Skills', 'Spells', 'Personality', 'Companions', 'Difficulty', 'Summary'];

export class CreationScreen implements Screen {
  el: HTMLElement;
  private step = 0;
  private d: Draft = {
    name: '', hue: 200, appearance: '', art: DEFAULT_PLAYER_PORTRAIT, ancestry: 'human', classId: 'fighter', background: 'soldier', style: 'style_defense',
    abilityMode: 'pointbuy', base: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 }, pool: [...STANDARD_ARRAY], assign: {},
    skills: [], expertise: [], cantrips: [], spells: [], traits: [], motivation: '', companions: [],
    difficulty: 'adventurer', permadeath: false, limitedRest: false,
  };
  private body: HTMLElement;
  private nav: HTMLElement;

  constructor(private app: App) {
    this.body = h('div', { class: 'creation-body' });
    this.nav = h('div', { class: 'creation-steps' });
    this.el = h('div', { class: 'screen creation' },
      h('div', { class: 'creation-head' }, h('h1', null, 'Create Your Adventurer'), h('button', { class: 'btn ghost', onclick: () => app.showMenu() }, '← Main menu')),
      this.nav, this.body,
      h('div', { class: 'creation-foot' },
        h('button', { class: 'btn ghost', onclick: () => this.go(-1) }, '← Back'),
        h('button', { class: 'btn', id: 'cr-next', onclick: () => this.go(1) }, 'Next →')));
    this.applySuggested();
    this.render();
  }

  private applySuggested(): void {
    const sug = CLASS_BY_ID[this.d.classId].suggested;
    this.d.base = { ...sug };
    this.d.assign = { ...sug };
    this.d.skills = [];
    this.d.cantrips = [];
    this.d.spells = [];
    this.d.expertise = [];
    this.d.style = this.d.classId === 'fighter' ? 'style_defense' : '';
  }

  private go(dir: number): void {
    sfx('click');
    if (dir > 0) {
      const err = this.validate();
      if (err) { toast(err, 'bad'); return; }
      if (this.step === STEPS.length - 1) { this.finish(); return; }
    }
    this.step = Math.max(0, Math.min(STEPS.length - 1, this.step + dir));
    if (STEPS[this.step] === 'Spells' && !this.isCaster()) this.step += dir;
    this.render();
  }

  private isCaster(): boolean {
    const c = CLASS_BY_ID[this.d.classId];
    return c.caster !== 'none' && !(c.caster === 'half');
  }

  private finalScores(): Record<Ability, number> {
    const out = {} as Record<Ability, number>;
    const anc = ANCESTRY_BY_ID[this.d.ancestry];
    for (const a of ABILITIES) {
      const base = this.d.abilityMode === 'pointbuy' ? this.d.base[a] : this.d.assign[a] ?? 8;
      out[a] = base + (anc.bonuses[a] ?? 0);
    }
    return out;
  }

  private baseScores(): Record<Ability, number> {
    const out = {} as Record<Ability, number>;
    for (const a of ABILITIES) out[a] = this.d.abilityMode === 'pointbuy' ? this.d.base[a] : this.d.assign[a] ?? 8;
    return out;
  }

  private spellLimits(): { cantrips: number; spells: number } {
    const c = CLASS_BY_ID[this.d.classId];
    const cantrips = c.cantrips?.[1] ?? 0;
    let spells = 0;
    if (c.id === 'wizard') spells = 6;
    else if (c.spellsKnown) spells = c.spellsKnown[1];
    else if (c.id === 'cleric') spells = Math.max(1, 1 + abilityMod(this.finalScores().wis));
    return { cantrips, spells };
  }

  private validate(): string | null {
    const d = this.d;
    switch (STEPS[this.step]) {
      case 'Identity': if (!d.name.trim()) return 'Your adventurer needs a name.'; break;
      case 'Abilities': {
        if (d.abilityMode === 'pointbuy') { if (this.pointsSpent() > POINT_BUY_BUDGET) return 'You have spent too many points.'; }
        else if (ABILITIES.some((a) => d.assign[a] === undefined)) return 'Assign a score to every ability.';
        break;
      }
      case 'Skills': {
        const c = CLASS_BY_ID[d.classId];
        if (d.skills.length !== c.skillCount) return `Choose ${c.skillCount} class skills.`;
        if (c.id === 'rogue' && d.expertise.length !== 2) return 'Choose 2 skills for Expertise.';
        break;
      }
      case 'Spells': {
        const lim = this.spellLimits();
        if (d.cantrips.length !== lim.cantrips) return `Choose ${lim.cantrips} cantrips.`;
        if (d.spells.length !== lim.spells) return `Choose ${lim.spells} 1st-level spells.`;
        break;
      }
      case 'Companions': if (d.companions.length !== 3) return 'Choose exactly three companions.'; break;
    }
    return null;
  }

  private pointsSpent(): number {
    return ABILITIES.reduce((s, a) => s + (POINT_BUY_COST[this.d.base[a]] ?? 99), 0);
  }

  private render(): void {
    clear(this.nav);
    STEPS.forEach((s, i) => {
      if (s === 'Spells' && !this.isCaster()) return;
      this.nav.appendChild(h('div', { class: `cstep ${i === this.step ? 'on' : i < this.step ? 'done' : ''}` }, s));
    });
    clear(this.body);
    (document.getElementById('cr-next') as HTMLButtonElement | null)?.replaceChildren(this.step === STEPS.length - 1 ? 'Begin the Adventure ✦' : 'Next →');
    const steps: Record<string, () => HTMLElement> = {
      Identity: () => this.stepIdentity(), Ancestry: () => this.stepAncestry(), Class: () => this.stepClass(), Background: () => this.stepBackground(),
      Abilities: () => this.stepAbilities(), Skills: () => this.stepSkills(), Spells: () => this.stepSpells(), Personality: () => this.stepPersonality(),
      Companions: () => this.stepCompanions(), Difficulty: () => this.stepDifficulty(), Summary: () => this.stepSummary(),
    };
    this.body.appendChild(steps[STEPS[this.step]]());
  }

  private card(title: string, sub: string, selected: boolean, onclick: () => void, extra?: HTMLElement): HTMLElement {
    return h('div', { class: `pick-card ${selected ? 'sel' : ''}`, onclick: () => { sfx('click'); onclick(); this.render(); } },
      h('div', { class: 'pick-title' }, title), h('div', { class: 'pick-sub' }, sub), extra);
  }

  // ─────────────────── Steps

  private stepIdentity(): HTMLElement {
    const d = this.d;
    const title = h('h2', { class: 'hero-name-preview' }, d.name || 'Your story begins here');
    const selected = PLAYER_PORTRAITS.find(p => p.id === d.art) ?? PLAYER_PORTRAITS[0];
    return h('div', { class: 'identity-layout' },
      h('div', { class: 'identity-form' },
        h('div', { class: 'creation-eyebrow' }, 'CHAPTER ZERO · THE ADVENTURER'),
        h('label', { for: 'adventurer-name' }, 'Your name'),
        h('input', { id: 'adventurer-name', class: 'text', value: d.name, maxlength: 24, placeholder: 'e.g. Aldren Vey', oninput: (e: Event) => { d.name = (e.target as HTMLInputElement).value; title.textContent = d.name || 'Your story begins here'; } }),
        h('label', { for: 'adventurer-appearance' }, 'Appearance and distinguishing features (optional)'),
        h('textarea', { id: 'adventurer-appearance', class: 'text', rows: 2, placeholder: 'A weathered cloak, a silver ring, a scar through one eyebrow…', oninput: (e: Event) => { d.appearance = (e.target as HTMLTextAreaElement).value; } }, d.appearance),
        h('div', { class: 'portrait-gallery-head' }, h('h3', null, 'Choose your portrait'), h('span', { class: 'muted small' }, `${PLAYER_PORTRAITS.length} illustrated faces`)),
        h('p', { class: 'muted small' }, 'Your portrait is cosmetic. Choose your ancestry, class and abilities in the next steps.'),
        h('div', { class: 'portrait-gallery', role: 'group', 'aria-label': 'Choose a character portrait' },
          PLAYER_PORTRAITS.map(p => h('button', {
            type: 'button', class: `portrait-choice ${p.id === d.art ? 'selected' : ''}`, 'aria-label': p.name,
            'aria-pressed': String(p.id === d.art), title: p.name,
            onclick: () => { d.art = p.id; sfx('click'); this.render(); },
          }, h('div', { class: 'portrait-choice-art', html: portraitCardSvg(p.id, 100) }), h('span', null, p.name)))),
        h('label', { for: 'adventurer-hue' }, 'Portrait frame and token accent'),
        h('input', { id: 'adventurer-hue', type: 'range', min: 0, max: 359, value: d.hue, 'aria-label': 'Portrait frame and token accent', oninput: (e: Event) => { d.hue = +(e.target as HTMLInputElement).value; } })),
      h('aside', { class: 'hero-preview panel' },
        h('div', { class: 'hero-portrait-stage', html: portraitCardSvg(d.art, 280) }),
        h('div', { class: 'hero-preview-caption' }, h('div', { class: 'creation-eyebrow' }, selected.name.toUpperCase()), title,
          h('p', { class: 'muted' }, 'One adventurer. Three companions. A world that remembers your choices.'))));
  }

  private stepAncestry(): HTMLElement {
    const sel = ANCESTRY_BY_ID[this.d.ancestry];
    return h('div', { class: 'cgrid two' },
      h('div', { class: 'pick-grid' }, ANCESTRIES.map((a) => this.card(a.name, Object.entries(a.bonuses).map(([k, v]) => `${k.toUpperCase()} +${v}`).join(', '), a.id === this.d.ancestry, () => { this.d.ancestry = a.id; this.d.hue = a.hue; }))),
      h('div', { class: 'detail panel' }, h('h3', null, sel.name), h('p', null, sel.desc), h('p', null, `Speed: ${sel.speed * 5} ft`),
        h('ul', null, sel.traits.map((t) => h('li', null, h('b', null, t.name + ': '), t.desc)))));
  }

  private stepClass(): HTMLElement {
    const sel = CLASS_BY_ID[this.d.classId];
    return h('div', { class: 'cgrid two' },
      h('div', { class: 'pick-grid' }, CLASSES.map((c) => this.card(`${c.sigil} ${c.name}`, c.role, c.id === this.d.classId, () => { this.d.classId = c.id; this.applySuggested(); }))),
      h('div', { class: 'detail panel' },
        h('h3', null, `${sel.sigil} ${sel.name}`), h('p', null, sel.desc),
        h('p', null, h('b', null, 'Hit die: '), `d${sel.hitDie}`, h('br'), h('b', null, 'Saves: '), sel.saves.map((s) => ABILITY_NAMES[s]).join(', '),
          h('br'), h('b', null, 'Armour: '), sel.armor.length ? sel.armor.join(', ') : 'none', h('br'), h('b', null, 'Spellcasting: '), sel.caster === 'none' ? 'none' : `${sel.caster} (${ABILITY_NAMES[sel.castAbility!]})`),
        h('p', null, h('b', null, 'Strengths: '), sel.strengths, h('br'), h('b', null, 'Weaknesses: '), sel.weaknesses),
        h('h4', null, 'Features (levels 1–5)'),
        h('ul', null, sel.features.filter((f) => f.level <= 5).map((f) => h('li', null, h('b', null, `Lv ${f.level} ${f.name}: `), f.desc))),
        h('h4', null, 'Specialisations (level 3)'),
        h('ul', null, sel.subclasses.map((s) => h('li', null, h('b', null, s.name + ': '), s.desc))),
        sel.id === 'fighter' ? h('div', null, h('h4', null, 'Fighting Style'), h('div', { class: 'pick-grid small' }, FIGHTING_STYLES.map((fs) => this.card(fs.name, fs.desc, this.d.style === fs.id, () => { this.d.style = fs.id; })))) : null));
  }

  private stepBackground(): HTMLElement {
    const sel = BACKGROUND_BY_ID[this.d.background];
    return h('div', { class: 'cgrid two' },
      h('div', { class: 'pick-grid' }, BACKGROUNDS.map((b) => this.card(b.name, b.skills.map((s) => SKILL_NAMES[s]).join(', '), b.id === this.d.background, () => { this.d.background = b.id; this.d.skills = this.d.skills.filter((s) => !b.skills.includes(s)); }))),
      h('div', { class: 'detail panel' }, h('h3', null, sel.name), h('p', null, sel.desc),
        h('p', null, h('b', null, sel.feature.name + ': '), sel.feature.desc),
        h('p', null, h('b', null, 'Skills: '), sel.skills.map((s) => SKILL_NAMES[s]).join(', ')),
        h('p', null, h('b', null, 'Items: '), sel.items.map((i) => ITEM_BY_ID[i]?.name ?? i).join(', '), `, ${sel.gold} gold`),
        h('p', { class: 'muted' }, 'Your background unlocks unique dialogue options and reactions throughout the campaign.')));
  }

  private stepAbilities(): HTMLElement {
    const d = this.d;
    const anc = ANCESTRY_BY_ID[d.ancestry];
    const finals = this.finalScores();
    const modeBtn = (m: Draft['abilityMode'], label: string) => h('button', { class: `btn ${d.abilityMode === m ? '' : 'ghost'}`, onclick: () => {
      d.abilityMode = m;
      if (m === 'array') { d.pool = [...STANDARD_ARRAY]; d.assign = {}; }
      if (m === 'roll') { d.pool = Array.from({ length: 6 }, () => { const r = [rollDie(6), rollDie(6), rollDie(6), rollDie(6)].sort((a, b) => b - a); return r[0] + r[1] + r[2]; }).sort((a, b) => b - a); d.assign = {}; sfx('dice'); }
      if (m === 'pointbuy') d.base = { ...CLASS_BY_ID[d.classId].suggested };
      this.render();
    } }, label);
    const rows = ABILITIES.map((a) => {
      let control: HTMLElement;
      if (d.abilityMode === 'pointbuy') {
        control = h('div', { class: 'pb' },
          h('button', { class: 'icon-btn', onclick: () => { if (d.base[a] > 8) { d.base[a]--; this.render(); } } }, '−'),
          h('span', { class: 'pb-val' }, String(d.base[a])),
          h('button', { class: 'icon-btn', onclick: () => { if (d.base[a] < 15) { d.base[a]++; this.render(); } } }, '+'));
      } else {
        const used = Object.entries(d.assign).filter(([k]) => k !== a).map(([, v]) => v);
        const avail = [...d.pool];
        for (const u of used) { const i = avail.indexOf(u!); if (i >= 0) avail.splice(i, 1); }
        control = h('select', { onchange: (e: Event) => { const v = (e.target as HTMLSelectElement).value; if (v === '') delete d.assign[a]; else d.assign[a] = +v; this.render(); } },
          h('option', { value: '' }, '—'),
          [...new Set([...avail, ...(d.assign[a] !== undefined ? [d.assign[a]!] : [])])].sort((x, y) => y - x).map((v) => h('option', { value: v, selected: d.assign[a] === v }, String(v))));
      }
      const bonus = anc.bonuses[a] ?? 0;
      return h('tr', null, h('td', null, h('b', null, ABILITY_NAMES[a])), h('td', null, control), h('td', { class: 'muted' }, bonus ? `+${bonus}` : ''), h('td', null, h('b', null, String(finals[a]))), h('td', null, signed(abilityMod(finals[a]))));
    });
    return h('div', null,
      h('div', { class: 'row' }, modeBtn('pointbuy', 'Point Buy (27)'), modeBtn('array', 'Standard Array'), modeBtn('roll', 'Roll 4d6 (drop lowest)')),
      d.abilityMode === 'pointbuy' ? h('p', null, `Points spent: ${this.pointsSpent()} / ${POINT_BUY_BUDGET}`) : h('p', null, `Assign these values: ${d.pool.join(', ')}`),
      h('table', { class: 'abil-table' }, h('tr', null, h('th', null, 'Ability'), h('th', null, 'Base'), h('th', null, 'Ancestry'), h('th', null, 'Score'), h('th', null, 'Mod')), rows),
      h('p', { class: 'muted' }, `Recommended for ${CLASS_BY_ID[d.classId].name}: focus ${CLASS_BY_ID[d.classId].primary.map((p) => ABILITY_NAMES[p]).join(' and ')}.`));
  }

  private stepSkills(): HTMLElement {
    const d = this.d;
    const c = CLASS_BY_ID[d.classId];
    const bg = BACKGROUND_BY_ID[d.background];
    const anc = ANCESTRY_BY_ID[d.ancestry];
    const fixed = new Set<Skill>([...bg.skills, ...(anc.skills ?? [])]);
    const toggle = (s: Skill) => {
      if (d.skills.includes(s)) d.skills = d.skills.filter((x) => x !== s);
      else if (d.skills.length < c.skillCount) d.skills.push(s);
      d.expertise = d.expertise.filter((x) => d.skills.includes(x) || fixed.has(x));
    };
    const all: Skill[] = [...new Set([...d.skills, ...fixed])];
    return h('div', null,
      h('p', null, `Choose ${c.skillCount} skills from your class list (${d.skills.length}/${c.skillCount}). Background and ancestry grant: ${[...fixed].map((s) => SKILL_NAMES[s]).join(', ') || 'none'}.`),
      h('div', { class: 'pick-grid small' }, c.skillChoices.filter((s) => !fixed.has(s)).map((s) => this.card(SKILL_NAMES[s], '', d.skills.includes(s), () => toggle(s)))),
      c.id === 'rogue' ? h('div', null, h('h4', null, `Expertise: choose 2 proficient skills (${d.expertise.length}/2)`),
        h('div', { class: 'pick-grid small' }, all.map((s) => this.card(SKILL_NAMES[s], 'double proficiency', d.expertise.includes(s), () => {
          if (d.expertise.includes(s)) d.expertise = d.expertise.filter((x) => x !== s); else if (d.expertise.length < 2) d.expertise.push(s);
        })))) : null);
  }

  private stepSpells(): HTMLElement {
    const d = this.d;
    const lim = this.spellLimits();
    const list = spellsForClass(d.classId, 1);
    const pick = (arr: string[], id: string, max: number) => { const i = arr.indexOf(id); if (i >= 0) arr.splice(i, 1); else if (arr.length < max) arr.push(id); };
    const spellCard = (id: string, arr: string[], max: number) => {
      const s = ACTION_BY_ID[id];
      return this.card(s.name, s.desc, arr.includes(id), () => pick(arr, id, max));
    };
    return h('div', null,
      lim.cantrips ? h('h4', null, `Cantrips (${d.cantrips.length}/${lim.cantrips}) — unlimited use`) : null,
      lim.cantrips ? h('div', { class: 'pick-grid' }, list.filter((s) => s.level === 0).map((s) => spellCard(s.id, d.cantrips, lim.cantrips))) : null,
      h('h4', null, `1st-level spells (${d.spells.length}/${lim.spells}) — ${d.classId === 'cleric' ? 'prepared (you can change these after a long rest)' : d.classId === 'wizard' ? 'in your spellbook' : 'known'}`),
      h('div', { class: 'pick-grid' }, list.filter((s) => s.level === 1).map((s) => spellCard(s.id, d.spells, lim.spells))));
  }

  private stepPersonality(): HTMLElement {
    const d = this.d;
    return h('div', { class: 'cgrid two' },
      h('div', null, h('h4', null, `Personality traits (up to 3) — ${d.traits.join(', ') || 'none'}`),
        h('div', { class: 'pick-grid small' }, TRAITS.map((t) => this.card(t, '', d.traits.includes(t), () => {
          if (d.traits.includes(t)) d.traits = d.traits.filter((x) => x !== t); else if (d.traits.length < 3) d.traits.push(t);
        })))),
      h('div', null, h('h4', null, 'Personal motivation (optional)'),
        h('textarea', { class: 'text', rows: 6, placeholder: 'Why did you come to the frontier? What are you looking for?', oninput: (e: Event) => { d.motivation = (e.target as HTMLTextAreaElement).value; } }, d.motivation),
        h('p', { class: 'muted' }, 'Personality is for your own role-play; your choices in dialogue are what the world and your companions actually respond to.')));
  }

  private stepCompanions(): HTMLElement {
    const d = this.d;
    const focus = COMPANIONS.find((c) => c.id === d.companions[d.companions.length - 1]) ?? COMPANIONS[0];
    return h('div', { class: 'cgrid two' },
      h('div', null, h('p', null, `Choose exactly three companions (${d.companions.length}/3). They are controlled by the computer, with their own opinions and tactics.`),
        h('div', { class: 'pick-grid comp' }, COMPANIONS.map((c) => {
          return this.card(c.name, `${c.title} — ${c.blurb}`, d.companions.includes(c.id), () => {
            if (d.companions.includes(c.id)) d.companions = d.companions.filter((x) => x !== c.id);
            else if (d.companions.length < 3) d.companions.push(c.id);
            else toast('You can only bring three. Deselect someone first.', 'bad');
          }, h('div', { class: 'mini-portrait', html: companionPortrait(c.id, 60) }));
        }))),
      h('div', { class: 'detail panel' },
        h('div', { class: 'companion-detail-head' }, h('div', { html: companionPortrait(focus.id, 104) }), h('div', null, h('h3', null, focus.name), h('div', { class: 'muted' }, focus.title))),
        h('p', null, focus.bio),
        h('p', null, h('b', null, 'Personality: '), focus.personality),
        h('p', null, h('b', null, 'Philosophy: '), focus.philosophy),
        h('p', null, h('b', null, 'Ambition: '), focus.ambition, h('br'), h('b', null, 'Fear: '), focus.fear),
        h('p', null, h('b', null, 'In battle: '), `${focus.combat.role}; aggression ${Math.round(focus.combat.aggression * 10)}/10, caution ${Math.round(focus.combat.caution * 10)}/10, support ${Math.round(focus.combat.support * 10)}/10.`),
        h('p', { class: 'muted' }, 'Everyone has secrets. You will have to earn theirs.')));
  }

  private stepDifficulty(): HTMLElement {
    const d = this.d;
    const opts: [Difficulty, string, string][] = [
      ['storyteller', 'Storyteller', 'Focus on the story; gentler encounters and forgiving enemies.'],
      ['adventurer', 'Adventurer', 'The balanced, intended experience.'],
      ['veteran', 'Veteran', 'Tougher enemies; resources matter.'],
      ['tactician', 'Tactician', 'Sharp enemy AI, sturdier foes, little margin for error.'],
    ];
    return h('div', null,
      h('div', { class: 'pick-grid' }, opts.map(([id, n, desc]) => this.card(n, desc, d.difficulty === id, () => { d.difficulty = id; }))),
      h('h4', null, 'Optional rules'),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: d.permadeath, onchange: (e: Event) => { d.permadeath = (e.target as HTMLInputElement).checked; } }), ' Permadeath — characters who fail three death saves die for good.'),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: d.limitedRest, onchange: (e: Event) => { d.limitedRest = (e.target as HTMLInputElement).checked; } }), ' Limited rest — only one short rest between long rests.'),
      h('p', { class: 'muted' }, 'Dice display, CPU speed, enemy health visibility and more can be changed any time in Settings.'));
  }

  private stepSummary(): HTMLElement {
    const ch = this.buildCharacter();
    const cls = CLASS_BY_ID[ch.classId];
    return h('div', { class: 'cgrid two' },
      h('div', { class: 'center' }, h('div', { class: 'portrait-big', html: charPortrait(ch, 180) }),
        h('h2', null, ch.name), h('div', null, `${ANCESTRY_BY_ID[ch.ancestry].name} ${cls.name} — ${BACKGROUND_BY_ID[ch.background].name}`)),
      h('div', { class: 'detail panel' },
        h('p', null, ABILITIES.map((a) => `${a.toUpperCase()} ${ch.abilities[a]} (${signed(abilityMod(ch.abilities[a]))})`).join(' · ')),
        h('p', null, `HP ${ch.maxHp}`),
        h('p', null, h('b', null, 'Skills: '), ch.skillProfs.map((s) => SKILL_NAMES[s]).join(', ')),
        ch.knownSpells.length ? h('p', null, h('b', null, 'Spells: '), ch.knownSpells.map((s) => ACTION_BY_ID[s]?.name).join(', ')) : null,
        h('p', null, h('b', null, 'Equipment: '), Object.values(ch.equipment).map((i) => ITEM_BY_ID[i!]?.name).join(', ')),
        h('p', null, h('b', null, 'Companions: '), this.d.companions.map((id) => COMPANIONS.find((c) => c.id === id)!.name).join(', ')),
        h('p', null, h('b', null, 'Difficulty: '), this.d.difficulty, this.d.permadeath ? ' · permadeath' : '', this.d.limitedRest ? ' · limited rest' : '')));
  }

  private buildCharacter() {
    const d = this.d;
    const ch = createCharacter({
      id: 'player', name: d.name.trim() || 'Wanderer', kind: 'player', ancestry: d.ancestry, classId: d.classId, background: d.background,
      baseAbilities: this.baseScores(), skills: d.skills, expertise: d.expertise, cantrips: d.cantrips, spells: d.spells,
      fightingStyle: d.style || undefined, personality: d.traits.join(', '), motivation: d.motivation, appearance: d.appearance,
      portrait: { hue: d.hue, sigil: CLASS_BY_ID[d.classId].sigil, initials: (d.name.trim() || 'Wa').slice(0, 2).toUpperCase(), style: 0, art: d.art },
    });
    if (CLASS_BY_ID[d.classId].prepares && d.classId !== 'wizard') ch.preparedSpells = ch.preparedSpells.slice(0, preparedLimit(ch));
    return ch;
  }

  private finish(): void {
    const player = this.buildCharacter();
    const state = newGame({ player, companionIds: this.d.companions, difficulty: this.d.difficulty, rules: { permadeath: this.d.permadeath, limitedRest: this.d.limitedRest } });
    const bg = BACKGROUND_BY_ID[this.d.background];
    for (const it of bg.items) if (ITEM_BY_ID[it]) addItem(state, it, 1);
    state.gold += bg.gold + CLASS_BY_ID[this.d.classId].startingGold;
    // Starting items that did not fit an equipment slot go to the pack.
    for (const it of CLASS_BY_ID[this.d.classId].startingItems) if (!Object.values(player.equipment).includes(it)) addItem(state, it, 1);
    sfx('levelup');
    this.app.begin(state, true);
  }
}
