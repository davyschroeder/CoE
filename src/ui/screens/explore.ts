import type { App, Screen } from '../app';
import { h, clear, toast, modal, bar, put } from '../dom';
import type { MapObject } from '../../data/maps/types';
import { tile } from '../../data/maps/tiles';
import { ENCOUNTER_BY_ID } from '../../data/encounters';
import { COMPANION_BY_ID } from '../../data/companions';
import { CLASS_BY_ID } from '../../data/classes';
import { ITEM_BY_ID } from '../../data/items';
import {
  getMap, tileAt, isPassable, findPath, stepTo, visibleTiles, updateExplored, decodeExplored, objectsAt, isObjectKnown,
  lootContainer, attemptLock, disarmTrap, search, lighting, instability, knownTrapTiles, music, resolveList, type StepEvent,
} from '../../engine/exploration';
import { activeParty, addLog, clockString, mapRuntime, player, recordRoll, resonanceMax, hasItem } from '../../engine/state';
import { maybeBanter, maybeIdleRemark, fillName } from '../../engine/companionMind';
import { canShortRest, shortRest } from '../../engine/rest';
import { skillBonus, canLevelUp, passivePerception } from '../../engine/character';
import { skillCheck } from '../../rules/checks';
import { evalCond } from '../../engine/conditions';
import { saveGame } from '../../engine/save';
import { drawTile, drawToken, glow, lightingTint } from '../render/tiles';
import { charPortrait } from '../portraits';
import { playMusic, sfx } from '../../audio/audio';
import { settings } from '../../core/settings';
import { t } from '../../i18n/index';
import { openJournal } from './journal';
import { openInventory } from './inventory';
import { openCharacter } from './character';
import { openParty } from './party';
import { openWorldMap } from './worldMap';
import { openDiceLog, openLog } from './logs';
import { openSaveLoad } from './saveLoad';
import { openSettings } from './settingsView';
import { openCamp } from './camp';
import { rollDie } from '../../core/dice';

interface Float { x: number; y: number; text: string; color: string; born: number; }

export class ExploreScreen implements Screen {
  el: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private partyBox: HTMLElement;
  private topBar: HTMLElement;
  private logBox: HTMLElement;
  private tileSize = 40;
  private trail: { x: number; y: number }[] = [];
  private path: { x: number; y: number }[] = [];
  private pendingInteract: MapObject | null = null;
  private visible = new Set<number>();
  private raf = 0;
  private stepTimer = 0;
  private hover: { x: number; y: number } | null = null;
  private floats: Float[] = [];
  private bubbles = new Map<string, { text: string; until: number }>();
  private camX = 0;
  private camY = 0;
  private lastLogLen = 0;

