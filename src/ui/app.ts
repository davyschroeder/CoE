/**
 * Game controller: owns the current GameState, switches screens and routes engine signals
 * (dialogue, combat, travel, shops, camp, epilogue) to the right UI.
 */
import type { GameState } from '../engine/types';
import type { Signal } from '../engine/effects';
import { applyEffects } from '../engine/effects';
import { DIALOGUE_BY_ID } from '../data/dialogue/index';
import { ENCOUNTER_BY_ID } from '../data/encounters';
import { COMPANION_BY_ID } from '../data/companions';
import { addLog, activeParty, mapRuntime } from '../engine/state';
import { companionLeaves } from '../engine/companionMind';
import { saveGame, loadGame } from '../engine/save';
import { getMap, resetTriggerMemory, music } from '../engine/exploration';
import { canLevelUp } from '../engine/character';
import { clear, closeAllModals, toast, modal, h } from './dom';
import { playMusic, sfx } from '../audio/audio';
import { MainMenu } from './screens/mainMenu';
import { ExploreScreen } from './screens/explore';
import { CombatScreen } from './screens/combat';
import { openDialogue } from './screens/dialogueView';
import { openShop } from './screens/shop';
import { openCamp } from './screens/camp';
import { showEpilogue } from './screens/epilogue';

export interface Screen { el: HTMLElement; mount?(): void; unmount?(): void; onKey?(e: KeyboardEvent): boolean | void; }

export class App {
  state: GameState | null = null;
  screen: Screen | null = null;
  explore: ExploreScreen | null = null;
  busy = false; // dialogue/combat in progress
  private lastTick = performance.now();

  constructor(public root: HTMLElement) {
    setInterval(() => this.tick(), 1000);
    window.addEventListener('keydown', (e) => this.onKey(e));
    // Save quietly when the player leaves: closing the tab or app, switching apps on a phone.
    const leaving = () => this.safeAutosave();
    window.addEventListener('pagehide', leaving);
    document.addEventListener('visibilitychange', () => { if (document.hidden) leaving(); });
    // And now and then while playing, so a crash or a killed browser loses little.
    setInterval(() => this.safeAutosave(), 60_000);
  }

  /** Quiet autosave at a safe moment: not during a conversation or a fight (their state is not in the save). */
  safeAutosave(): void {
    if (this.state && !this.busy && this.screen === this.explore) this.autosave('', true);
  }

  private tick(): void {
    const now = performance.now();
    if (this.state && !document.hidden) this.state.playtimeSec += (now - this.lastTick) / 1000;
    this.lastTick = now;
  }

  private onKey(e: KeyboardEvent): void {
    if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
    if (e.key === 'F11') return;
    const layer = document.getElementById('modal-layer')!;
    if (e.key === 'Escape' && layer.children.length) {
      const last = layer.lastElementChild as HTMLElement;
      const btn = last.querySelector('.modal-head .icon-btn') as HTMLButtonElement | null;
      btn?.click();
      e.preventDefault();
      return;
    }
    if (layer.children.length) return;
    this.screen?.onKey?.(e);
  }

  setScreen(s: Screen): void {
    this.screen?.unmount?.();
    clear(this.root);
    this.screen = s;
    this.root.appendChild(s.el);
    s.mount?.();
  }

  showMenu(): void {
    closeAllModals();
    this.state = null;
    this.explore = null;
    playMusic('menu');
    this.setScreen(new MainMenu(this));
  }

  /** Begin play with a state (new game or loaded save). */
  begin(state: GameState, fresh: boolean): void {
    closeAllModals();
    this.state = state;
    resetTriggerMemory();
    // The opening scene narrates the arrival itself; don't stack the map's arrival text on top of it.
    if (fresh) { state.flags[`entered_${state.location.mapId}`] = true; }
    this.explore = new ExploreScreen(this);
    this.setScreen(this.explore);
    if (fresh) {
      // A new adventure has a save from the first moment, so Continue works even if the tab is closed early.
      this.autosave('new adventure');
      this.openDialogue('intro');
    } else {
      addLog(state, 'system', 'Game loaded.');
    }
  }

