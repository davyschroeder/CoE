import type { App, Screen } from '../app';
import { h, clear, toast, bar, modal } from '../dom';
import { Combat, dist, CONDITION_RULES, CONDITION_WORDS, type Combatant, type CombatEvent, type Target } from '../../engine/combat/combat';
import { aiStep } from '../../engine/combat/ai';
import { ACTION_BY_ID, type ActionDef } from '../../data/actions';
import { ITEM_BY_ID } from '../../data/items';
import { COMPANION_BY_ID } from '../../data/companions';
import { ENEMY_BY_ID } from '../../data/enemies';
import { tile } from '../../data/maps/tiles';
import { activeGrid } from '../../engine/exploration';
import { armorClass, spellSlotsMax, slotsAvailable, resourceLeft, speed } from '../../engine/character';
import { awardXp, addLog, addItem } from '../../engine/state';
import { bark } from '../../engine/companionMind';
import { glow } from '../render/tiles';
import {
  createIsoView, isoPoint, isoTileAt, isoElevation, drawIsoGround, drawIsoProp,
  drawIsoHighlight, drawIsoToken, drawIsoBuilding, hasIsoProp, type IsoView,
} from '../render/isometric';
import { mapArchitecture } from '../render/mapArchitecture';
import { walkToward, WALK_MS_PER_TILE, COMBAT_WALK_MS } from '../render/motion';
import { charPortrait } from '../portraits';
import { settings, cpuDelay } from '../../core/settings';
import { playMusic, sfx } from '../../audio/audio';
import { sleep } from '../dom';
import { openParty } from './party';
import { t } from '../../i18n/index';

interface FloatText { x: number; y: number; text: string; color: string; born: number; big?: boolean; }
interface Flash { tiles: { x: number; y: number }[]; color: string; born: number; }
interface Strike { from: { x: number; y: number }; to: { x: number; y: number }; born: number; hit: boolean; crit: boolean; }

export class CombatScreen implements Screen {
  el: HTMLElement;
  cb: Combat;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private timeline: HTMLElement;
  private actionBar: HTMLElement;
  private partyBox: HTMLElement;
  private logBox: HTMLElement;
  private info: HTMLElement;
  private ts = 64;
  private view: IsoView = { tileWidth: 64, originX: 0, originY: 0 };
  private cameraX = 0;
  private cameraY = 0;
  private zoom = 1;
  private panX = 0;
  private panY = 0;
  private gridVisible = true;
  private drag: { x: number; y: number; panX: number; panY: number } | null = null;
  private suppressClick = false;
  private lastFrame = 0;
  private actionReserve = 190;
  private strikes: Strike[] = [];
  private impactUntil = new Map<string, number>();
  private tools: HTMLElement;
  private raf = 0;
  private disp = new Map<string, { x: number; y: number; queue: { x: number; y: number }[] }>();
  private floats: FloatText[] = [];
  private flashes: Flash[] = [];
  private selected: ActionDef | null = null;
  private slotLevel = 0;
  private hover: { x: number; y: number } | null = null;
  private running = false;
  private done = false;
  private reachCache: Map<string, any> | null = null;
  private pathPreview: { key: string; path: { x: number; y: number }[] | null; provokes: boolean } | null = null;

