import type { App, Screen } from '../app';
import { h, clear, toast, bar, modal } from '../dom';
import { Combat, dist, CONDITION_RULES, CONDITION_WORDS, type Combatant, type CombatEvent, type Target } from '../../engine/combat/combat';
import { aiStep } from '../../engine/combat/ai';
import { ACTION_BY_ID, type ActionDef } from '../../data/actions';
import { ITEM_BY_ID } from '../../data/items';
import { COMPANION_BY_ID } from '../../data/companions';
import { ENEMY_BY_ID } from '../../data/enemies';
import { tile } from '../../data/maps/tiles';
import { armorClass, spellSlotsMax, slotsAvailable, resourceLeft, speed } from '../../engine/character';
import { awardXp, addLog, addItem } from '../../engine/state';
import { bark } from '../../engine/companionMind';
import { drawTile, drawToken, glow } from '../render/tiles';
import { charPortrait } from '../portraits';
import { settings, cpuDelay } from '../../core/settings';
import { playMusic, sfx } from '../../audio/audio';
import { sleep } from '../dom';
import { openParty } from './party';
import { t } from '../../i18n/index';

interface FloatText { x: number; y: number; text: string; color: string; born: number; big?: boolean; }
interface Flash { tiles: { x: number; y: number }[]; color: string; born: number; }

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
  private ts = 40;
  private ox = 0;
  private oy = 0;
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

  constructor(private app: App, encounterId: string, ambush: 'party' | 'enemy' | undefined, private onDone: (r: 'victory' | 'defeat' | 'fled') => void) {
    this.cb = new Combat(app.state!, encounterId, { ambush });
    this.canvas = h('canvas', { class: 'combat-canvas' });
    this.ctx = this.canvas.getContext('2d')!;
    this.timeline = h('div', { class: 'cb-timeline panel' });
    this.actionBar = h('div', { class: 'cb-actions panel' });
    this.partyBox = h('div', { class: 'cb-party' });
    this.logBox = h('div', { class: 'cb-log panel' });
    this.info = h('div', { class: 'cb-info panel' });
    this.el = h('div', { class: 'screen combat' }, this.canvas, this.timeline, this.partyBox, this.logBox, this.info, this.actionBar);
    this.canvas.addEventListener('mousemove', (e) => { this.hover = this.toTile(e); this.renderInfo(); });
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
    if (e.key === 'Escape') { this.selected = null; this.renderActions(); return true; }
    if (e.key === ' ' || e.key === 'Enter') { if (this.isPlayerTurn()) this.endTurn(); return true; }
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
    return { x: Math.floor((e.clientX - r.left - this.ox) / this.ts) + this.cb.bounds.x0, y: Math.floor((e.clientY - r.top - this.oy) / this.ts) + this.cb.bounds.y0 };
  }

  private reach(): Map<string, any> {
    if (!this.reachCache) this.reachCache = this.cb.reachable(this.cur);
    return this.reachCache;
  }

  private onClick(e: MouseEvent): void {
    if (!this.isPlayerTurn()) return;
    const p = this.toTile(e);
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
    if (!this.hover) return;
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
    const cv = this.canvas;
    if (cv.width !== cv.clientWidth || cv.height !== cv.clientHeight) { cv.width = cv.clientWidth; cv.height = cv.clientHeight; }
    const ctx = this.ctx;
    const b = this.cb.bounds;
    const cols = b.x1 - b.x0 + 1, rows = b.y1 - b.y0 + 1;
    this.ts = Math.max(20, Math.min(64, Math.floor(Math.min((cv.width - 40) / cols, (cv.height - 40) / rows))));
    const ts = this.ts;
    this.ox = Math.floor((cv.width - cols * ts) / 2);
    this.oy = Math.floor((cv.height - rows * ts) / 2);
    ctx.fillStyle = '#05060a'; ctx.fillRect(0, 0, cv.width, cv.height);
    const px = (x: number) => this.ox + (x - b.x0) * ts, py = (y: number) => this.oy + (y - b.y0) * ts;
    for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) {
      drawTile(ctx, this.cb.tileChar(x, y), x, y, px(x), py(y), ts, this.cb.map.tileset, time);
    }
    for (const f of this.cb.fires) { ctx.fillStyle = `rgba(255,120,30,${0.35 + 0.15 * Math.sin(time / 120 + f.x)})`; ctx.fillRect(px(f.x), py(f.y), ts, ts); }
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    for (let x = 0; x <= cols; x++) { ctx.beginPath(); ctx.moveTo(this.ox + x * ts, this.oy); ctx.lineTo(this.ox + x * ts, this.oy + rows * ts); ctx.stroke(); }
    for (let y = 0; y <= rows; y++) { ctx.beginPath(); ctx.moveTo(this.ox, this.oy + y * ts); ctx.lineTo(this.ox + cols * ts, this.oy + y * ts); ctx.stroke(); }
    // Reachable squares & targets
    if (this.isPlayerTurn()) {
      const c = this.cur;
      if (!this.selected && c.movement > 0) {
        ctx.fillStyle = 'rgba(120,180,255,0.16)';
        for (const v of this.reach().values()) ctx.fillRect(px(v.x) + 1, py(v.y) + 1, ts - 2, ts - 2);
      }
      if (this.selected) {
        const a = this.selected;
        if (a.area && this.hover) {
          const tiles = this.cb.areaTiles(c, a, a.area.fromSelf && a.area.shape === 'radius' ? { x: c.x, y: c.y } : this.hover);
          ctx.fillStyle = 'rgba(255,140,60,0.3)';
          for (const t2 of tiles) ctx.fillRect(px(t2.x), py(t2.y), ts, ts);
        } else {
          ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 2;
          for (const t2 of this.cb.validTargets(c, a)) ctx.strokeRect(px(t2.x) + 2, py(t2.y) + 2, ts - 4, ts - 4);
          for (const o of this.cb.objectTargets(c, a)) ctx.strokeRect(px(o.x) + 2, py(o.y) + 2, ts - 4, ts - 4);
          ctx.lineWidth = 1;
        }
        if (a.target === 'point' && !a.area && this.hover) { ctx.strokeStyle = '#9fd3ff'; ctx.strokeRect(px(this.hover.x), py(this.hover.y), ts, ts); }
      }
      // Path preview with opportunity-attack warning
      if (!this.selected && this.hover && this.reach().has(`${this.hover.x},${this.hover.y}`)) {
        const path = this.cb.pathTo(c, this.hover.x, this.hover.y);
        if (path) {
          const prov = this.cb.provokers(c, path);
          ctx.fillStyle = prov.length ? 'rgba(255,90,70,0.7)' : 'rgba(255,230,160,0.7)';
          for (const p of path) { ctx.beginPath(); ctx.arc(px(p.x) + ts / 2, py(p.y) + ts / 2, ts * 0.1, 0, Math.PI * 2); ctx.fill(); }
        }
      }
    }
    // Objects
    for (const o of this.cb.objects) {
      if (o.destroyed) continue;
      if (o.kind === 'pillar') {
        glow(ctx, px(o.x) + ts / 2, py(o.y) + ts / 2, ts * 0.35, `rgba(120,170,255,${0.5 + 0.2 * Math.sin(time / 200)})`);
        ctx.fillStyle = '#9fc4ff'; ctx.beginPath(); ctx.moveTo(px(o.x) + ts / 2, py(o.y) + 3); ctx.lineTo(px(o.x) + ts * 0.75, py(o.y) + ts - 3); ctx.lineTo(px(o.x) + ts * 0.25, py(o.y) + ts - 3); ctx.fill();
      }
    }
    // Flashes
    const now = performance.now();
    this.flashes = this.flashes.filter((f) => now - f.born < 700);
    for (const f of this.flashes) {
      ctx.globalAlpha = 1 - (now - f.born) / 700;
      ctx.fillStyle = f.color;
      for (const t2 of f.tiles) ctx.fillRect(px(t2.x), py(t2.y), ts, ts);
      ctx.globalAlpha = 1;
    }
    // Tokens
    for (const c of this.cb.combatants) {
      if (c.removed && c.side === 'enemy') continue;
      const d = this.disp.get(c.id) ?? { x: c.x, y: c.y, queue: [] };
      if (!this.disp.has(c.id)) this.disp.set(c.id, d);
      const target = d.queue[0] ?? { x: c.x, y: c.y };
      const sp = cpuDelay() === 0 ? 1 : 0.35;
      d.x += (target.x - d.x) * sp; d.y += (target.y - d.y) * sp;
      if (Math.abs(target.x - d.x) < 0.05 && Math.abs(target.y - d.y) < 0.05) { d.x = target.x; d.y = target.y; if (d.queue.length) d.queue.shift(); }
      const x = this.ox + (d.x - b.x0) * ts, y = this.oy + (d.y - b.y0) * ts;
      const ch = c.char;
      const color = c.side === 'enemy' ? (ENEMY_BY_ID[ch.templateId ?? '']?.color ?? '#c66') : `hsl(${ch.companionId ? COMPANION_BY_ID[ch.companionId].hue : ch.portrait.hue},45%,62%)`;
      const glyph = c.side === 'enemy' ? (ENEMY_BY_ID[ch.templateId ?? '']?.glyph ?? '?') : ch.name[0];
      if (c.id === this.cur.id && !this.cb.over) { ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + ts / 2, y + ts / 2, ts * 0.47 + Math.sin(time / 200) * 1.5, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1; }
      drawToken(ctx, x, y, ts, color, glyph, { enemy: c.side === 'enemy', dim: ch.hp <= 0, selected: c.id === this.cur.id });
      if ((ch.traits ?? []).includes('echo_touched')) glow(ctx, x + ts / 2, y + ts / 2, ts * 0.3, 'rgba(180,150,255,0.25)');
      // mini HP bar
      if (!(settings().hideEnemyHp && c.side === 'enemy') && ch.hp > 0) {
        ctx.fillStyle = '#300'; ctx.fillRect(x + 4, y + ts - 5, ts - 8, 3);
        ctx.fillStyle = c.side === 'enemy' ? '#e05a4a' : '#5ad06a'; ctx.fillRect(x + 4, y + ts - 5, (ts - 8) * Math.max(0, ch.hp / ch.maxHp), 3);
      }
      if (ch.conditions.some((k) => ['stunned', 'incapacitated', 'prone', 'restrained', 'frightened', 'poisoned'].includes(k.id))) {
        ctx.fillStyle = '#ffdd88'; ctx.font = `${ts * 0.3}px serif`; ctx.textAlign = 'center'; ctx.fillText('✶', x + ts * 0.85, y + ts * 0.25);
      }
    }
    // Floating texts
    this.floats = this.floats.filter((f) => now - f.born < 1600);
    for (const f of this.floats) {
      const k = Math.max(0, (now - f.born) / 1600);
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = f.color;
      ctx.font = `bold ${f.big ? ts * 0.55 : f.text.startsWith('“') ? 13 : ts * 0.38}px Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.fillText(f.text, this.ox + (f.x - b.x0) * ts + ts / 2, this.oy + (f.y - b.y0) * ts - k * ts * 0.8);
      ctx.globalAlpha = 1;
    }
  }
}
