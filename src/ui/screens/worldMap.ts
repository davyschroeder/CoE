import type { App } from '../app';
import { h, modal, toast } from '../dom';
import { rollTravelEvent, travelHours } from '../../engine/travel';
import { getMap } from '../../engine/exploration';
import { evalCond } from '../../engine/conditions';

interface Node { id: string; name: string; x: number; y: number; map?: string; to?: [number, number]; act: string; desc: string; knownIf?: string; }

const NODES: Node[] = [
  { id: 'hollowmere', name: 'Hollowmere', x: 46, y: 62, map: 'hollowmere', to: [25, 31], act: 'Prologue', desc: 'A frontier town of lanterns and apple orchards.' },
  { id: 'cathedral', name: 'Cathedral of Saint Orlen', x: 47, y: 52, map: 'cathedral', to: [17, 27], act: 'Prologue', desc: 'A ruined cathedral north of town.', knownIf: 'bell_rang && visited:cathedral' },
  { id: 'woods', name: 'The Whispering Woods', x: 30, y: 40, map: 'woods', to: [1, 20], act: 'Act I', desc: 'A forest that grows new paths overnight.' },
  { id: 'valdros', name: 'Ruins of Valdros', x: 62, y: 30, map: 'valdros', to: [23, 37], act: 'Act I', desc: 'The abandoned Ithari city, deep in the Woods.' },
  { id: 'ashenford', name: 'Ashenford', x: 72, y: 70, map: 'ashenford', to: [27, 1], act: 'Act I', desc: 'A smoky river town of glassworks and Covenant tax-houses.' },
  { id: 'solmara', name: 'Solmara', x: 82, y: 45, act: 'Act II', desc: 'Capital of the Iron Covenant.' },
  { id: 'iron', name: 'Iron Mountains', x: 20, y: 18, act: 'Act II', desc: 'The dwarven holds.' },
  { id: 'ember', name: 'Ember Wastes', x: 15, y: 75, act: 'Act II', desc: 'A desert of glass.' },
];

/** Region (hub) the party is currently in, for travel times. */
function currentHub(mapId: string): string {
  if (['hollowmere', 'inn', 'cathedral', 'undercroft', 'vault'].includes(mapId)) return mapId === 'hollowmere' || mapId === 'inn' ? 'hollowmere' : 'cathedral';
  if (mapId.startsWith('valdros')) return 'valdros';
  return mapId;
}

/** World map: travel between discovered places. Long journeys take hours and may bring road events. */
export function openWorldMap(app: App): void {
  const s = app.state!;
  const known = (n: Node) => {
    if (!n.map) return false;
    if (n.knownIf) { try { return evalCond(s, n.knownIf); } catch { return false; } }
    return n.id === 'hollowmere' || s.discoveredHubs.includes(n.id);
  };
  const here = currentHub(s.location.mapId);
  const svg = `<svg viewBox="0 0 100 100" class="wmap-svg" preserveAspectRatio="xMidYMid meet">
    <defs><radialGradient id="wm" cx="50%" cy="50%" r="70%"><stop offset="0%" stop-color="#e8dbb8"/><stop offset="100%" stop-color="#b9a47a"/></radialGradient></defs>
    <rect width="100" height="100" fill="url(#wm)"/>
    <path d="M5,30 Q20,10 40,15 T80,10 Q95,30 92,60 T70,95 Q40,98 20,90 T5,30Z" fill="none" stroke="#6b5432" stroke-width="0.6"/>
    <path d="M46,62 L47,52 M46,62 L30,40 L62,30 M46,62 L72,70 M72,70 L82,45" stroke="#7a6240" stroke-width="0.4" stroke-dasharray="1,1"/>
    <path d="M60,74 Q72,72 95,76" stroke="#5a7fa0" stroke-width="0.8" fill="none"/>
    <text x="50" y="7" text-anchor="middle" font-size="4" fill="#4a3720" font-family="Georgia">ELYNDRA</text>
  </svg>`;
  const wrap = h('div', { class: 'wmap' }, h('div', { class: 'wmap-inner', html: svg }));
  const inner = wrap.firstElementChild as HTMLElement;
  for (const n of NODES) {
    const k = known(n);
    const isHere = here === n.id;
    const hours = n.map ? travelHours(here, n.id) : 0;
    inner.append(h('button', { class: `wm-node ${k ? 'known' : 'locked'} ${isHere ? 'here' : ''}`, style: { left: `${n.x}%`, top: `${n.y}%` },
      'data-tip': `${n.name} (${n.act}) — ${n.desc}${k ? (isHere ? ' You are here.' : ` About ${hours} hours away. Click to travel.`) : n.act === 'Prologue' || n.act === 'Act I' ? ' Not yet discovered.' : ' Not yet available in this build.'}`,
      onclick: () => {
        if (!k) { toast(n.act === 'Prologue' || n.act === 'Act I' ? 'You haven’t found the way there yet.' : `${n.name} belongs to ${n.act}, which is not yet implemented in this build.`, 'info'); return; }
        if (app.busy) return;
        if (isHere && getMap(s.location.mapId).id === n.map) { handle.close(); return; }
        handle.close();
        const ev = rollTravelEvent(s, here, n.id);
        app.travel(n.map!, n.to![0], n.to![1]);
        if (ev?.encounter) { toast('Trouble on the road!', 'bad', 3500); app.startCombat(ev.encounter, 'enemy'); }
        else if (ev?.dialogue) app.openDialogue(ev.dialogue);
      } }, h('span', { class: 'dot' }), h('span', { class: 'lbl' }, n.name)));
  }
  const handle = modal('World Map', h('div', null, wrap, h('p', { class: 'muted small' }, 'Fast travel between discovered places. Long journeys take hours and the road is not always empty. Regions of later acts are marked but not part of the current build.')), { wide: true });
}