  constructor(private app: App) {
    this.canvas = h('canvas', { class: 'map-canvas' });
    this.ctx = this.canvas.getContext('2d')!;
    this.partyBox = h('div', { class: 'hud-party' });
    this.topBar = h('div', { class: 'hud-top panel' });
    this.logBox = h('div', { class: 'hud-log panel' });
    const btn = (label: string, key: string, fn: () => void, tip?: string) =>
      h('button', { class: 'hud-btn', 'data-tip': `${tip ?? label} (${key})`, onclick: () => { sfx('click'); fn(); } }, h('span', { class: 'k' }, key), label);
    this.el = h('div', { class: 'screen explore' },
      this.canvas, this.topBar, this.partyBox, this.logBox,
      h('div', { class: 'hud-bottom panel' },
        btn(t('hud.journal'), 'J', () => openJournal(app)),
        btn(t('hud.inventory'), 'I', () => openInventory(app)),
        btn(t('hud.character'), 'C', () => openCharacter(app)),
        btn(t('hud.party'), 'P', () => openParty(app), 'Party orders, relationships and companions'),
        btn(t('hud.map'), 'M', () => openWorldMap(app)),
        btn(t('hud.search'), 'F', () => this.doSearch(), 'Actively search nearby for hidden things'),
        btn(t('hud.rest'), 'R', () => this.doShortRest()),
        btn(t('hud.dice'), 'L', () => openDiceLog(app)),
        btn(t('hud.save'), 'F5', () => openSaveLoad(app, 'save'), 'Save game (F5 = quicksave)'),
        btn(t('hud.menu'), 'Esc', () => this.openMenu())));
    this.canvas.addEventListener('click', (e) => this.onClick(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMove(e));
    this.canvas.addEventListener('wheel', (e) => { e.preventDefault(); this.tileSize = Math.max(24, Math.min(64, this.tileSize - Math.sign(e.deltaY) * 4)); }, { passive: false });
    this.canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); this.path = []; });
  }

  get s() { return this.app.state!; }

  mount(): void {
    const s = this.s;
    const m = getMap(s.location.mapId);
    playMusic(music(s, m));
    this.recomputeVisibility();
    this.camX = s.location.x; this.camY = s.location.y;
    this.refresh();
    if (!s.flags[`entered_${m.id}`]) this.narrateEnter();
    const loop = (time: number) => { this.update(time); this.draw(time); this.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
  }

  unmount(): void { cancelAnimationFrame(this.raf); }

  onMapChanged(_first: boolean): void {
    this.trail = [];
    this.path = [];
    this.pendingInteract = null;
    this.recomputeVisibility();
    this.camX = this.s.location.x; this.camY = this.s.location.y;
    this.narrateEnter();
    this.refresh();
  }

  private narrateEnter(): void {
    const s = this.s;
    const m = getMap(s.location.mapId);
    const key = `entered_${m.id}${s.flags.bell_rang ? '_n' : ''}`;
    if (s.flags[key]) return;
    s.flags[key] = true;
    s.flags[`entered_${m.id}`] = true;
    const text = resolveList(s, m.enter.map((e) => ({ if: e.if, value: e.text })), '');
    if (text) {
      addLog(s, 'dm', text);
      modal(m.name, (close) => h('div', { class: 'narration' }, h('p', null, text), h('button', { class: 'btn', onclick: close }, 'Continue')), { cls: 'narration-modal' });
    }
  }

  refresh(): void {
    this.renderParty();
    this.renderTop();
    this.renderLog();
    this.recomputeVisibility();
  }

  private recomputeVisibility(): void {
    const s = this.s;
    const m = getMap(s.location.mapId);
    this.visible = visibleTiles(s, m, s.location.x, s.location.y);
    updateExplored(s, m, this.visible);
  }

  // ─────────────────────── HUD

  private renderParty(): void {
    clear(this.partyBox);
    const s = this.s;
    for (const c of activeParty(s)) {
      const cs = c.companionId ? s.companions[c.companionId] : null;
      const card = h('div', { class: `pcard ${c.hp <= 0 ? 'down' : ''}`, 'data-tip': `${c.name} — ${CLASS_BY_ID[c.classId]?.name} ${c.level}${canLevelUp(c) ? ' (LEVEL UP!)' : ''}`, onclick: () => openCharacter(this.app, c.id) },
        h('div', { class: 'pc-portrait', html: charPortrait(c, 48) }),
        h('div', { class: 'pc-info' },
          h('div', { class: 'pc-name' }, c.name.split(' ')[0], canLevelUp(c) ? h('span', { class: 'lvl-up' }, ' ▲') : null),
          bar(c.hp, c.maxHp, 'hp'),
          cs ? h('div', { class: 'pc-mood', 'data-tip': 'Mood' }, moodWord(cs.mood)) : null));
      this.partyBox.appendChild(card);
    }
  }

  private renderTop(): void {
    clear(this.topBar);
    const s = this.s;
    const m = getMap(s.location.mapId);
    const inst = instability(s, m.id);
    const q = s.quests.mq_bell;
    const obj = q && q.status === 'active' ? (QUEST_OBJ(q.stage)) : '';
    put(this.topBar, 
      h('div', { class: 'loc' }, m.name),
      h('div', { class: 'clock' }, clockString(s)),
      h('div', { class: 'gold', 'data-tip': 'Party gold' }, `◉ ${s.gold}`),
      s.resonance.unlocked ? h('div', { class: 'res', 'data-tip': 'Aether Resonance — spend it to glimpse hidden memories. Restored by a long rest.' }, 'Resonance ', ...Array.from({ length: resonanceMax(s) }, (_, i) => h('span', { class: `pip ${i < s.resonance.current ? 'on' : ''}` }))) : null,
      h('div', { class: `inst inst-${Math.min(3, Math.floor(inst / 3))}`, 'data-tip': `Reality instability ${inst}/10. High instability brings fragments of other timelines and echo-touched foes.` }, `Instability ${inst}`),
      obj ? h('div', { class: 'objective', 'data-tip': 'Current main objective (J for journal)' }, '✦ ', obj) : null);
  }

  private renderLog(): void {
    const s = this.s;
    if (s.log.length === this.lastLogLen && this.logBox.childElementCount) return;
    this.lastLogLen = s.log.length;
    clear(this.logBox);
    const recent = s.log.slice(-14);
    this.logBox.append(h('div', { class: 'log-head' }, h('span', null, 'Chronicle'), h('button', { class: 'icon-btn', 'data-tip': 'Full log', onclick: () => openLog(this.app) }, '☰')));
    for (const e of recent) this.logBox.append(logLine(e));
    this.logBox.scrollTop = this.logBox.scrollHeight;
  }

  floatReaction(compId: string, score: number): void {
    const c = activeParty(this.s).find((x) => x.companionId === compId);
    if (!c) return;
    const idx = activeParty(this.s).indexOf(c);
    const pos = idx === 0 ? this.s.location : this.trail[idx - 1] ?? this.s.location;
    this.floats.push({ x: pos.x, y: pos.y, text: score > 0 ? '▲' : '▼', color: score > 0 ? '#8fe08f' : '#ff8a7a', born: performance.now() });
  }

  private say(compId: string, text: string): void {
    this.bubbles.set(compId, { text, until: performance.now() + 5000 + text.length * 30 });
  }

  // ─────────────────────── Input

  onKey(e: KeyboardEvent): boolean | void {
    if (this.app.busy) return;
    const k = e.key.toLowerCase();
    const dirs: Record<string, [number, number]> = { arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1], arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0], q: [-1, -1], e: [1, -1], z: [-1, 1], x: [1, 1] };
    if (dirs[k]) { this.path = []; this.tryStep(this.s.location.x + dirs[k][0], this.s.location.y + dirs[k][1]); e.preventDefault(); return true; }
    switch (k) {
      case 'j': openJournal(this.app); break;
      case 'i': openInventory(this.app); break;
      case 'c': openCharacter(this.app); break;
      case 'p': openParty(this.app); break;
      case 'm': openWorldMap(this.app); break;
      case 'l': openDiceLog(this.app); break;
      case 'f': this.doSearch(); break;
      case 'r': this.doShortRest(); break;
      case ' ': case 'enter': this.interactNearest(); break;
      case 'f5': e.preventDefault(); this.quicksave(); break;
      case 'f9': e.preventDefault(); this.app.load('quick'); break;
      case 'escape': this.openMenu(); break;
    }
  }

  private quicksave(): void {
    try { saveGame(this.s, 'quick'); toast('Quicksaved.', 'good'); } catch (err: any) { toast(`Save failed: ${err.message}`, 'bad'); }
  }

  private screenToTile(e: MouseEvent): { x: number; y: number } {
    const r = this.canvas.getBoundingClientRect();
    const s = this.tileSize;
    const ox = this.canvas.width / 2 - this.camX * s - s / 2, oy = this.canvas.height / 2 - this.camY * s - s / 2;
    return { x: Math.floor((e.clientX - r.left - ox) / s), y: Math.floor((e.clientY - r.top - oy) / s) };
  }

  private onMove(e: MouseEvent): void {
    this.hover = this.screenToTile(e);
    const m = getMap(this.s.location.mapId);
    const objs = objectsAt(this.s, m, this.hover.x, this.hover.y).filter((o) => isObjectKnown(this.s, m, o) && o.kind !== 'trigger' && o.kind !== 'encounter');
    this.canvas.style.cursor = objs.length ? 'pointer' : 'default';
    this.canvas.title = objs.map((o) => o.name).join(', ') || (this.isExplored(this.hover.x, this.hover.y) ? tile(tileAt(this.s, m, this.hover.x, this.hover.y)).name : '');
  }

  private onClick(e: MouseEvent): void {
    if (this.app.busy) return;
    const s = this.s;
    const m = getMap(s.location.mapId);
    const p = this.screenToTile(e);
    if (!this.isExplored(p.x, p.y)) return;
    const objs = objectsAt(s, m, p.x, p.y).filter((o) => isObjectKnown(s, m, o) && o.kind !== 'trigger' && o.kind !== 'encounter');
    const obj = objs[0];
    if (obj && obj.kind !== 'exit') {
      const d = Math.max(Math.abs(p.x - s.location.x), Math.abs(p.y - s.location.y));
      const reach = obj.kind === 'npc' ? 2 : 1;
      if (d <= reach) { this.interact(obj); return; }
      const path = this.pathToAdjacent(p.x, p.y);
      if (!path) { toast('You can\'t reach that from here.', 'bad'); return; }
      this.path = path; this.pendingInteract = obj;
      return;
    }
    const path = findPath(s, m, s.location.x, s.location.y, p.x, p.y, false, knownTrapTiles(s, m));
    if (path) { this.path = path; this.pendingInteract = null; }
  }

  private pathToAdjacent(x: number, y: number) {
    const s = this.s;
    const m = getMap(s.location.mapId);
    let best: { x: number; y: number }[] | null = null;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      if (!isPassable(s, m, x + dx, y + dy)) continue;
      if (x + dx === s.location.x && y + dy === s.location.y) return [];
      const p = findPath(s, m, s.location.x, s.location.y, x + dx, y + dy, false, knownTrapTiles(s, m));
      if (p && (!best || p.length < best.length)) best = p;
    }
    return best;
  }

  private isExplored(x: number, y: number): boolean {
    const m = getMap(this.s.location.mapId);
    if (x < 0 || y < 0 || x >= m.grid[0].length || y >= m.grid.length) return false;
    const bits = decodeExplored(mapRuntime(this.s, m.id).explored, m.grid.length * m.grid[0].length);
    return !!bits[y * m.grid[0].length + x];
  }

  private interactNearest(): void {
    const s = this.s;
    const m = getMap(s.location.mapId);
    for (let r = 0; r <= 2; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const o = objectsAt(s, m, s.location.x + dx, s.location.y + dy).find((o) => isObjectKnown(s, m, o) && !['trigger', 'encounter', 'exit'].includes(o.kind));
      if (o && (r <= 1 || o.kind === 'npc')) { this.interact(o); return; }
    }
    toast('Nothing to interact with here.', 'info', 1500);
  }

  // ─────────────────────── Movement

  private update(time: number): void {
    if (this.app.busy || document.getElementById('modal-layer')!.children.length) return;
    if (this.path.length && time - this.stepTimer > 110) {
      this.stepTimer = time;
      const next = this.path.shift()!;
      const moved = this.tryStep(next.x, next.y);
      if (!moved) { this.path = []; this.pendingInteract = null; }
      else if (!this.path.length && this.pendingInteract) {
        const o = this.pendingInteract;
        this.pendingInteract = null;
        this.interact(o);
      }
    }
    // smooth camera
    this.camX += (this.s.location.x - this.camX) * 0.2;
    this.camY += (this.s.location.y - this.camY) * 0.2;
  }

  private tryStep(x: number, y: number): boolean {
    const s = this.s;
    const m = getMap(s.location.mapId);
    if (!isPassable(s, m, x, y)) {
      const o = objectsAt(s, m, x, y).find((o) => isObjectKnown(s, m, o));
      if (o && Math.max(Math.abs(x - s.location.x), Math.abs(y - s.location.y)) <= 1) this.interact(o);
      return false;
    }
    const from = { x: s.location.x, y: s.location.y };
    const events = stepTo(s, x, y);
    const blocked = events.some((e) => e.type === 'trigger' && e.blocked);
    if (!blocked) {
      this.trail.unshift(from);
      this.trail = this.trail.slice(0, 3);
      if (Math.random() < 0.3) sfx('step');
    }
    this.recomputeVisibility();
    this.handleEvents(events);
    this.ambient();
    this.renderTop();
    this.renderLog();
    return !blocked && !events.some((e) => e.type !== 'notice' && e.type !== 'fragment');
  }

  private handleEvents(events: StepEvent[]): void {
    for (const e of events) {
      switch (e.type) {
        case 'exit': this.path = []; this.app.travel(e.obj.to!.map, e.obj.to!.x, e.obj.to!.y); return;
        case 'trap': toast(`Trap! ${e.victim} takes ${e.damage} damage.`, 'bad'); sfx('hit'); this.renderParty(); break;
        case 'trigger': this.path = []; if (e.obj.dialogue) this.app.openDialogue(e.obj.dialogue); return;
        case 'encounter': this.path = []; this.encounter(e.encounterId); return;
        case 'notice': {
          addLog(this.s, 'speech', e.text, e.speaker);
          const c = activeParty(this.s).find((x) => x.name === e.speaker);
          if (c?.companionId) this.say(c.companionId, e.text);
          toast(`${e.speaker.split(' ')[0]}: ${e.text}`, 'info', 4500);
          break;
        }
        case 'fragment': addLog(this.s, 'dm', e.text); toast(e.text, 'info', 5000); break;
      }
    }
  }

  /** Stealth, ambush or straight into combat. */
  private encounter(id: string): void {
    const s = this.s;
    const enc = ENCOUNTER_BY_ID[id];
    if (!enc) return;
    if (s.orders.stealth && enc.stealthDc) {
      // Group check: everyone rolls Stealth, success if at least half succeed.
      const party = activeParty(s).filter((c) => c.hp > 0);
      const rolls = party.map((c) => { const r = skillCheck(c, 'stealth', enc.stealthDc); recordRoll(s, r); return r; });
      const ok = rolls.filter((r) => r.success).length >= Math.ceil(party.length / 2);
      sfx('dice');
      const detail = rolls.map((r) => `${r.who.split(' ')[0]} ${r.total}`).join(', ');
      if (ok) {
        modal('Unseen', (close) => h('div', { class: 'narration' },
          h('p', null, `Moving quietly (group Stealth vs DC ${enc.stealthDc}: ${detail}), you spot them before they spot you: ${enc.name}.`),
          h('div', { class: 'row' },
            h('button', { class: 'btn', onclick: () => { close(); this.app.startCombat(id, 'party'); } }, 'Ambush them (they are surprised)'),
            h('button', { class: 'btn ghost', onclick: () => { close(); s.flags[`snuck_${id}`] = true; addLog(s, 'system', 'You slip past unnoticed.'); toast('You avoid the encounter for now.', 'good'); } }, 'Sneak past for now'))));
        return;
      }
      toast(`Spotted! (Stealth: ${detail})`, 'bad');
      this.app.startCombat(id, 'enemy');
      return;
    }
    this.app.startCombat(id);
  }

  private ambient(): void {
    const s = this.s;
    const rate = { low: 0.25, normal: 0.6, high: 1 }[settings().companionChatter];
    if (Math.random() > rate * 0.25) return;
    const b = Math.random() < 0.4 ? maybeBanter(s) : null;
    if (b) {
      b.lines.forEach((l, i) => setTimeout(() => {
        const name = COMPANION_BY_ID[l.who]?.name ?? l.who;
        const text = fillName(s, l.text);
        addLog(s, 'speech', text, name);
        this.say(l.who, text);
        this.renderLog();
      }, i * 2600));
      if (b.effects) import('../../engine/effects').then(({ applyEffects }) => applyEffects(s, b.effects));
      return;
    }
    const r = maybeIdleRemark(s);
    if (r) {
      addLog(s, 'speech', r.text, COMPANION_BY_ID[r.compId].name);
      this.say(r.compId, r.text);
    }
  }

  // ─────────────────────── Interaction

  interact(o: MapObject): void {
    const s = this.s;
    const m = getMap(s.location.mapId);
    switch (o.kind) {
      case 'npc': case 'inspect': case 'resonance':
        if (o.dialogue) this.app.openDialogue(o.dialogue);
        else if (o.desc) { addLog(s, 'dm', o.desc); modal(o.name, (close) => h('div', { class: 'narration' }, h('p', null, o.desc!), h('button', { class: 'btn', onclick: close }, 'Close'))); }
        break;
      case 'container': {
        if (o.desc && !mapRuntime(s, m.id).removed.includes(o.id)) addLog(s, 'dm', o.desc);
        const got = lootContainer(s, m.id, o);
        sfx('coin');
        toast(got.length ? `Found: ${got.join(', ')}` : `${o.name}: empty.`, got.length ? 'good' : 'info');
        break;
      }
      case 'lockedDoor': this.lockMenu(o); break;
      case 'trap': this.trapMenu(o); break;
      case 'exit': if (o.to) this.app.travel(o.to.map, o.to.x, o.to.y); break;
    }
    this.refresh();
  }

  private bestAt(skill: 'sleightOfHand' | 'athletics') {
    return [...activeParty(this.s).filter((c) => c.hp > 0)].sort((a, b) => skillBonus(b, skill) - skillBonus(a, skill))[0];
  }

  private lockMenu(o: MapObject): void {
    const s = this.s;
    const m = getMap(s.location.mapId);
    if (mapRuntime(s, m.id).opened.includes(o.id)) return;
    const picker = this.bestAt('sleightOfHand');
    const forcer = this.bestAt('athletics');
    const tools = hasItem(s, 'thieves_tools');
    modal(o.name, (close) => {
      const out = h('p', { class: 'muted' }, 'It\'s locked.');
      const act = (fn: () => { success: boolean; text: string; roll?: any }) => () => {
        const r = fn();
        sfx(r.roll ? 'dice' : 'door');
        out.textContent = r.text + (r.roll ? ` (${r.roll.label}: ${r.roll.total} vs DC ${r.roll.dc})` : '');
        addLog(s, 'system', out.textContent);
        if (r.success) { sfx('door'); setTimeout(close, 900); this.refresh(); }
      };
      return h('div', null, out,
        h('div', { class: 'col' },
          o.lock?.key ? h('button', { class: 'btn', disabled: !hasItem(s, o.lock.key), onclick: act(() => attemptLock(s, m.id, o, 'key', player(s))) }, `Use ${ITEM_BY_ID[o.lock.key]?.name ?? 'key'}${hasItem(s, o.lock.key) ? '' : ' (you don\'t have it)'}`) : null,
          h('button', { class: 'btn', onclick: act(() => attemptLock(s, m.id, o, 'pick', picker)) }, `Pick the lock — ${picker.name} (Sleight of Hand ${skillBonus(picker, 'sleightOfHand') >= 0 ? '+' : ''}${skillBonus(picker, 'sleightOfHand')}, DC ${o.lock!.dc}${tools ? '' : ', no thieves\' tools: disadvantage'})`),
          h('button', { class: 'btn', onclick: act(() => attemptLock(s, m.id, o, 'force', forcer)) }, `Force it — ${forcer.name} (Athletics ${skillBonus(forcer, 'athletics') >= 0 ? '+' : ''}${skillBonus(forcer, 'athletics')}, DC ${o.lock!.forceDc ?? o.lock!.dc + 2}; noisy)`),
          h('button', { class: 'btn ghost', onclick: close }, 'Leave it')));
    });
  }

  private trapMenu(o: MapObject): void {
    const s = this.s;
    const m = getMap(s.location.mapId);
    if (mapRuntime(s, m.id).disarmed.includes(o.id)) { toast('The trap is no longer a threat.', 'info'); return; }
    const who = this.bestAt('sleightOfHand');
    modal(o.name, (close) => h('div', null,
      h('p', null, `A trap: ${o.trap!.desc.split('.')[0]}.`),
      h('div', { class: 'col' },
        h('button', { class: 'btn', onclick: () => { const r = disarmTrap(s, m.id, o, who); sfx('dice'); toast(r.text, r.success ? 'good' : 'bad'); addLog(s, 'system', r.text); close(); this.refresh(); } },
          `Disarm — ${who.name} (Sleight of Hand ${skillBonus(who, 'sleightOfHand')}, DC ${o.trap!.disarmDc})`),
        h('button', { class: 'btn ghost', onclick: close }, 'Leave it (paths will route around it)'))));
  }

  private doSearch(): void {
    const s = this.s;
    const party = activeParty(s).filter((c) => c.hp > 0);
    const best = [...party].sort((a, b) => Math.max(skillBonus(b, 'perception'), skillBonus(b, 'investigation')) - Math.max(skillBonus(a, 'perception'), skillBonus(a, 'investigation')))[0];
    const res = search(s, best);
    sfx('dice');
    toast(res.found.length ? `${best.name} found: ${res.found.map((f) => f.name).join(', ')}` : `${best.name} searches (${res.roll.total}) but finds nothing new.`, res.found.length ? 'good' : 'info');
    this.refresh();
  }

  private doShortRest(): void {
    const s = this.s;
    const m = getMap(s.location.mapId);
    if (!canShortRest(s)) { toast('You need a long rest before you can short rest again (inn or camp).', 'bad'); return; }
    if (instability(s, m.id) >= 7 && !s.flags.bellwarden_defeated && m.id === 'vault') { toast('You cannot rest here — not with that thing watching you.', 'bad'); return; }
    modal('Short Rest', (close) => h('div', null,
      h('p', null, 'Rest for an hour: spend Hit Dice to recover HP and recharge short-rest abilities.'),
      h('div', { class: 'row' },
        h('button', { class: 'btn', onclick: () => {
          close();
          // Resting in a dangerous place can be interrupted.
          if (m.randomEncounters && evalCond(s, m.randomEncounters.if) && rollDie(6) === 1) { toast('Your rest is interrupted!', 'bad'); this.app.startCombat(m.randomEncounters.encounters[0]); return; }
          const msg = shortRest(s);
          sfx('heal'); toast(msg, 'good', 5000); addLog(s, 'system', msg); this.refresh();
        } }, 'Rest'),
        h('button', { class: 'btn ghost', onclick: close }, 'Cancel'))));
  }

  private openMenu(): void {
    modal('Menu', (close) => h('div', { class: 'col' },
      h('button', { class: 'btn', onclick: close }, 'Resume'),
      h('button', { class: 'btn', onclick: () => { close(); openSaveLoad(this.app, 'save'); } }, 'Save Game'),
      h('button', { class: 'btn', onclick: () => { close(); openSaveLoad(this.app, 'load'); } }, 'Load Game'),
      h('button', { class: 'btn', onclick: () => { close(); openSettings(this.app); } }, 'Settings'),
      this.s.location.mapId === 'inn' ? h('button', { class: 'btn', onclick: () => { close(); openCamp(this.app); } }, 'Camp') : null,
      h('button', { class: 'btn ghost', onclick: () => { close(); this.app.showMenu(); } }, 'Quit to Main Menu')));
  }

  // ─────────────────────── Rendering

  private draw(time: number): void {
    const s = this.s;
    if (!s) return;
    const cv = this.canvas;
    if (cv.width !== cv.clientWidth || cv.height !== cv.clientHeight) { cv.width = cv.clientWidth; cv.height = cv.clientHeight; }
    const ctx = this.ctx;
    const m = getMap(s.location.mapId);
    const ts = this.tileSize;
    const W = m.grid[0].length, H = m.grid.length;
    ctx.fillStyle = '#05060a';
    ctx.fillRect(0, 0, cv.width, cv.height);
    const ox = cv.width / 2 - this.camX * ts - ts / 2, oy = cv.height / 2 - this.camY * ts - ts / 2;
    const bits = decodeExplored(mapRuntime(s, m.id).explored, W * H);
    const x0 = Math.max(0, Math.floor(-ox / ts)), y0 = Math.max(0, Math.floor(-oy / ts));
    const x1 = Math.min(W - 1, Math.ceil((cv.width - ox) / ts)), y1 = Math.min(H - 1, Math.ceil((cv.height - oy) / ts));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = y * W + x;
      if (!bits[i]) continue;
      drawTile(ctx, tileAt(s, m, x, y), x, y, ox + x * ts, oy + y * ts, ts, m.tileset, time);
      if (!this.visible.has(i)) { ctx.fillStyle = 'rgba(5,6,12,0.6)'; ctx.fillRect(ox + x * ts, oy + y * ts, ts, ts); }
    }
    // Objects
    const rt = mapRuntime(s, m.id);
    for (const o of m.objects) {
      if (!isObjectKnown(s, m, o) || o.kind === 'trigger' || o.kind === 'encounter') continue;
      const i = o.y * W + o.x;
      if (!bits[i]) continue;
      const vis = this.visible.has(i);
      const px = ox + o.x * ts, py = oy + o.y * ts;
      switch (o.kind) {
        case 'npc': if (vis) drawToken(ctx, px, py, ts, npcColor(o), o.glyph ?? '?', { ring: '#9fd3ff' }); break;
        case 'container': if (!rt.removed.includes(o.id)) { ctx.fillStyle = '#8a6a2a'; ctx.fillRect(px + ts * 0.25, py + ts * 0.35, ts * 0.5, ts * 0.35); ctx.strokeStyle = '#e0c070'; ctx.strokeRect(px + ts * 0.25, py + ts * 0.35, ts * 0.5, ts * 0.35); } break;
        case 'exit': for (let k = 0; k < (o.w ?? 1); k++) { ctx.fillStyle = `rgba(160,200,255,${0.25 + 0.15 * Math.sin(time / 400)})`; ctx.fillRect(px + k * ts + 4, py + 4, ts - 8, ts - 8); } break;
        case 'trap': if (!rt.disarmed.includes(o.id)) { ctx.strokeStyle = '#ff5a4a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px + 8, py + 8); ctx.lineTo(px + ts - 8, py + ts - 8); ctx.moveTo(px + ts - 8, py + 8); ctx.lineTo(px + 8, py + ts - 8); ctx.stroke(); ctx.lineWidth = 1; } break;
        case 'lockedDoor': if (!rt.opened.includes(o.id)) { ctx.fillStyle = '#d4a45a'; ctx.font = `${ts * 0.45}px serif`; ctx.textAlign = 'center'; ctx.fillText('🔒', px + ts / 2, py + ts * 0.65); } break;
        case 'resonance': glow(ctx, px + ts / 2, py + ts / 2, ts * (0.25 + 0.05 * Math.sin(time / 300)), 'rgba(170,140,255,0.6)'); break;
        case 'inspect': if (vis) { ctx.fillStyle = 'rgba(255,230,160,0.8)'; ctx.font = `bold ${ts * 0.35}px serif`; ctx.textAlign = 'center'; ctx.fillText('?', px + ts * 0.85, py + ts * 0.3); } break;
      }
    }
    // Path preview
    if (this.path.length) {
      ctx.fillStyle = 'rgba(212,178,106,0.35)';
      for (const p of this.path) { ctx.beginPath(); ctx.arc(ox + p.x * ts + ts / 2, oy + p.y * ts + ts / 2, ts * 0.1, 0, Math.PI * 2); ctx.fill(); }
    }
    // Party (followers on the trail, leader on top)
    const party = activeParty(s);
    const positions = [s.location, ...this.trail];
    for (let i = party.length - 1; i >= 0; i--) {
      const c = party[i];
      const p = positions[Math.min(i, positions.length - 1)];
      const off = i > 0 && i >= positions.length ? (i - positions.length + 1) * 0.25 : 0;
      const px = ox + (p.x + off) * ts, py = oy + p.y * ts;
      const hue = c.companionId ? COMPANION_BY_ID[c.companionId].hue : c.portrait.hue;
      drawToken(ctx, px, py, ts, `hsl(${hue},45%,62%)`, c.name[0], { selected: i === 0, dim: c.hp <= 0 });
      const b = c.companionId ? this.bubbles.get(c.companionId) : undefined;
      if (b && b.until > performance.now()) this.drawBubble(ctx, px + ts / 2, py - 4, b.text);
    }
    // Lighting
    const tint = lightingTint(lighting(s, m));
    if (tint.alpha) {
      const cx = ox + s.location.x * ts + ts / 2, cy = oy + s.location.y * ts + ts / 2;
      const g = ctx.createRadialGradient(cx, cy, ts * 2, cx, cy, ts * 10);
      g.addColorStop(0, `rgba(${tint.color},${tint.alpha * 0.4})`);
      g.addColorStop(1, `rgba(${tint.color},${Math.min(0.85, tint.alpha * 1.6)})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, cv.width, cv.height);
    }
    // Floating reactions
    const now = performance.now();
    this.floats = this.floats.filter((f) => now - f.born < 1800);
    for (const f of this.floats) {
      const k = (now - f.born) / 1800;
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = f.color; ctx.font = `bold ${ts * 0.5}px serif`; ctx.textAlign = 'center';
      ctx.fillText(f.text, ox + f.x * ts + ts / 2, oy + f.y * ts - k * ts);
      ctx.globalAlpha = 1;
    }
    // Hover highlight
    if (this.hover && bits[this.hover.y * W + this.hover.x]) {
      ctx.strokeStyle = 'rgba(255,240,200,0.5)';
      ctx.strokeRect(ox + this.hover.x * ts + 0.5, oy + this.hover.y * ts + 0.5, ts - 1, ts - 1);
    }
  }

  private drawBubble(ctx: CanvasRenderingContext2D, x: number, y: number, text: string): void {
    const max = 260;
    ctx.font = '13px Georgia, serif';
    const words = text.split(' ');
    const lines: string[] = [];
    let line = '';
    for (const w of words) { const t2 = line ? `${line} ${w}` : w; if (ctx.measureText(t2).width > max) { lines.push(line); line = w; } else line = t2; }
    if (line) lines.push(line);
    const shown = lines.slice(0, 4);
    if (lines.length > 4) shown[3] += '…';
    const w = Math.min(max, Math.max(...shown.map((l) => ctx.measureText(l).width))) + 16, hgt = shown.length * 16 + 10;
    ctx.fillStyle = 'rgba(244,234,210,0.95)'; ctx.strokeStyle = '#6b5432';
    ctx.beginPath(); ctx.roundRect(x - w / 2, y - hgt - 8, w, hgt, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2a2016'; ctx.textAlign = 'left';
    shown.forEach((l, i) => ctx.fillText(l, x - w / 2 + 8, y - hgt + 10 + i * 16));
  }
}

function npcColor(o: MapObject): string {
  if (o.id.includes('echo') || o.id === 'lira' || o.id === 'sentinel') return '#b9c8ff';
  return '#e6d3a3';
}

function moodWord(m: number): string {
  return m >= 5 ? 'elated' : m >= 2 ? 'content' : m >= -1 ? 'steady' : m >= -4 ? 'troubled' : 'angry';
}

export function logLine(e: { kind: string; text: string; speaker?: string }): HTMLElement {
  if (e.kind === 'speech' && e.speaker) return h('div', { class: 'll speech' }, h('b', null, e.speaker + ': '), e.text);
  if (e.kind === 'reaction') return h('div', { class: 'll reaction' }, e.text);
  return h('div', { class: `ll ${e.kind}` }, e.text);
}

function QUEST_OBJ(stage: string): string {
  const map: Record<string, string> = {
    festival: 'Explore the festival; hang a lantern on the Lantern Tree',
    midnight: 'Find Captain Hale by the Lantern Tree',
    investigate: 'Gather leads, then search the cathedral (north gate)',
    cathedral: 'Find a way beneath the cathedral',
    undercroft: 'Find the source of the toll below',
    vault: 'Confront what rings the bell',
    heart: 'Approach the Heart of Aether',
  };
  return map[stage] ?? '';
}

void passivePerception;
