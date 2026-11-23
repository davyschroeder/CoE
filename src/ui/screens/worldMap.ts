import type { App } from '../app';
import { h, modal, toast } from '../dom';

interface Node { id: string; name: string; x: number; y: number; map?: string; to?: [number, number]; act: string; desc: string; }

const NODES: Node[] = [
  { id: 'hollowmere', name: 'Hollowmere', x: 46, y: 62, map: 'hollowmere', to: [25, 31], act: 'Prologue', desc: 'A frontier town of lanterns and apple orchards.' },
  { id: 'cathedral', name: 'Cathedral of Saint Orlen', x: 47, y: 52, map: 'cathedral', to: [17, 27], act: 'Prologue', desc: 'A ruined cathedral north of town.' },
  { id: 'woods', name: 'The Whispering Woods', x: 30, y: 40, act: 'Act I', desc: 'A forest that grows new paths overnight.' },
  { id: 'valdros', name: 'Ruins of Valdros', x: 62, y: 30, act: 'Act I', desc: 'The abandoned Ithari city.' },
  { id: 'ashenford', name: 'Ashenford', x: 72, y: 70, act: 'Act I', desc: 'City of the Aether Conclave.' },
  { id: 'solmara', name: 'Solmara', x: 82, y: 45, act: 'Act II', desc: 'Capital of the Iron Covenant.' },
  { id: 'iron', name: 'Iron Mountains', x: 20, y: 18, act: 'Act II', desc: 'The dwarven holds.' },
  { id: 'ember', name: 'Ember Wastes', x: 15, y: 75, act: 'Act II', desc: 'A desert of glass.' },
];

/** World map: fast travel between discovered hubs. Later regions are shown but not yet playable. */
export function openWorldMap(app: App): void {
  const s = app.state!;
  const known = (n: Node) => n.id === 'hollowmere' || (n.id === 'cathedral' && !!s.flags.bell_rang && !!s.maps.cathedral);
  const svg = `<svg viewBox="0 0 100 100" class="wmap-svg" preserveAspectRatio="xMidYMid meet">
    <defs><radialGradient id="wm" cx="50%" cy="50%" r="70%"><stop offset="0%" stop-color="#e8dbb8"/><stop offset="100%" stop-color="#b9a47a"/></radialGradient></defs>
    <rect width="100" height="100" fill="url(#wm)"/>
    <path d="M5,30 Q20,10 40,15 T80,10 Q95,30 92,60 T70,95 Q40,98 20,90 T5,30Z" fill="none" stroke="#6b5432" stroke-width="0.6"/>
    <path d="M46,62 L47,52 M46,62 L30,40 M47,52 L62,30 M46,62 L72,70" stroke="#7a6240" stroke-width="0.4" stroke-dasharray="1,1"/>
    <text x="50" y="7" text-anchor="middle" font-size="4" fill="#4a3720" font-family="Georgia">ELYNDRA</text>
  </svg>`;
  const wrap = h('div', { class: 'wmap' }, h('div', { class: 'wmap-inner', html: svg }));
  const inner = wrap.firstElementChild as HTMLElement;
  for (const n of NODES) {
    const k = known(n);
    const here = s.location.mapId === n.map;
    inner.append(h('button', { class: `wm-node ${k ? 'known' : 'locked'} ${here ? 'here' : ''}`, style: { left: `${n.x}%`, top: `${n.y}%` },
      'data-tip': `${n.name} (${n.act}) — ${n.desc}${k ? (here ? ' You are here.' : ' Click to travel.') : n.act === 'Prologue' ? ' Not yet discovered.' : ' Not yet available in this build.'}`,
      onclick: () => {
        if (!k) { toast(n.act === 'Prologue' ? 'You haven\'t found a way there yet.' : `${n.name} belongs to ${n.act}, which is not yet implemented in this build.`, 'info'); return; }
        if (here) return;
        if (app.busy) return;
        handle.close();
        app.travel(n.map!, n.to![0], n.to![1]);
      } }, h('span', { class: 'dot' }), h('span', { class: 'lbl' }, n.name)));
  }
  const handle = modal('World Map', h('div', null, wrap, h('p', { class: 'muted small' }, 'Fast travel between discovered places. Regions of later acts are marked on the map but are not part of the current build.')), { wide: true });
}
