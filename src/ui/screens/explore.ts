import type { App, Screen } from '../app';
import { h, clear, toast, modal, bar, put } from '../dom';
import type { MapObject } from '../../data/maps/types';
import { tile } from '../../data/maps/tiles';
import { QUEST_BY_ID } from '../../data/quests';
import { ENCOUNTER_BY_ID } from '../../data/encounters';
import { COMPANION_BY_ID } from '../../data/companions';
import { CLASS_BY_ID } from '../../data/classes';
import { ITEM_BY_ID } from '../../data/items';
import {
  getMap, tileAt, isPassable, findPath, stepTo, visibleTiles, updateExplored, decodeExplored, objectsAt, isObjectKnown,
  lootContainer, attemptLock, disarmTrap, search, lighting, instability, knownTrapTiles, music, resolveList, activeGrid, type StepEvent,
} from '../../engine/exploration';
import { activeParty, addLog, clockString, mapRuntime, player, recordRoll, resonanceMax, hasItem } from '../../engine/state';
import { maybeBanter, maybeIdleRemark, fillName } from '../../engine/companionMind';
import { canShortRest, shortRest } from '../../engine/rest';
import { skillBonus, canLevelUp, passivePerception } from '../../engine/character';
import { skillCheck } from '../../rules/checks';
import { evalCond } from '../../engine/conditions';
import { saveGame } from '../../engine/save';
import { glow, lightingTint } from '../render/tiles';
import { createIsoView, isoPoint, isoTileAt, drawIsoGround, drawIsoProp, drawIsoHighlight, drawIsoToken, drawIsoBuilding, hasIsoProp, isoElevation, type IsoView } from '../render/isometric';
import { mapArchitecture } from '../render/mapArchitecture';
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
  private tileSize = 76;
  private panX = 0;
  private panY = 0;
  private showGrid = false;
  private drag: { x: number; y: number; ox: number; oy: number } | null = null;
  private actors = new Map<string, { x: number; y: number; facing: number }>();
  private lastFrameTime = 0;
  private hitActors: { x: number; y: number; w: number; h: number; tileX: number; tileY: number }[] = [];
  private bindPointerEvents: (() => void) | null = null;
  private removePointerEvents: (() => void) | null = null;
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
    this.canvas = h('canvas', { class: 'map-canvas', 'aria-label': 'Isometric exploration map. Click to walk or interact. Right-drag to pan; scroll to zoom.', role: 'img' });
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
        btn(t('hud.menu'), 'Esc', () => this.openMenu())),
      h('div', { class: 'board-controls panel' },
        h('span', { class: 'board-label' }, 'ISOMETRIC VIEW'),
        h('button', { class: 'icon-btn', title: 'Zoom out', 'aria-label': 'Zoom out', onclick: () => this.zoom(-8) }, '−'),
        h('button', { class: 'icon-btn', title: 'Zoom in', 'aria-label': 'Zoom in', onclick: () => this.zoom(8) }, '+'),
        h('button', { class: 'btn small ghost', title: 'Center on the party (Home)', onclick: () => this.centerCamera() }, 'Center'),
        h('button', { class: 'btn small ghost board-grid-toggle', title: 'Show or hide the movement grid (G)', onclick: () => this.toggleGrid(), 'aria-pressed': 'false' }, 'Grid')),
      h('div', { class: 'board-hint' }, 'Click to explore · Right-drag to look around · Scroll to zoom'));

    this.canvas.addEventListener('click', (e) => this.onClick(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMove(e));
    this.canvas.addEventListener('wheel', (e) => { e.preventDefault(); this.zoom(-Math.sign(e.deltaY) * 6, e.offsetX, e.offsetY); }, { passive: false });
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 1 || e.button === 2) { e.preventDefault(); this.drag = { x: e.clientX, y: e.clientY, ox: this.panX, oy: this.panY }; this.canvas.style.cursor = 'grabbing'; }
    });
    const dragMove = (e: MouseEvent) => {
      if (!this.drag) return;
      this.panX = this.drag.ox + e.clientX - this.drag.x;
      this.panY = this.drag.oy + e.clientY - this.drag.y;
    };
    const dragEnd = () => { this.drag = null; this.canvas.style.cursor = 'default'; };
    this.bindPointerEvents = () => {
      window.addEventListener('mousemove', dragMove);
      window.addEventListener('mouseup', dragEnd);
      this.removePointerEvents = () => { window.removeEventListener('mousemove', dragMove); window.removeEventListener('mouseup', dragEnd); };
    };
  }

  get s() { return this.app.state!; }

  mount(): void {
    // Exploration is reused after combat; reattach its document-level drag handlers.
    this.removePointerEvents?.();
    this.bindPointerEvents?.();
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

  unmount(): void { cancelAnimationFrame(this.raf); this.drag = null; this.removePointerEvents?.(); this.removePointerEvents = null; }

  onMapChanged(_first: boolean): void {
    this.trail = [];
    this.actors.clear();
    this.panX = 0; this.panY = 0;
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
    const mainId = Object.keys(s.quests).reverse().find((id) => s.quests[id].status === 'active' && QUEST_BY_ID[id]?.category === 'main');
    const obj = mainId ? (mainId === 'mq_bell' ? QUEST_OBJ(s.quests[mainId].stage) : shorten(QUEST_BY_ID[mainId].stages[s.quests[mainId].stage]?.objective ?? '')) : '';
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
    const dirs: Record<string, [number, number]> = { arrowup: [-1, -1], w: [-1, -1], arrowdown: [1, 1], s: [1, 1], arrowleft: [-1, 1], a: [-1, 1], arrowright: [1, -1], d: [1, -1], q: [-1, 0], e: [0, -1], z: [0, 1], x: [1, 0] };
    if (dirs[k]) { this.path = []; this.tryStep(this.s.location.x + dirs[k][0], this.s.location.y + dirs[k][1]); e.preventDefault(); return true; }
    switch (k) {
      case 'g': this.toggleGrid(); break;
      case 'home': this.centerCamera(); e.preventDefault(); break;
      case 'j': openJournal(this.app); break;
      case 'i': openInventory(this.app); break;
      case 'c': openCharacter(this.app); break;
      case 'p': openParty(this.app); break;
      case 'm': openWorldMap(this.app); break;
      case 'l': openDiceLog(this.app); break;
      case 'f': this.doSearch(); break;
      case 'r': this.doShortRest(); break;
      case 'k': if (this.canCamp()) openCamp(this.app); else toast('You cannot make camp here.', 'info'); break;
      case ' ': case 'enter': this.interactNearest(); break;
      case 'f5': e.preventDefault(); this.quicksave(); break;
      case 'f9': e.preventDefault(); this.app.load('quick'); break;
      case 'escape': this.openMenu(); break;
    }
  }

  private quicksave(): void {
    try { saveGame(this.s, 'quick'); toast('Quicksaved.', 'good'); } catch (err: any) { toast(`Save failed: ${err.message}`, 'bad'); }
  }

  private view(): IsoView {
    const v = createIsoView(this.canvas.clientWidth, this.canvas.clientHeight, this.camX, this.camY, this.tileSize, 26);
    v.originX += this.panX - (this.canvas.clientWidth > 1000 ? 40 : 0);
    v.originY += this.panY;
    return v;
  }

  private centerCamera(): void {
    this.panX = 0; this.panY = 0;
    this.camX = this.s.location.x; this.camY = this.s.location.y;
  }

  private toggleGrid(): void {
    this.showGrid = !this.showGrid;
    this.el.querySelector('.board-grid-toggle')?.setAttribute('aria-pressed', String(this.showGrid));
  }

  private zoom(delta: number, px?: number, py?: number): void {
    const before = this.view();
    const x = px ?? this.canvas.clientWidth / 2, y = py ?? this.canvas.clientHeight / 2;
    const u = (x - before.originX) / (before.tileWidth / 2), v = (y - before.originY) / (before.tileWidth / 4);
    const wx = (u + v) / 2, wy = (v - u) / 2;
    this.tileSize = Math.max(44, Math.min(132, this.tileSize + delta));
    const after = isoPoint(wx, wy, this.view());
    this.panX += x - after.x; this.panY += y - after.y;
  }

  private screenToTile(e: MouseEvent): { x: number; y: number } {
    const r = this.canvas.getBoundingClientRect();
    return isoTileAt(e.clientX - r.left, e.clientY - r.top, this.view());
  }

  private interactionTile(e: MouseEvent): { x: number; y: number } {
    const r = this.canvas.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
    // Painted miniatures extend above their base: clicking the body must select the same NPC.
    for (let i = this.hitActors.length - 1; i >= 0; i--) {
      const a = this.hitActors[i];
      if (px >= a.x - a.w / 2 && px <= a.x + a.w / 2 && py >= a.y - a.h && py <= a.y) return { x: a.tileX, y: a.tileY };
    }
    return this.screenToTile(e);
  }

  private onMove(e: MouseEvent): void {
    if (this.drag) return;
    this.hover = this.interactionTile(e);
    const m = getMap(this.s.location.mapId);
    const objs = objectsAt(this.s, m, this.hover.x, this.hover.y).filter((o) => isObjectKnown(this.s, m, o) && o.kind !== 'trigger' && o.kind !== 'encounter');
    this.canvas.style.cursor = objs.length ? 'pointer' : 'default';
    this.canvas.title = objs.map((o) => o.name).join(', ') || (this.isExplored(this.hover.x, this.hover.y) ? tile(tileAt(this.s, m, this.hover.x, this.hover.y)).name : '');
  }

  private onClick(e: MouseEvent): void {
    if (this.app.busy) return;
    const s = this.s;
    const m = getMap(s.location.mapId);
    const p = this.interactionTile(e);
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
        case 'exit': this.path = []; if (e.obj.to!.map === 'world') openWorldMap(this.app); else this.app.travel(e.obj.to!.map, e.obj.to!.x, e.obj.to!.y); return;
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
      case 'exit': if (o.to?.map === 'world') openWorldMap(this.app); else if (o.to) this.app.travel(o.to.map, o.to.x, o.to.y); break;
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

  canCamp(): boolean {
    const m = getMap(this.s.location.mapId);
    return this.s.location.mapId === 'inn' || (!!m.camp && evalCond(this.s, m.camp));
  }

  private openMenu(): void {
    modal('Menu', (close) => h('div', { class: 'col' },
      h('button', { class: 'btn', onclick: close }, 'Resume'),
      h('button', { class: 'btn', onclick: () => { close(); openSaveLoad(this.app, 'save'); } }, 'Save Game'),
      h('button', { class: 'btn', onclick: () => { close(); openSaveLoad(this.app, 'load'); } }, 'Load Game'),
      h('button', { class: 'btn', onclick: () => { close(); openSettings(this.app); } }, 'Settings'),
      this.canCamp() ? h('button', { class: 'btn', onclick: () => { close(); openCamp(this.app); } }, 'Make camp (K)') : null,
      h('button', { class: 'btn ghost', onclick: () => { close(); this.app.showMenu(); } }, 'Quit to Main Menu')));
  }

  // ─────────────────────── Rendering

  private draw(time: number): void {
    const state = this.s;
    if (!state) return;
    const cv = this.canvas, ctx = this.ctx;
    const width = cv.clientWidth, height = cv.clientHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(width * dpr) || cv.height !== Math.round(height * dpr)) { cv.width = Math.round(width * dpr); cv.height = Math.round(height * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    const backdrop = ctx.createRadialGradient(width * .5, height * .45, 40, width * .5, height * .5, Math.max(width, height));
    backdrop.addColorStop(0, '#202b32'); backdrop.addColorStop(.65, '#101820'); backdrop.addColorStop(1, '#070d13');
    ctx.fillStyle = backdrop; ctx.fillRect(0, 0, width, height);
    const m = getMap(state.location.mapId), grid = activeGrid(state, m);
    const tw = this.tileSize, view = this.view();
    const cols = grid[0].length, rows = grid.length;
    const bits = decodeExplored(mapRuntime(state, m.id).explored, cols * rows);
    const architecture = mapArchitecture(m, grid);
    const rt = mapRuntime(state, m.id);
    const layers: { depth: number; draw: () => void }[] = [];
    const late: (() => void)[] = [];
    const party = activeParty(state), positions = [state.location, ...this.trail.slice(0, party.length - 1)];
    // Spread a newly arrived party across nearby walkable squares until a trail exists.
    // These are visual follower positions; the exploration rules still use the leader.
    const occupied = new Set(positions.map(p => `${p.x},${p.y}`));
    const nearby = [[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
    while (positions.length < party.length) {
      const spot = nearby.map(([dx,dy]) => ({ x: state.location.x + dx, y: state.location.y + dy }))
        .find(p => !occupied.has(`${p.x},${p.y}`) && isPassable(state, m, p.x, p.y)
          && !objectsAt(state, m, p.x, p.y).some(o => o.kind === 'npc' && isObjectKnown(state, m, o)));
      const p = spot ?? { x: state.location.x, y: state.location.y };
      positions.push(p as typeof state.location); occupied.add(`${p.x},${p.y}`);
    }
    const dt = Math.min(60, this.lastFrameTime ? time - this.lastFrameTime : 16);
    this.lastFrameTime = time;
    const partyPoints: { x: number; y: number }[] = [];
    this.hitActors = [];
    for (let i = 0; i < party.length; i++) {
      const c = party[i], target = positions[i];
      const tx = target.x, ty = target.y;
      let a = this.actors.get(c.id);
      if (!a || Math.hypot(a.x - tx, a.y - ty) > 6) { a = { x: tx, y: ty, facing: 1 }; this.actors.set(c.id, a); }
      const dx = tx - a.x, dy = ty - a.y;
      if (Math.abs(dx - dy) > .01) a.facing = dx - dy < 0 ? -1 : 1;
      const ease = 1 - Math.exp(-dt / 50);
      a.x += dx * ease; a.y += dy * ease;
      const p = isoPoint(a.x, a.y, view);
      p.y -= isoElevation(tileAt(state, m, target.x, target.y), tw);
      partyPoints.push(p);
    }
    const foregroundFade = (px: number, py: number, high = tw * 1.3, wide = tw * .65) =>
      partyPoints.some(p => p.y < py + 4 && p.y > py - high && Math.abs(p.x - px) < wide) ? .34 : 1;

    const facadeDoors = new Set(architecture.buildings.flatMap(b => (b.doors ?? [])
      .filter(d => d.x === b.x + b.w - 1 || d.y === b.y + b.h - 1).map(d => d.y * cols + d.x)));
    const chestTiles = new Set(m.objects.filter(o => o.kind === 'container' && isObjectKnown(state, m, o))
      .map(o => o.y * cols + o.x));
    // All surfaces first, then interleave architecture and people by map depth.
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const k = y * cols + x;
      if (!bits[k]) continue;
      const p = isoPoint(x, y, view);
      if (p.x < -tw * 2 || p.x > width + tw * 2 || p.y < -tw || p.y > height + tw * 4) continue;
      const ch = tileAt(state, m, x, y), dim = !this.visible.has(k);
      drawIsoGround(ctx, ch, x, y, view, m.tileset, time, { dim, grid: this.showGrid });
      if (hasIsoProp(ch) && !architecture.covered.has(k) && !facadeDoors.has(k)) {
        const fade = foregroundFade(p.x, p.y, ch === 'T' || ch === 'L' ? tw * 2.2 : tw * 1.2);
        const prop = ch === 'c' && chestTiles.has(k) ? 'C' : ch;
        layers.push({ depth: x + y, draw: () => drawIsoProp(ctx, prop, x, y, view, m.tileset, time, { dim, fade }) });
      }
    }
    for (const b of architecture.buildings) {
      let seen = false;
      for (let yy = b.y; yy < b.y + b.h && !seen; yy++) for (let xx = b.x; xx < b.x + b.w; xx++) if (bits[yy * cols + xx]) { seen = true; break; }
      if (!seen) continue;
      const left = isoPoint(b.x, b.y + b.h, view), right = isoPoint(b.x + b.w, b.y, view), front = isoPoint(b.x + b.w - .5, b.y + b.h - .5, view), back = isoPoint(b.x, b.y, view);
      const fade = partyPoints.some(p => p.x > left.x - tw / 2 && p.x < right.x + tw / 2 && p.y <= front.y && p.y >= back.y - tw * 2) ? .30 : 1;
      layers.push({ depth: b.x + b.w - 1 + b.y + b.h - 1, draw: () => drawIsoBuilding(ctx, b, view, time, m.tileset, fade) });
    }
    if (this.path.length) {
      for (const p of this.path) drawIsoHighlight(ctx, p.x, p.y, view, 'rgba(239,197,119,.13)', 'rgba(243,206,142,.40)');
      ctx.beginPath();
      const start = isoPoint(state.location.x, state.location.y, view); ctx.moveTo(start.x, start.y);
      for (const step of this.path) { const p = isoPoint(step.x, step.y, view); ctx.lineTo(p.x, p.y); }
      ctx.strokeStyle = 'rgba(251,214,145,.72)'; ctx.setLineDash([3, 7]); ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
    }
    if (this.hover && this.hover.x >= 0 && this.hover.y >= 0 && this.hover.x < cols && this.hover.y < rows && bits[this.hover.y * cols + this.hover.x]) {
      drawIsoHighlight(ctx, this.hover.x, this.hover.y, view, 'rgba(236,209,152,.15)', 'rgba(255,230,178,.9)');
    }

    for (const o of m.objects) {
      if (!isObjectKnown(state, m, o) || o.kind === 'trigger' || o.kind === 'encounter' || !bits[o.y * cols + o.x]) continue;
      const visible = this.visible.has(o.y * cols + o.x), p = isoPoint(o.x, o.y, view);
      if (p.x < -tw * 2 || p.x > width + tw * 2 || p.y < -tw || p.y > height + tw * 3) continue;
      const elev = isoElevation(tileAt(state, m, o.x, o.y), tw);
      if (o.kind === 'npc' && visible) {
        layers.push({ depth: o.x + o.y + .08, draw: () => {
          drawIsoToken(ctx, p.x, p.y - elev, tw, npcColor(o), '', { npcId: o.id, role: o.name, time, selected: this.hover?.x === o.x && this.hover?.y === o.y });
          this.hitActors.push({ x: p.x, y: p.y - elev, w: tw * .64, h: tw * 1.12, tileX: o.x, tileY: o.y });
        } });
      } else if (o.kind === 'container' && !rt.removed.includes(o.id) && tileAt(state, m, o.x, o.y) !== 'c') {
        layers.push({ depth: o.x + o.y + .03, draw: () => drawIsoProp(ctx, 'C', o.x, o.y, view, m.tileset, time, { dim: !visible }) });
      } else if (o.kind === 'exit') {
        for (let yy = 0; yy < (o.h ?? 1); yy++) for (let xx = 0; xx < (o.w ?? 1); xx++)
          drawIsoHighlight(ctx, o.x + xx, o.y + yy, view, `rgba(112,196,216,${.13 + .05 * Math.sin(time / 650)})`, 'rgba(171,233,231,.64)');
        // A quiet doorway marker stays visible even when its facade faces away.
        if (visible) late.push(() => {
          const yy = p.y - elev - tw * .32;
          ctx.save(); ctx.strokeStyle = '#b6e4e9'; ctx.lineWidth = 1.6;
          ctx.fillStyle = 'rgba(13,33,43,.85)'; ctx.beginPath(); ctx.roundRect(p.x - 7, yy - 10, 14, 17, [6,6,1,1]); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(p.x - 3, yy); ctx.lineTo(p.x + 4, yy); ctx.lineTo(p.x + 1, yy - 3); ctx.moveTo(p.x + 4, yy); ctx.lineTo(p.x + 1, yy + 3); ctx.stroke(); ctx.restore();
        });
      } else if (o.kind === 'trap' && !rt.disarmed.includes(o.id)) {
        drawIsoHighlight(ctx, o.x, o.y, view, 'rgba(184,60,44,.28)', '#f6866c');
      } else if (o.kind === 'resonance' && visible) {
        layers.push({ depth: o.x + o.y + .1, draw: () => {
          glow(ctx, p.x, p.y - tw * .25, tw * .26, 'rgba(163,111,234,.40)');
          ctx.strokeStyle = '#d9b2ff'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(p.x, p.y - tw * .58); ctx.lineTo(p.x + tw * .11, p.y - tw * .35); ctx.lineTo(p.x, p.y - tw * .1); ctx.lineTo(p.x - tw * .11, p.y - tw * .35); ctx.closePath(); ctx.fillStyle = '#875bca'; ctx.fill(); ctx.stroke();
        } });
      }
      // Quiet visual markers replace floating question marks; names appear on hover.
      if (visible && ['inspect', 'lockedDoor', 'container'].includes(o.kind)) {
        late.push(() => {
          const y = p.y - elev - tw * .23;
          ctx.beginPath(); ctx.moveTo(p.x, y - 4); ctx.lineTo(p.x + 4, y); ctx.lineTo(p.x, y + 4); ctx.lineTo(p.x - 4, y); ctx.closePath();
          ctx.fillStyle = o.kind === 'lockedDoor' && !rt.opened.includes(o.id) ? '#f3be6e' : '#e8d9a4'; ctx.fill();
        });
      }
      if (visible && this.hover?.x === o.x && this.hover?.y === o.y) late.push(() => this.drawMapLabel(ctx, p.x, p.y - tw * (o.kind === 'npc' ? 1.12 : .65), o.name, width));
    }
    for (let i = 0; i < party.length; i++) {
      const c = party[i], a = this.actors.get(c.id)!, p = partyPoints[i];
      const hue = c.companionId ? COMPANION_BY_ID[c.companionId].hue : c.portrait.hue;
      layers.push({ depth: a.x + a.y + .12, draw: () => drawIsoToken(ctx, p.x, p.y, tw, `hsl(${hue},45%,62%)`, '', { character: c, selected: i === 0, dim: c.hp <= 0, time, facing: a.facing }) });
      const b = c.companionId ? this.bubbles.get(c.companionId) : undefined;
      if (b && b.until > performance.now()) late.push(() => this.drawBubble(ctx, p.x, p.y - tw * .95, b.text));
    }
    layers.sort((a, b) => a.depth - b.depth).forEach(l => l.draw());
    const tint = lightingTint(lighting(state, m));
    if (tint.alpha) {
      const p = isoPoint(state.location.x, state.location.y, view);
      const light = ctx.createRadialGradient(p.x, p.y, tw * .5, p.x, p.y, tw * 8);
      light.addColorStop(0, `rgba(${tint.color},${tint.alpha * .05})`); light.addColorStop(1, `rgba(${tint.color},${Math.min(.53, tint.alpha * .95)})`);
      ctx.fillStyle = light; ctx.fillRect(0, 0, width, height);
    }
    // Sparse fireflies for outdoor areas; deterministic positions, no gameplay RNG involved.
    if (['town', 'forest', 'ruins'].includes(m.tileset)) {
      for (let i = 0; i < 16; i++) {
        const x = ((i * 297.31 + time * .009) % (width + 40)) - 20;
        const y = ((i * 173.71) % height) + Math.sin(time / 1600 + i) * 7;
        ctx.globalAlpha = .12 + .16 * (1 + Math.sin(time / 1000 + i));
        ctx.fillStyle = i % 3 ? '#f8d58d' : '#b9d9db'; ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    late.forEach(draw => draw());
    const now = performance.now();
    this.floats = this.floats.filter(f => now - f.born < 1800);
    for (const f of this.floats) {
      const k = (now - f.born) / 1800, p = isoPoint(f.x, f.y, view);
      ctx.globalAlpha = 1 - k; ctx.fillStyle = f.color; ctx.font = `bold ${tw * .28}px Georgia, serif`; ctx.textAlign = 'center';
      ctx.fillText(f.text, p.x, p.y - tw * (.9 + k)); ctx.globalAlpha = 1;
    }
  }

  private drawMapLabel(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, width: number): void {
    ctx.save(); ctx.font = '13px Georgia, serif';
    const w = Math.min(width - 24, ctx.measureText(text).width + 26);
    x = Math.max(w / 2 + 12, Math.min(width - w / 2 - 12, x)); y = Math.max(80, y);
    ctx.fillStyle = 'rgba(12,20,27,.94)'; ctx.strokeStyle = '#ac8e58'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(x - w / 2, y - 23, w, 29, 3); ctx.fill(); ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#f6e8c8'; ctx.fillText(text, x, y - 8, w - 14); ctx.restore();
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

function shorten(t: string): string {
  return t.length > 90 ? `${t.slice(0, 88)}…` : t;
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