  load(slot: string): void {
    try {
      const { state, recovered } = loadGame(slot);
      this.begin(state, false);
      toast(recovered ? 'The save was damaged — recovered from the backup copy.' : 'Game loaded.', recovered ? 'bad' : 'good');
    } catch (e: any) {
      toast(`Could not load: ${e.message}`, 'bad', 5000);
    }
  }

  autosave(reason: string, quiet = false): void {
    if (!this.state) return;
    try { saveGame(this.state, 'auto', true); if (!quiet) addLog(this.state, 'system', `Autosaved (${reason}).`); }
    catch (e) { console.warn('Autosave failed', e); }
  }

  // ─────────────────────────── Signal routing

  async handleSignals(signals: Signal[]): Promise<void> {
    const s = this.state;
    if (!s) return;
    const deferred: Signal[] = [];
    for (const sig of signals) {
      switch (sig.type) {
        case 'notify': toast(sig.text, sig.text.startsWith('Quest') || sig.text.startsWith('New quest') ? 'quest' : 'info'); if (sig.text.includes('Quest')) sfx('quest'); break;
        case 'levelup': toast(`${sig.names.join(', ')} can level up! (Character sheet)`, 'good', 5000); sfx('levelup'); break;
        case 'reactions':
          for (const r of sig.reactions) {
            const name = COMPANION_BY_ID[r.compId].name;
            addLog(s, 'reaction', r.text, name);
            this.explore?.floatReaction(r.compId, r.score);
            if (r.leaving) deferred.push({ type: 'notify', text: `__leave:${r.compId}` });
          }
          break;
        default: deferred.push(sig);
      }
    }
    // Departures first, then flow-changing signals in priority order.
    for (const sig of deferred) {
      if (sig.type === 'notify' && sig.text.startsWith('__leave:')) {
        const id = sig.text.slice(8);
        const farewell = companionLeaves(s, id);
        await new Promise<void>((res) => modal(`${COMPANION_BY_ID[id].name} leaves`, h('div', null, h('p', { class: 'farewell' }, farewell), h('button', { class: 'btn', onclick: () => res() }, 'Let them go')), { onClose: () => res() }));
        closeAllModals();
      }
    }
    const flow = deferred.filter((x) => x.type !== 'notify');
    const combat = flow.find((x) => x.type === 'combat') as Extract<Signal, { type: 'combat' }> | undefined;
    const goto = flow.find((x) => x.type === 'goto') as Extract<Signal, { type: 'goto' }> | undefined;
    const dialogue = flow.find((x) => x.type === 'dialogue') as Extract<Signal, { type: 'dialogue' }> | undefined;
    const shop = flow.find((x) => x.type === 'shop') as Extract<Signal, { type: 'shop' }> | undefined;
    const camp = flow.find((x) => x.type === 'camp');
    const epilogue = flow.find((x) => x.type === 'epilogue');
    if (goto) this.travel(goto.mapId, goto.x, goto.y);
    if (epilogue) { const act = (epilogue as Extract<Signal, { type: 'epilogue' }>).act; this.autosave(`${act} complete`); showEpilogue(this, act); return; }
    if (combat) { this.startCombat(combat.encounterId); return; }
    if (dialogue) { this.openDialogue(dialogue.treeId); return; }
    if (shop) { openShop(this, shop.shopId); return; }
    if (camp) { openCamp(this); return; }
    this.explore?.refresh();
  }