  constructor(private app: App, encounterId: string, ambush: 'party' | 'enemy' | undefined, private onDone: (r: 'victory' | 'defeat' | 'fled') => void) {
    this.cb = new Combat(app.state!, encounterId, { ambush });
    this.canvas = h('canvas', { class: 'combat-canvas' });
    this.ctx = this.canvas.getContext('2d')!;
    this.timeline = h('div', { class: 'cb-timeline panel' });
    this.actionBar = h('div', { class: 'cb-actions panel' });
    this.partyBox = h('div', { class: 'cb-party' });
    this.logBox = h('div', { class: 'cb-log panel' });
    this.info = h('div', { class: 'cb-info panel' });
    const frame = this.boardFrame();
    this.cameraX = frame.centerX; this.cameraY = frame.centerY;
    this.tools = h('div', { class: 'battle-tools panel', 'aria-label': 'Battlefield camera' },
      h('div', { class: 'battle-tools-label' }, 'BATTLEFIELD'),
      h('button', { class: 'icon-btn', title: 'Zoom out (−)', 'aria-label': 'Zoom out', onclick: () => this.changeZoom(0.83) }, '−'),
      h('button', { class: 'icon-btn', title: 'Zoom in (+)', 'aria-label': 'Zoom in', onclick: () => this.changeZoom(1.2) }, '+'),
      h('button', { class: 'btn small ghost', title: 'Fit the whole encounter (Home)', onclick: () => this.fitBattle() }, 'Fit'),
      h('button', { class: 'btn small ghost', title: 'Focus the current combatant (F)', onclick: () => this.focusCurrent() }, 'Focus'),
      h('button', { class: 'btn small ghost battle-grid-toggle', title: 'Show or hide the grid (G)', 'aria-pressed': 'true', onclick: () => this.toggleGrid() }, 'Grid'),
      h('div', { class: 'battle-tools-hint' }, 'Scroll to zoom · Shift-drag to pan'));
    this.el = h('div', { class: 'screen combat isometric-combat' }, this.canvas,
      h('div', { class: 'battle-heading' }, h('span', { class: 'battle-overline' }, 'TACTICAL ENCOUNTER'), h('div', null, this.cb.encounter.name)),
      this.timeline, this.partyBox, this.logBox, this.info, this.actionBar, this.tools);
    this.canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
    this.canvas.addEventListener('pointerdown', (e) => {
      if (e.button !== 1 && !(e.button === 0 && e.shiftKey)) return;
      e.preventDefault();
      this.drag = { x: e.clientX, y: e.clientY, panX: this.panX, panY: this.panY };
      this.suppressClick = true;
      this.canvas.setPointerCapture(e.pointerId);
      this.canvas.style.cursor = 'grabbing';
    });
    const stopDrag = (e: PointerEvent) => {
      this.drag = null;
      if (this.canvas.hasPointerCapture(e.pointerId)) this.canvas.releasePointerCapture(e.pointerId);
      this.canvas.style.cursor = 'default';
      setTimeout(() => { this.suppressClick = false; }, 0);
    };
    this.canvas.addEventListener('pointerup', stopDrag);
    this.canvas.addEventListener('pointercancel', stopDrag);
    this.canvas.addEventListener('pointerleave', () => { if (!this.drag) { this.hover = null; this.renderInfo(); } });
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const r = this.canvas.getBoundingClientRect();
      this.changeZoom(e.deltaY < 0 ? 1.1 : 1 / 1.1, { x: e.clientX - r.left, y: e.clientY - r.top });
    }, { passive: false });
    this.canvas.addEventListener('click', (e) => this.onClick(e));
    this.canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); this.selected = null; this.renderActions(); });
    for (const c of this.cb.combatants) this.disp.set(c.id, { x: c.x, y: c.y, queue: [] });
  }

  mount(): void {
    playMusic(this.cb.encounter.music ?? 'combat');
    this.consume(this.cb.flush());
    const first = this.cb.combatants.find((c) => c.side === 'party' && c.char.companionId);
    if (first) { const b = bark(this.app.state!, first.char.companionId!, 'start'); if (b) this.barkFloat(first, b); }
    const loop = (time: number) => { this.draw(time); this.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
    this.renderAll();
    this.advance();
  }

  unmount(): void { cancelAnimationFrame(this.raf); }

  onKey(e: KeyboardEvent): boolean | void {
    const k = e.key.toLowerCase();
    if (k === 'home') { this.fitBattle(); e.preventDefault(); return true; }
    if (k === 'f') { this.focusCurrent(); e.preventDefault(); return true; }
    if (k === 'g') { this.toggleGrid(); e.preventDefault(); return true; }
    if (k === '+' || k === '=') { this.changeZoom(1.15); e.preventDefault(); return true; }
    if (k === '-' || k === '_') { this.changeZoom(1 / 1.15); e.preventDefault(); return true; }
    if (e.key === 'Escape') { this.selected = null; this.renderActions(); return true; }
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (this.isPlayerTurn()) this.endTurn(); return true; }
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 9 && this.isPlayerTurn()) {
      const btns = this.actionBar.querySelectorAll<HTMLButtonElement>('.act:not([disabled])');
      btns[n - 1]?.click();
    }
  }

  private get cur(): Combatant { return this.cb.current(); }
  private isPlayerTurn(): boolean { return !this.cb.over && this.cur.char.kind === 'player' && this.cur.char.hp > 0 && !this.running; }

  // ─────────────────────── Turn driver

  private async advance(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      while (!this.cb.over) {
        const c = this.cur;
        this.renderAll();
        if (c.char.kind === 'player' && c.char.hp > 0 && (c.action || c.bonus || c.movement > 0 || c.attacksLeft > 0)) break;
        if (c.char.kind === 'player') {
          // Player is down or has nothing left to do.
          if (c.char.hp > 0 && !settings().autoEndTurn) break;
          await sleep(c.char.hp > 0 ? 200 : 600);
          this.consume(this.cb.endTurn());
          continue;
        }
        // CPU turn (companion or enemy)
        await sleep(cpuDelay() * 0.6);
        for (let i = 0; i < 14 && !this.cb.over; i++) {
          if (c.char.hp <= 0) break;
          const ev = aiStep(this.cb, c);
          if (!ev) break;
          this.consume(ev);
          this.renderAll();
          await sleep(cpuDelay());
          await this.waitAnim();
        }
        if (this.cb.over) break;
        this.consume(this.cb.endTurn());
      }
    } finally {
      this.running = false;
    }
    this.renderAll();
    if (this.cb.over) this.finish();
  }

  private waitAnim(): Promise<void> {
    return new Promise((res) => {
      const check = () => { if ([...this.disp.values()].every((d) => !d.queue.length) || cpuDelay() === 0) res(); else setTimeout(check, 30); };
      check();
    });
  }

  private endTurn(): void {
    this.selected = null;
    this.consume(this.cb.endTurn());
    this.advance();
  }

  private finish(): void {
    if (this.done) return;
    this.done = true;
    const s = this.app.state!;
    const r = this.cb.over!;
    if (r === 'victory') {
      const ready = awardXp(s, this.cb.xpEarned);
      sfx('levelup');
      const loot = this.cb.goldLoot;
      if (loot) s.gold += loot;
      const drops = this.cb.loot.map((l) => { addItem(s, l.itemId, l.qty); return `${ITEM_BY_ID[l.itemId]?.name ?? l.itemId}${l.qty > 1 ? ` ×${l.qty}` : ''}`; });
      addLog(s, 'system', `Victory: +${this.cb.xpEarned} XP${loot ? `, ${loot} gold` : ''}${drops.length ? `; found ${drops.join(', ')}` : ''}.`);
      modal('Victory', (close) => h('div', { class: 'narration' },
        h('p', null, `${this.cb.encounter.name} — the battle is won.`),
        h('p', null, `Experience: +${this.cb.xpEarned} XP each${loot ? ` · Gold: +${loot}` : ''}`),
        drops.length ? h('p', null, `Spoils: ${drops.join(', ')}`) : null,
        ready.length ? h('p', { class: 'good' }, `${ready.join(', ')} can level up!`) : null,
        h('button', { class: 'btn', onclick: () => { close(); } }, 'Continue')), { onClose: () => this.onDone('victory') });
    } else if (r === 'defeat') {
      if (this.cb.encounter.nonlethal) {
        modal('Beaten', (close) => h('div', { class: 'narration' }, h('p', null, 'You lose the brawl — bruised, but alive.'), h('button', { class: 'btn', onclick: close }, 'Continue')), { onClose: () => this.onDone('defeat') });
      } else this.onDone('defeat');
    } else this.onDone('fled');
  }

  // ─────────────────────── Events → visuals

  private consume(events: CombatEvent[]): void {
    const s = this.app.state!;
    for (const e of events) {
      switch (e.type) {
        case 'move': { const d = this.disp.get(e.id); if (d) d.queue.push(...e.path); break; }
        case 'attack': {
          const t = this.cb.get(e.targetId);
          if (t) this.floats.push({ x: t.x, y: t.y, text: e.hit ? (e.crit ? 'CRIT!' : '') : 'miss', color: e.crit ? '#ffd24a' : '#cfd6e6', born: performance.now(), big: e.crit });
          sfx(e.hit ? (e.crit ? 'crit' : 'hit') : 'miss');
          const a = this.cb.get(e.attackerId);
          if (a && t) {
            this.strikes.push({ from: { x: a.x, y: a.y }, to: { x: t.x, y: t.y }, born: performance.now(), hit: e.hit, crit: e.crit });
            if (e.hit) this.impactUntil.set(t.id, performance.now() + 260);
          }
          if (a?.char.companionId && e.crit) { const b = bark(s, a.char.companionId, 'crit'); if (b) this.barkFloat(a, b); }
          if (a?.char.companionId && !e.hit && Math.random() < 0.3) { const b = bark(s, a.char.companionId, 'miss'); if (b) this.barkFloat(a, b); }
          break;
        }
        case 'damage': {
          const t = this.cb.get(e.targetId);
          if (t && e.amount > 0) this.floats.push({ x: t.x, y: t.y, text: `-${e.amount}${e.note ? ` (${e.note})` : ''}`, color: '#ff6b5a', born: performance.now() + 120 });
          if (t?.char.companionId && t.char.hp > 0 && t.char.hp < t.char.maxHp * 0.3 && Math.random() < 0.5) { const b = bark(s, t.char.companionId, 'lowHp'); if (b) this.barkFloat(t, b); }
          break;
        }
        case 'heal': { const t = this.cb.get(e.targetId); if (t) this.floats.push({ x: t.x, y: t.y, text: `+${e.amount}`, color: '#7fe07f', born: performance.now() }); sfx('heal'); break; }
        case 'aoe': this.flashes.push({ tiles: e.tiles, color: e.color, born: performance.now() }); sfx(e.actionId === 'explosion' ? 'explosion' : 'spell'); break;
        case 'explosion': sfx('explosion'); break;
        case 'down': {
          const t = this.cb.get(e.targetId);
          sfx('down');
          if (t?.side === 'enemy') {
            const killer = this.cb.combatants.find((c) => c.side === 'party' && c.char.companionId && c.id === this.cb.current().id);
            if (killer) { const b = bark(s, killer.char.companionId!, 'kill'); if (b) this.barkFloat(killer, b); }
          } else if (t) {
            const friend = this.cb.alive('party').find((c) => c.char.companionId && c.id !== t.id);
            if (friend) { const b = bark(s, friend.char.companionId!, 'allyDown'); if (b) this.barkFloat(friend, b); }
          }
          break;
        }
        case 'spawn': { const c = this.cb.get(e.id); if (c) this.disp.set(c.id, { x: c.x, y: c.y, queue: [] }); break; }
        case 'text': {
          if (e.kind === 'phase') toast(e.text, 'quest', 4500);
          break;
        }
        case 'save': break;
        case 'condition': break;
      }
    }
    this.reachCache = null;
    this.pathPreview = null;
    this.renderLog();
  }

  private barkFloat(c: Combatant, raw: string): void {
    const text = raw.trim().replace(/^["“]+|["”]+$/g, '');
    addLog(this.app.state!, 'speech', text, c.char.name);
    this.floats.push({ x: c.x, y: c.y - 0.6, text: `“${text.length > 60 ? text.slice(0, 58) + '…' : text}”`, color: '#f4e7c4', born: performance.now() });
  }

  // ─────────────────────── Player input

  private toTile(e: MouseEvent): { x: number; y: number } {
    const r = this.canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    // Creature art rises above its tile. Clicking the visible body must still target
    // that creature, rather than the square behind its head in isometric space.
    if (!this.selected?.area && this.selected?.target !== 'point') {
      const candidates = this.cb.combatants.filter((c) => !c.removed || c.side === 'party')
        .sort((a, b) => { const pa = this.disp.get(a.id) ?? a, pb = this.disp.get(b.id) ?? b; return (pb.x + pb.y) - (pa.x + pa.y); });
      for (const c of candidates) {
        const d = this.disp.get(c.id) ?? c;
        const p = isoPoint(d.x, d.y, this.view);
        const feet = p.y - isoElevation(this.cb.tileChar(c.x, c.y), this.ts);
        const half = this.ts * (c.char.creatureType === 'dragon' ? 0.43 : 0.27);
        if (Math.abs(x - p.x) < half && y < feet + this.ts * 0.12 && y > feet - this.ts * 0.91) return { x: c.x, y: c.y };
      }
      for (const obj of [...(this.cb.objects ?? [])].filter(o => !o.destroyed).sort((a, b) => b.x + b.y - a.x - a.y)) {
        const p = isoPoint(obj.x, obj.y, this.view);
        const height = this.ts * (obj.kind === 'barrel' ? .43 : .78);
        if (Math.abs(x - p.x) < this.ts * .22 && y < p.y + this.ts * .1 && y > p.y - height) return { x: obj.x, y: obj.y };
      }
    }
    return isoTileAt(x, y, this.view);
  }

  private onPointerMove(e: PointerEvent): void {
    if (this.drag) {
      this.panX = this.drag.panX + e.clientX - this.drag.x;
      this.panY = this.drag.panY + e.clientY - this.drag.y;
      this.layoutView();
      return;
    }
    const p = this.toTile(e);
    if (p.x !== this.hover?.x || p.y !== this.hover?.y) { this.hover = p; this.renderInfo(); }
    const occ = this.cb.combatants.find((c) => !c.removed && c.x === p.x && c.y === p.y);
    this.canvas.style.cursor = this.cb.inBounds(p.x, p.y) ? (occ || this.selected ? 'crosshair' : 'pointer') : 'default';
  }

  private layoutView(): void {
    const width = this.canvas.clientWidth, height = this.canvas.clientHeight;
    const frame = this.boardFrame();
    const compact = width < 1000;
    const left = compact ? 145 : 260, right = compact ? 215 : 350;
    this.actionReserve = Math.max(this.actionReserve, this.actionBar.offsetHeight);
    const bottom = Math.min(height * 0.4, Math.max(160, this.actionReserve + 30));
    const usableW = Math.max(320, width - left - right - 38);
    const usableH = Math.max(230, height - bottom - 144);
    const fit = Math.min(88, Math.max(22, Math.min(usableW / frame.spanX, usableH / frame.spanY)));
    this.ts = Math.min(128, Math.max(22, fit * this.zoom));
    this.view = createIsoView(width, height, this.cameraX, this.cameraY, this.ts);
    this.view.originX += (left - right) / 2 + this.panX;
    this.view.originY += (100 - bottom) / 2 + 22 + this.panY;
  }

  /** Fit complete edge buildings and their roofs, without enlarging playable bounds. */
  private boardFrame() {
    const b = this.cb.bounds, grid = activeGrid(this.app.state!, this.cb.map);
    const architecture = mapArchitecture(this.cb.map, grid);
    const buildings = architecture.buildings.filter((r) => r.x <= b.x1 && r.y <= b.y1 && r.x + r.w - 1 >= b.x0 && r.y + r.h - 1 >= b.y0);
    const bounds = { ...b };
    for (const r of buildings) {
      bounds.x0 = Math.min(bounds.x0, r.x); bounds.y0 = Math.min(bounds.y0, r.y);
      bounds.x1 = Math.max(bounds.x1, r.x + r.w - 1); bounds.y1 = Math.max(bounds.y1, r.y + r.h - 1);
    }
    const unit: IsoView = { tileWidth: 1, originX: 0, originY: 0 };
    const corners = [isoPoint(bounds.x0 - .5, bounds.y0 - .5, unit), isoPoint(bounds.x1 + .5, bounds.y0 - .5, unit),
      isoPoint(bounds.x1 + .5, bounds.y1 + .5, unit), isoPoint(bounds.x0 - .5, bounds.y1 + .5, unit)];
    const minX = Math.min(...corners.map(p => p.x)), maxX = Math.max(...corners.map(p => p.x));
    let minY = Math.min(...corners.map(p => p.y)) - 1.35;
    const maxY = Math.max(...corners.map(p => p.y)) + .18;
    for (const r of buildings) {
      const wall = r.id.includes('mill') ? 1.75 : Math.min(1.35, .85 + Math.min(r.w, r.h) * .075);
      const roof = .65 + Math.min(r.w, r.h) * .09;
      const ridge = isoPoint(r.x - .5, r.y - .5 + r.h / 2, unit);
      minY = Math.min(minY, ridge.y - wall - roof - .3);
    }
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    return { bounds, grid, architecture, buildings, spanX: maxX - minX, spanY: maxY - minY,
      centerX: cx + 2 * cy, centerY: 2 * cy - cx };
  }

  private changeZoom(multiplier: number, pointer?: { x: number; y: number }): void {
    this.layoutView();
    // Keep the exact fractional world point under the cursor; rounding to a cell
    // centre makes successive wheel steps drift near diamond edges.
    const u = pointer ? (pointer.x - this.view.originX) / this.ts : 0;
    const v = pointer ? (pointer.y - this.view.originY) / this.ts : 0;
    const anchor = pointer ? { x: u + 2 * v, y: 2 * v - u } : null;
    const before = anchor ? isoPoint(anchor.x, anchor.y, this.view) : null;
    this.zoom = Math.min(3.5, Math.max(0.55, this.zoom * multiplier));
    this.layoutView();
    if (anchor && before) {
      const after = isoPoint(anchor.x, anchor.y, this.view);
      this.panX += before.x - after.x; this.panY += before.y - after.y;
      this.layoutView();
    }
  }

  private fitBattle(): void {
    const frame = this.boardFrame();
    this.cameraX = frame.centerX; this.cameraY = frame.centerY;
    this.zoom = 1; this.panX = 0; this.panY = 0; this.layoutView();
  }

  private focusCurrent(): void {
    this.cameraX = this.cur.x; this.cameraY = this.cur.y;
    this.panX = 0; this.panY = 0;
    this.zoom = Math.max(1.25, this.zoom); this.layoutView();
  }

  private toggleGrid(): void {
    this.gridVisible = !this.gridVisible;
    this.tools.querySelector('.battle-grid-toggle')?.setAttribute('aria-pressed', String(this.gridVisible));
  }

  private reach(): Map<string, any> {
    if (!this.reachCache) this.reachCache = this.cb.reachable(this.cur);
    return this.reachCache;
  }

  private onClick(e: MouseEvent): void {
    if (this.suppressClick || e.shiftKey) { this.suppressClick = false; return; }
    if (!this.isPlayerTurn()) return;
    const p = this.toTile(e);
    if (!this.cb.inBounds(p.x, p.y)) return;
    const c = this.cur;
    const a = this.selected;
    try {
      if (a) {
        const target = this.resolveTarget(a, p);
        if (!target) { toast('Invalid target.', 'bad', 1500); return; }
        this.consume(this.cb.perform(c, a.id, target, { slotLevel: this.slotLevel || undefined }));
        if (a.id !== 'attack' || c.attacksLeft <= 0) this.selected = null;
        this.afterPlayerAction();
        return;
      }
      // Click an enemy: attack with default attack if in range; click tile: move.
      const occ = this.cb.occupant(p.x, p.y);
      if (occ && occ.side === 'enemy' && occ.char.hp > 0) {
        const atk = ACTION_BY_ID.attack;
        if (this.cb.canUse(c, atk).ok && this.cb.isTargetable(c, atk, occ)) {
          this.consume(this.cb.perform(c, 'attack', { id: occ.id }));
          this.afterPlayerAction();
        } else toast('Out of reach. Move closer or choose another action.', 'info', 1800);
        return;
      }
      const r = this.reach().get(`${p.x},${p.y}`);
      if (r && (p.x !== c.x || p.y !== c.y)) {
        const path = this.cb.pathTo(c, p.x, p.y);
        if (path) {
          const prov = this.cb.provokers(c, path);
          if (prov.length && !confirm(`Moving there provokes ${prov.length} opportunity attack(s) from ${prov.map((x) => x.char.name).join(', ')}. Move anyway?`)) return;
          this.consume(this.cb.moveAlong(c, path));
          this.afterPlayerAction();
        }
      }
    } catch (err: any) {
      toast(err.message ?? String(err), 'bad', 2000);
    }
  }

  private resolveTarget(a: ActionDef, p: { x: number; y: number }): Target | null {
    const c = this.cur;
    if (a.target === 'self' && !a.area) return undefined as any;
    if (a.target === 'point' || (a.area && a.area.fromSelf)) {
      if (a.area?.fromSelf && a.area.shape === 'radius') return { x: c.x, y: c.y };
      if (a.special === 'teleport') return p;
      return p;
    }
    const occ = this.cb.occupant(p.x, p.y) ?? this.cb.combatants.find((x) => x.x === p.x && x.y === p.y);
    if (occ && this.cb.isTargetable(c, a, occ)) return { id: occ.id };
    const obj = this.cb.objectAt(p.x, p.y);
    if (obj && this.cb.objectTargets(c, a).includes(obj)) return { id: obj.id };
    return null;
  }

  private afterPlayerAction(): void {
    this.reachCache = null;
    this.pathPreview = null;
    this.renderAll();
    if (this.cb.over) { this.finish(); return; }
    const c = this.cur;
    if (c.char.kind !== 'player' || c.char.hp <= 0) { this.advance(); return; }
    if (settings().autoEndTurn && !c.action && !c.bonus && c.movement <= 0 && c.attacksLeft <= 0) this.endTurn();
  }

  private chooseAction(a: ActionDef): void {
    const c = this.cur;
    if (!this.cb.canUse(c, a).ok) return;
    sfx('click');
    const needsTarget = !(a.target === 'self' && !a.area) && !(a.area?.fromSelf && a.area.shape === 'radius');
    this.slotLevel = a.kind === 'spell' && (a.level ?? 0) > 0 ? this.slotLevel : 0;
    if (!needsTarget) {
      try {
        this.consume(this.cb.perform(c, a.id, a.area ? { x: c.x, y: c.y } : undefined));
        this.afterPlayerAction();
      } catch (e: any) { toast(e.message, 'bad'); }
      return;
    }
    this.selected = this.selected?.id === a.id ? null : a;
    this.renderActions();
  }

  // ─────────────────────── HUD

  private renderAll(): void {
    this.renderTimeline(); this.renderParty(); this.renderActions(); this.renderLog(); this.renderInfo();
  }

  private renderTimeline(): void {
    clear(this.timeline);
    this.timeline.append(h('div', { class: 'round' }, t('combat.round', { n: this.cb.round })));
    this.cb.order.forEach((id, i) => {
      const c = this.cb.get(id)!;
      if (c.removed && c.side === 'enemy') return;
      const hideHp = settings().hideEnemyHp && c.side === 'enemy';
      this.timeline.append(h('div', { class: `tl ${i === this.cb.turnIndex ? 'now' : ''} ${c.side} ${c.char.hp <= 0 ? 'down' : ''}`, 'data-tip': `${c.char.name} — initiative ${Math.floor(c.initiative)}` },
        h('div', { class: 'tl-portrait', html: charPortrait(c.char, 36) }),
        hideHp ? null : h('div', { class: 'tl-hp', style: { width: `${Math.max(0, c.char.hp / c.char.maxHp) * 100}%` } })));
    });
  }

  private renderParty(): void {
    clear(this.partyBox);
    for (const c of this.cb.combatants.filter((x) => x.side === 'party')) {
      const ch = c.char;
      this.partyBox.append(h('div', { class: `pcard ${c.id === this.cur.id ? 'now' : ''} ${ch.hp <= 0 ? 'down' : ''}` },
        h('div', { class: 'pc-portrait', html: charPortrait(ch, 44) }),
        h('div', { class: 'pc-info' },
          h('div', { class: 'pc-name' }, ch.name.split(' ')[0], h('span', { class: 'muted' }, ` AC ${armorClass(ch)}`)),
          bar(ch.hp, ch.maxHp, 'hp', `${ch.hp}/${ch.maxHp}${ch.tempHp ? ` +${ch.tempHp}` : ''}`),
          ch.hp <= 0 && !ch.dead ? h('div', { class: 'ds' }, `Death saves ✓${ch.deathSaves.successes} ✗${ch.deathSaves.failures}${ch.stable ? ' (stable)' : ''}`) : null,
          h('div', { class: 'conds' }, ch.conditions.filter((k) => k.id !== 'disengaged').map((k) => h('span', { class: 'cond', 'data-tip': `${CONDITION_WORDS[k.id] ?? k.id}: ${CONDITION_RULES[k.id] ?? ''}${k.duration > 0 ? ` (${k.duration} rd)` : ''}` }, k.id))))));
    }
    this.partyBox.append(h('button', { class: 'btn small ghost', 'data-tip': 'Give strategic orders to your companions', onclick: () => openParty(this.app, () => this.renderAll()) }, '⚑ Orders'));
  }

  private renderActions(): void {
    clear(this.actionBar);
    const c = this.cur;
    if (!this.isPlayerTurn()) {
      this.actionBar.append(h('div', { class: 'cpu-turn' }, this.cb.over ? '' : `${c.char.name} is acting…`));
      return;
    }
    const ch = c.char;
    const econ = h('div', { class: 'econ' },
      h('span', { class: `pip ${c.action || c.attacksLeft > 0 ? 'on' : ''}`, 'data-tip': 'Action' }, 'Action'),
      h('span', { class: `pip ${c.bonus ? 'on' : ''}`, 'data-tip': 'Bonus action' }, 'Bonus'),
      h('span', { class: `pip ${c.reaction ? 'on' : ''}`, 'data-tip': 'Reaction (opportunity attacks, Shield...) — used automatically' }, 'Reaction'),
      h('span', { class: 'mv', 'data-tip': 'Movement remaining (squares of 5 ft)' }, `Move ${c.movement}/${speed(ch)}`),
      c.attacksLeft > 0 ? h('span', { class: 'mv' }, `Attacks left: ${c.attacksLeft}`) : null);
    const max = spellSlotsMax(ch);
    const slots = max.some((n) => n > 0) ? h('div', { class: 'slots' }, 'Slots: ', ...max.map((n, lvl) => n ? h('span', { class: `slot ${this.slotLevel === lvl ? 'sel' : ''}`, 'data-tip': `Level ${lvl} slots — click to upcast`, onclick: () => { this.slotLevel = this.slotLevel === lvl ? 0 : lvl; this.renderActions(); } }, `L${lvl} ${slotsAvailable(ch, lvl)}/${n}`) : null)) : null;
    const groups: Record<string, HTMLElement[]> = { Actions: [], Bonus: [], Spells: [] };
    let idx = 1;
    for (const a of this.cb.actionsFor(c)) {
      if (a.cost === 'reaction') continue;
      const can = this.cb.canUse(c, a);
      const res = a.resource ? ` (${resourceLeft(ch, a.resource.id)})` : '';
      const lvl = a.kind === 'spell' ? (a.level ? ` L${a.level}` : ' ∞') : '';
      const b = h('button', { class: `act ${this.selected?.id === a.id ? 'sel' : ''} cost-${a.cost}`, disabled: !can.ok, 'data-tip': `${a.name} [${a.cost}${a.range > 1 ? `, range ${a.range}` : ''}]: ${a.desc}${can.ok ? '' : ` — ${can.reason}`}`, onclick: () => this.chooseAction(a) },
        can.ok && idx <= 9 ? h('span', { class: 'k' }, String(idx++)) : null, a.name + lvl + res);
      (a.kind === 'spell' ? groups.Spells : a.cost === 'bonus' ? groups.Bonus : groups.Actions).push(b);
    }
    const potions = this.app.state!.inventory.filter((i) => ITEM_BY_ID[i.itemId]?.use && ITEM_BY_ID[i.itemId].use!.kind !== 'resonance');
    const items = potions.map((st) => h('button', { class: 'act item', disabled: !this.cb.canUseItem(c), 'data-tip': ITEM_BY_ID[st.itemId].desc, onclick: () => this.useItemFlow(st.itemId) }, `${ITEM_BY_ID[st.itemId].name} ×${st.qty}`));
    this.actionBar.append(
      h('div', { class: 'ab-head' }, h('b', null, `${ch.name}'s turn`), econ, slots),
      h('div', { class: 'ab-groups' },
        ...Object.entries(groups).filter(([, v]) => v.length).map(([k, v]) => h('div', { class: 'ab-group' }, h('div', { class: 'ab-label' }, k), h('div', { class: 'ab-btns' }, v))),
        items.length ? h('div', { class: 'ab-group' }, h('div', { class: 'ab-label' }, 'Items'), h('div', { class: 'ab-btns' }, items)) : null),
      h('div', { class: 'ab-end' },
        this.selected ? h('div', { class: 'hint' }, `Select a target for ${this.selected.name} (right-click to cancel)`) : h('div', { class: 'hint' }, 'Click a square to move, an enemy to attack.'),
        this.cb.canFlee() ? h('button', { class: 'btn ghost', onclick: () => { if (confirm('Retreat from this fight?')) { this.cb.flee(); this.finish(); } } }, t('combat.flee')) : null,
        h('button', { class: 'btn', onclick: () => this.endTurn() }, `${t('combat.endTurn')} (Space)`)));
  }

  private useItemFlow(itemId: string): void {
    const c = this.cur;
    const adj = this.cb.combatants.filter((x) => x.side === 'party' && !x.char.dead && dist(x, c) <= 1);
    const def = ITEM_BY_ID[itemId];
    const go = (id?: string) => { try { this.consume(this.cb.useItem(c, itemId, id)); this.afterPlayerAction(); } catch (e: any) { toast(e.message, 'bad'); } };
    if (def.use?.kind === 'heal' && adj.length > 1) {
      modal(`Use ${def.name}`, (close) => h('div', { class: 'col' }, adj.map((x) => h('button', { class: 'btn', onclick: () => { close(); go(x.id); } }, `${x.char.name} (${x.char.hp}/${x.char.maxHp})`))));
    } else go();
  }

  private renderLog(): void {
    const s = this.app.state!;
    clear(this.logBox);
    for (const e of s.log.filter((l) => l.kind === 'combat' || l.kind === 'speech').slice(-16)) {
      this.logBox.append(h('div', { class: `ll ${e.kind}` }, e.speaker ? h('b', null, e.speaker.split(' ')[0] + ': ') : null, e.text));
    }
    this.logBox.scrollTop = this.logBox.scrollHeight;
  }

  private renderInfo(): void {
    clear(this.info);
    if (!this.hover || !this.cb.inBounds(this.hover.x, this.hover.y)) return;
    const occ = this.cb.combatants.find((c) => !c.removed && c.x === this.hover!.x && c.y === this.hover!.y);
    const obj = this.cb.objectAt(this.hover.x, this.hover.y);
    if (occ) {
      const ch = occ.char;
      const hide = settings().hideEnemyHp && occ.side === 'enemy';
      const tpl = ch.templateId ? ENEMY_BY_ID[ch.templateId] : null;
      const a = this.selected ?? ACTION_BY_ID.attack;
      const showChance = this.isPlayerTurn() && occ.side === 'enemy' && (a.attack || a.id === 'attack') && this.cb.isTargetable(this.cur, a, occ);
      const mode = showChance ? this.cb.attackMode(this.cur, occ, a) : null;
      this.info.append(h('div', { class: 'wrap' }, 
        h('div', { class: 'ci-name' }, ch.name),
        h('div', null, `AC ${armorClass(ch)} · HP ${hide ? (ch.hp >= ch.maxHp * 0.5 ? 'healthy' : ch.hp > 0 ? 'bloodied' : 'down') : `${ch.hp}/${ch.maxHp}`}${ch.tempHp ? ` (+${ch.tempHp})` : ''}`),
        ch.resistances?.length ? h('div', { class: 'small' }, `Resists: ${ch.resistances.join(', ')}`) : null,
        ch.vulnerabilities?.length ? h('div', { class: 'small good' }, `Vulnerable: ${ch.vulnerabilities.join(', ')}`) : null,
        ch.immunities?.length ? h('div', { class: 'small' }, `Immune: ${ch.immunities.join(', ')}`) : null,
        ch.conditions.length ? h('div', { class: 'small' }, ch.conditions.map((k) => CONDITION_WORDS[k.id] ?? k.id).join(', ')) : null,
        showChance ? h('div', { class: 'chance' }, `Hit chance: ${Math.round(this.cb.hitChance(this.cur, occ, a) * 100)}%`, mode && mode.mode !== 'normal' ? h('div', { class: 'small' }, `${mode.mode}: ${mode.reasons.join(', ')}`) : null) : null,
        tpl ? h('div', { class: 'small muted' }, tpl.desc) : null));
    } else if (obj) {
      this.info.append(h('div', { class: 'ci-name' }, obj.name), h('div', null, `AC ${obj.ac} · HP ${obj.hp}/${obj.maxHp}`),
        h('div', { class: 'small muted' }, obj.kind === 'barrel' ? 'Explodes when destroyed (3d6 fire, radius 1, Dex save half) and leaves burning ground. Use Interact to light it.' : 'Feeds the Bellwarden. Destroy it to strip his ward.'));
    } else {
      const tc = this.cb.tileChar(this.hover.x, this.hover.y);
      const td = tile(tc);
      const fire = this.cb.fires.some((f) => f.x === this.hover!.x && f.y === this.hover!.y);
      this.info.append(h('div', { class: 'ci-name' }, fire ? 'Burning ground' : td.name),
        h('div', { class: 'small muted' }, [td.difficult ? 'Difficult terrain (2× movement).' : '', td.cover === 1 ? 'Gives half cover (+2 AC) to adjacent creatures.' : '', td.high ? 'High ground: +2 to ranged attacks against lower targets.' : '', td.hazard || fire ? 'Hazard: damage when entered or at turn start.' : '', tc === 'v' ? 'A pit — shove enemies in!' : ''].filter(Boolean).join(' ')));
    }
  }

  // ─────────────────────── Drawing

  private draw(time: number): void {
    const cv = this.canvas, width = cv.clientWidth, height = cv.clientHeight;
    if (!width || !height) return;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(width * ratio) || cv.height !== Math.round(height * ratio)) {
      cv.width = Math.round(width * ratio); cv.height = Math.round(height * ratio);
    }
    const ctx = this.ctx;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.imageSmoothingEnabled = true;
    this.layoutView();
    const view = this.view, ts = this.ts, b = this.cb.bounds;
    const { bounds: visualBounds, grid, architecture, buildings } = this.boardFrame();
    const gridWidth = grid[0].length;
    const dt = Math.min(50, this.lastFrame ? time - this.lastFrame : 16.67);
    this.lastFrame = time;
    const now = performance.now();

    const backdrop = ctx.createRadialGradient(width * 0.48, height * 0.45, 30, width * 0.48, height * 0.45, Math.max(width, height) * 0.68);
    backdrop.addColorStop(0, '#171a24'); backdrop.addColorStop(0.55, '#0d121a'); backdrop.addColorStop(1, '#050810');
    ctx.fillStyle = backdrop; ctx.fillRect(0, 0, width, height);

    // A cutaway arena is drawn on its actual game coordinates. The visual diamond
    // never changes distance, movement costs, line of sight, or attack resolution.
    const corners = [isoPoint(b.x0 - 0.5, b.y0 - 0.5, view), isoPoint(b.x1 + 0.5, b.y0 - 0.5, view),
      isoPoint(b.x1 + 0.5, b.y1 + 0.5, view), isoPoint(b.x0 - 0.5, b.y1 + 0.5, view)];
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.75)'; ctx.shadowBlur = 45; ctx.shadowOffsetY = 22;
    const outer = [isoPoint(visualBounds.x0 - .5, visualBounds.y0 - .5, view), isoPoint(visualBounds.x1 + .5, visualBounds.y0 - .5, view),
      isoPoint(visualBounds.x1 + .5, visualBounds.y1 + .5, view), isoPoint(visualBounds.x0 - .5, visualBounds.y1 + .5, view)];
    ctx.beginPath(); outer.forEach((p, i) => i ? ctx.lineTo(p.x, p.y + 10) : ctx.moveTo(p.x, p.y + 10));
    ctx.closePath(); ctx.fillStyle = '#141019'; ctx.fill(); ctx.restore();
    for (let y = visualBounds.y0; y <= visualBounds.y1; y++) for (let x = visualBounds.x0; x <= visualBounds.x1; x++) {
      const playable = this.cb.inBounds(x, y);
      drawIsoGround(ctx, playable ? this.cb.tileChar(x, y) : (grid[y]?.[x] ?? '#'), x, y, view, this.cb.map.tileset, time,
        { grid: playable && this.gridVisible, dim: !playable });
    }
    ctx.strokeStyle = 'rgba(205,165,102,0.48)'; ctx.lineWidth = 1;
    ctx.beginPath(); corners.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); ctx.stroke();

    // Actual movement and attack previews are painted on diamond-shaped tiles.
    if (this.isPlayerTurn()) {
      const c = this.cur;
      if (!this.selected && c.movement > 0) for (const v of this.reach().values()) {
        drawIsoHighlight(ctx, v.x, v.y, view, 'rgba(95,183,211,0.14)', 'rgba(132,211,233,0.15)');
      }
      if (this.selected) {
        const a = this.selected;
        if (a.area && this.hover && this.cb.inBounds(this.hover.x, this.hover.y)) {
          const affected = this.cb.areaTiles(c, a, a.area.fromSelf && a.area.shape === 'radius' ? { x: c.x, y: c.y } : this.hover);
          for (const p of affected) if (this.cb.inBounds(p.x, p.y)) {
            const ally = this.cb.combatants.some((ally) => ally.side === 'party' && ally.char.hp > 0 && ally.x === p.x && ally.y === p.y);
            drawIsoHighlight(ctx, p.x, p.y, view, ally ? 'rgba(242,91,93,0.39)' : 'rgba(236,164,76,0.3)', ally ? '#ff8782' : 'rgba(255,210,144,0.7)');
          }
        } else {
          for (const target of this.cb.validTargets(c, a)) drawIsoHighlight(ctx, target.x, target.y, view, 'rgba(227,182,93,0.15)', '#f0ca79');
          for (const obj of this.cb.objectTargets(c, a)) drawIsoHighlight(ctx, obj.x, obj.y, view, 'rgba(227,182,93,0.15)', '#f0ca79');
        }
        if (a.target === 'point' && !a.area && this.hover && this.cb.inBounds(this.hover.x, this.hover.y)) {
          drawIsoHighlight(ctx, this.hover.x, this.hover.y, view, 'rgba(140,125,230,0.25)', '#cdb0ff');
        }
      }
      if (!this.selected && this.hover && this.reach().has(`${this.hover.x},${this.hover.y}`)) {
        const key = `${c.id}:${c.x},${c.y}:${c.movement}:${this.hover.x},${this.hover.y}`;
        if (this.pathPreview?.key !== key) {
          const path = this.cb.pathTo(c, this.hover.x, this.hover.y);
          this.pathPreview = { key, path, provokes: !!path && this.cb.provokers(c, path).length > 0 };
        }
        const { path, provokes } = this.pathPreview;
        if (path?.length) {
          ctx.save(); ctx.strokeStyle = provokes ? '#ef8d7b' : '#efd099'; ctx.fillStyle = ctx.strokeStyle;
          ctx.lineWidth = 2; ctx.setLineDash([4, 5]); ctx.beginPath();
          const source = isoPoint(c.x, c.y, view); ctx.moveTo(source.x, source.y);
          for (const p of path) { const q = isoPoint(p.x, p.y, view); ctx.lineTo(q.x, q.y); }
          ctx.stroke(); ctx.setLineDash([]);
          for (const p of path) { const q = isoPoint(p.x, p.y, view); ctx.beginPath(); ctx.ellipse(q.x, q.y, Math.max(2, ts * 0.045), Math.max(1.5, ts * 0.024), 0, 0, Math.PI * 2); ctx.fill(); }
          ctx.restore();
        }
      }
    }
    if (this.hover && this.cb.inBounds(this.hover.x, this.hover.y)) {
      drawIsoHighlight(ctx, this.hover.x, this.hover.y, view, 'rgba(244,224,175,0.05)', 'rgba(252,226,170,0.8)');
    }
    if (!this.cb.over) drawIsoHighlight(ctx, this.cur.x, this.cur.y, view, 'rgba(230,183,94,0.15)', 'rgba(255,219,143,0.9)');

    // Animate positions before sorting: foreground terrain and figures share a
    // single painter order, so a moving adventurer can pass behind a pillar.
    const actors = this.cb.combatants.filter((c) => !(c.removed && c.side === 'enemy')).map((c) => {
      const d = this.disp.get(c.id) ?? { x: c.x, y: c.y, queue: [] };
      if (!this.disp.has(c.id)) this.disp.set(c.id, d);
      const target = d.queue[0] ?? { x: c.x, y: c.y };
      if (walkToward(d, target.x, target.y, dt, COMBAT_WALK_MS[settings().cpuSpeed] ?? WALK_MS_PER_TILE) && d.queue.length) d.queue.shift();
      const p = isoPoint(d.x, d.y, view);
      p.y -= isoElevation(this.cb.tileChar(c.x, c.y), ts);
      return { c, d, p };
    });
    const layers: { depth: number; draw: () => void }[] = [];
    for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) {
      const ch = this.cb.tileChar(x, y);
      if (ch === 'W' && architecture.covered.has(y * gridWidth + x)) continue;
      if (!hasIsoProp(ch)) continue;
      // Interior wall mass stays a dark cutaway; only its exposed face rises.
      if (ch === '#' && ![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => tile(this.cb.tileChar(x + dx, y + dy)).walk)) continue;
      const p = isoPoint(x, y, view);
      const tree = ch === 'T' || ch === 't';
      const fade = actors.some((a) => a.c.char.hp > 0 && Math.abs(a.p.x - p.x) < ts * (tree ? .95 : .6) && a.p.y < p.y + ts * .15 && a.p.y > p.y - ts * (tree ? 2.65 : 1.65));
      layers.push({ depth: x + y + 0.1, draw: () => drawIsoProp(ctx, ch, x, y, view, this.cb.map.tileset, time, { fade: fade ? 0.3 : 1 }) });
    }
    for (const building of buildings) {
      const pts = [isoPoint(building.x - 0.5, building.y - 0.5, view), isoPoint(building.x + building.w - 0.5, building.y - 0.5, view),
        isoPoint(building.x + building.w - 0.5, building.y + building.h - 0.5, view), isoPoint(building.x - 0.5, building.y + building.h - 0.5, view)];
      const left = Math.min(...pts.map(p => p.x)), right = Math.max(...pts.map(p => p.x)), top = Math.min(...pts.map(p => p.y)) - ts * 2, bottom = Math.max(...pts.map(p => p.y));
      const fade = actors.some(a => a.c.char.hp > 0 && a.p.x > left && a.p.x < right && a.p.y > top && a.p.y < bottom) ? 0.3 : 1;
      layers.push({ depth: building.x + building.w - 1 + building.y + building.h - 1,
        draw: () => drawIsoBuilding(ctx, building, view, time, this.cb.map.tileset, fade) });
    }
    for (const fire of this.cb.fires) layers.push({ depth: fire.x + fire.y + 0.25, draw: () => {
      drawIsoHighlight(ctx, fire.x, fire.y, view, `rgba(239,97,32,${0.2 + 0.08 * Math.sin(time / 170 + fire.x)})`);
      drawIsoProp(ctx, 'F', fire.x, fire.y, view, this.cb.map.tileset, time);
    } });
    for (const obj of this.cb.objects) {
      if (obj.destroyed) continue;
      if (obj.kind === 'barrel') {
        if (this.cb.tileChar(obj.x, obj.y) !== 'b') layers.push({ depth: obj.x + obj.y + 0.2, draw: () => drawIsoProp(ctx, 'b', obj.x, obj.y, view, this.cb.map.tileset, time) });
        continue;
      }
      layers.push({ depth: obj.x + obj.y + 0.3, draw: () => {
        const p = isoPoint(obj.x, obj.y, view), h = ts * 0.75;
        glow(ctx, p.x, p.y - h * 0.45, ts * 0.48, `rgba(115,126,249,${0.21 + Math.sin(time / 400) * 0.04})`);
        ctx.fillStyle = '#3b3b5c'; ctx.beginPath(); ctx.ellipse(p.x, p.y, ts * 0.23, ts * 0.11, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(p.x, p.y - h); ctx.lineTo(p.x + ts * 0.18, p.y - h * 0.3); ctx.lineTo(p.x, p.y); ctx.closePath();
        const gl = ctx.createLinearGradient(p.x - ts * 0.2, p.y - h, p.x + ts * 0.2, p.y); gl.addColorStop(0, '#e9d8ff'); gl.addColorStop(1, '#7a75b9'); ctx.fillStyle = gl; ctx.fill();
        ctx.beginPath(); ctx.moveTo(p.x, p.y - h); ctx.lineTo(p.x - ts * 0.18, p.y - h * 0.3); ctx.lineTo(p.x, p.y); ctx.closePath(); ctx.fillStyle = '#9a9fe6'; ctx.fill();
        ctx.strokeStyle = '#ddccff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y - h); ctx.lineTo(p.x, p.y); ctx.stroke();
      } });
    }
    for (const actor of actors) layers.push({ depth: actor.d.x + actor.d.y + 0.4, draw: () => {
      const { c, p, d } = actor, ch = c.char;
      const color = c.side === 'enemy' ? (ENEMY_BY_ID[ch.templateId ?? '']?.color ?? '#c66') : `hsl(${ch.companionId ? COMPANION_BY_ID[ch.companionId].hue : ch.portrait.hue},45%,62%)`;
      const glyph = c.side === 'enemy' ? (ENEMY_BY_ID[ch.templateId ?? '']?.glyph ?? '') : '';
      const impact = Math.max(0, (this.impactUntil.get(c.id) ?? 0) - now);
      const recoil = impact ? Math.sin(impact / 18) * ts * 0.045 * (impact / 260) : 0;
      if ((ch.traits ?? []).includes('echo_touched')) glow(ctx, p.x, p.y - ts * 0.3, ts * 0.32, 'rgba(180,150,255,0.18)');
      drawIsoToken(ctx, p.x + recoil, p.y, ts, color, glyph, {
        character: ch, role: ch.classId, enemy: c.side === 'enemy', dim: ch.hp <= 0, down: ch.hp <= 0,
        selected: c.id === this.cur.id && !this.cb.over, time, facing: d.queue.length ? Math.atan2(d.queue[0].y - d.y, d.queue[0].x - d.x) : undefined,
      });
      if (ch.conditions.some((k) => ['stunned', 'incapacitated', 'prone', 'restrained', 'frightened', 'poisoned'].includes(k.id))) {
        ctx.save(); ctx.strokeStyle = '#edc991'; ctx.lineWidth = 1.3;
        for (let i = 0; i < 3; i++) { const a = time / 700 + i * Math.PI * 2 / 3; const xx = p.x + Math.cos(a) * ts * 0.2, yy = p.y - ts * 0.91 + Math.sin(a) * ts * 0.05;
          ctx.beginPath(); ctx.moveTo(xx - 3, yy); ctx.lineTo(xx + 3, yy); ctx.moveTo(xx, yy - 3); ctx.lineTo(xx, yy + 3); ctx.stroke(); }
        ctx.restore();
      }
    } });
    layers.sort((a, b2) => a.depth - b2.depth);
    for (const layer of layers) layer.draw();

    this.flashes = this.flashes.filter((f) => now - f.born < 700);
    for (const flash of this.flashes) {
      const k = Math.max(0, (now - flash.born) / 700);
      ctx.save(); ctx.globalAlpha = (1 - k) * 0.7;
      for (const p of flash.tiles) {
        if (!this.cb.inBounds(p.x, p.y)) continue;
        drawIsoHighlight(ctx, p.x, p.y, view, flash.color);
        const q = isoPoint(p.x, p.y, view); glow(ctx, q.x, q.y - ts * 0.22, ts * (0.15 + k * 0.15), flash.color);
      }
      ctx.restore();
    }
    this.strikes = this.strikes.filter((s) => now - s.born < 350);
    for (const strike of this.strikes) {
      const k = (now - strike.born) / 350, a = isoPoint(strike.from.x, strike.from.y, view), z = isoPoint(strike.to.x, strike.to.y, view);
      a.y -= ts * 0.4; z.y -= ts * 0.45;
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - k); ctx.lineCap = 'round';
      ctx.strokeStyle = strike.crit ? '#ffe0a0' : strike.hit ? '#e0c4a1' : '#889bab'; ctx.lineWidth = strike.crit ? 4 : 2;
      ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.moveTo(a.x + (z.x - a.x) * Math.max(0, k - 0.25), a.y + (z.y - a.y) * Math.max(0, k - 0.25));
      ctx.lineTo(a.x + (z.x - a.x) * Math.min(1, k * 3), a.y + (z.y - a.y) * Math.min(1, k * 3)); ctx.stroke();
      if (strike.hit) { ctx.beginPath(); ctx.arc(z.x, z.y, ts * (0.06 + k * 0.23), -0.7, 1.6); ctx.stroke(); }
      ctx.restore();
    }

    // Health/status UI stays above scenery; this prevents a foreground wall from
    // concealing essential tactical information even while its art fades out.
    for (const { c, p } of actors) {
      const ch = c.char, barW = Math.max(24, ts * 0.5), top = p.y - ts * 0.97;
      if (!(settings().hideEnemyHp && c.side === 'enemy') && ch.hp > 0) {
        ctx.fillStyle = 'rgba(8,10,17,0.94)'; ctx.fillRect(p.x - barW / 2 - 2, top - 2, barW + 4, 7);
        ctx.fillStyle = '#3c2930'; ctx.fillRect(p.x - barW / 2, top, barW, 3);
        ctx.fillStyle = c.side === 'enemy' ? '#de776c' : '#91c8a2'; ctx.fillRect(p.x - barW / 2, top, barW * Math.max(0, ch.hp / ch.maxHp), 3);
        if (ch.tempHp > 0) { ctx.fillStyle = '#b09adf'; ctx.fillRect(p.x - barW / 2, top + 4, Math.min(barW, barW * ch.tempHp / ch.maxHp), 2); }
      }
      if (this.hover?.x === c.x && this.hover.y === c.y) {
        ctx.save(); ctx.font = `600 ${Math.max(11, Math.min(15, ts * 0.22))}px Georgia, serif`; ctx.textAlign = 'center';
        const label = ch.name, textW = ctx.measureText(label).width;
        ctx.fillStyle = 'rgba(12,14,22,0.96)'; ctx.fillRect(p.x - textW / 2 - 9, top - 27, textW + 18, 21);
        ctx.strokeStyle = c.side === 'enemy' ? '#ba7d6d' : '#ba9b65'; ctx.strokeRect(p.x - textW / 2 - 9, top - 27, textW + 18, 21);
        ctx.fillStyle = '#f3dfbc'; ctx.fillText(label, p.x, top - 12); ctx.restore();
      }
    }
    this.floats = this.floats.filter((f) => now - f.born < 1600);
    for (const f of this.floats) {
      if (!f.text || now < f.born) continue;
      const k = Math.max(0, (now - f.born) / 1600), p = isoPoint(f.x, f.y, view);
      ctx.save(); ctx.globalAlpha = 1 - k;
      ctx.font = `bold ${f.big ? Math.max(18, ts * 0.4) : f.text.startsWith('“') ? 13 : Math.max(15, ts * 0.29)}px Georgia, serif`;
      ctx.textAlign = 'center'; ctx.strokeStyle = 'rgba(6,8,15,0.95)'; ctx.lineWidth = 4; ctx.lineJoin = 'round';
      const y = p.y - ts * 1.1 - k * ts * 0.65;
      ctx.strokeText(f.text, p.x, y); ctx.fillStyle = f.color; ctx.fillText(f.text, p.x, y); ctx.restore();
    }
  }
}