  openDialogue(treeId: string): void {
    const tree = DIALOGUE_BY_ID[treeId];
    if (!tree || !this.state) { console.warn('Missing dialogue', treeId); toast(`(Missing dialogue: ${treeId})`, 'bad'); return; }
    this.busy = true;
    openDialogue(this, tree, (signals) => {
      this.busy = false;
      // After a conversation (unless it led into a fight or elsewhere, which save on their own).
      this.handleSignals(signals).then(() => this.safeAutosave());
    });
  }

  startCombat(encounterId: string, ambush?: 'party' | 'enemy'): void {
    const s = this.state;
    if (!s) return;
    const enc = ENCOUNTER_BY_ID[encounterId];
    if (!enc) { toast(`Unknown encounter ${encounterId}`, 'bad'); return; }
    this.autosave(`before ${enc.name}`);
    this.busy = true;
    const screen = new CombatScreen(this, encounterId, ambush, (result) => this.endCombat(encounterId, result));
    this.setScreen(screen);
  }

  private endCombat(encounterId: string, result: 'victory' | 'defeat' | 'fled'): void {
    const s = this.state!;
    const enc = ENCOUNTER_BY_ID[encounterId];
    this.busy = false;
    // Post-combat recovery: the fallen get back up (with 1 HP) unless permadeath killed them.
    for (const c of s.party) {
      c.conditions = [];
      if (!c.dead && c.hp <= 0 && (result !== 'defeat' || enc.nonlethal)) c.hp = 1;
      c.deathSaves = { successes: 0, failures: 0 }; c.stable = false;
    }
    // A dead companion (permadeath) leaves the active party for good.
    for (const c of s.party) if (c.dead && s.activeIds.includes(c.id)) {
      s.activeIds = s.activeIds.filter((id) => id !== c.id);
      if (c.companionId) { s.companions[c.companionId].inParty = false; s.companions[c.companionId].left = true; }
    }
    this.explore = new ExploreScreen(this);
    this.setScreen(this.explore);
    if (s.party[0].dead) { this.gameOver('You have fallen. Your story ends here.'); return; }
    if (result === 'victory') {
      s.flags[`won_${encounterId}`] = true;
      const sig = applyEffects(s, enc.onVictory, enc.name);
      this.handleSignals(sig);
    } else if (result === 'defeat') {
      if (enc.onDefeat) this.handleSignals(applyEffects(s, enc.onDefeat, enc.name));
      else this.gameOver('The party has fallen. The fog closes over Hollowmere.');
    } else {
      addLog(s, 'system', 'You escaped.');
      // Move the party a few steps back so the encounter does not immediately retrigger.
      resetTriggerMemory();
      this.explore.refresh();
    }
    if (activeParty(s).some((c) => canLevelUp(c))) toast('Level up available! Open the Character sheet.', 'good', 5000);
  }

  gameOver(text: string): void {
    sfx('down');
    modal('Defeat', (close) => h('div', { class: 'gameover' },
      h('p', null, text),
      h('div', { class: 'row' },
        h('button', { class: 'btn', onclick: () => { close(); this.load('auto'); } }, 'Load last autosave'),
        h('button', { class: 'btn ghost', onclick: () => { close(); this.showMenu(); } }, 'Main menu'))), { closable: false });
  }

  travel(mapId: string, x: number, y: number): void {
    const s = this.state!;
    const firstVisit = !s.maps[mapId];
    s.location = { mapId, x, y };
    mapRuntime(s, mapId);
    resetTriggerMemory();
    const m = getMap(mapId);
    if (m.hub && !s.discoveredHubs.includes(m.hub)) s.discoveredHubs.push(m.hub);
    if (mapId === 'cathedral') applyEffects(s, ['quest mq_bell cathedral']);
    if (mapId === 'undercroft') applyEffects(s, ['quest mq_bell undercroft']);
    if (mapId === 'vault') applyEffects(s, ['quest mq_bell vault']);
    sfx('door');
    playMusic(music(s, m));
    this.explore?.onMapChanged(firstVisit);
    this.autosave(`entered ${m.name}`);
  }
}
