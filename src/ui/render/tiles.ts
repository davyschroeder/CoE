import type { Tileset, Lighting } from '../../data/maps/types';

/** Palette per tileset: [floor, floorAlt, wall, wallTop, accent]. */
const PALETTES: Record<Tileset, Record<string, string>> = {
  town: { floor: '#3c4a2f', alt: '#43532f', wall: '#5a4634', top: '#7a5c3e', road: '#6b6358', path: '#6a5838' },
  interior: { floor: '#5b4330', alt: '#634a34', wall: '#3a2b20', top: '#4f3a2a', road: '#5b4330', path: '#5b4330' },
  cathedral: { floor: '#4a4844', alt: '#514f4a', wall: '#2f2d2b', top: '#4a4642', road: '#5a5650', path: '#5a5040' },
  undercroft: { floor: '#3a3634', alt: '#403b38', wall: '#1f1c1b', top: '#2f2a28', road: '#3a3634', path: '#3a3634' },
  vault: { floor: '#262a38', alt: '#2b3042', wall: '#101320', top: '#1c2135', road: '#262a38', path: '#262a38' },
  forest: { floor: '#2d3d24', alt: '#324428', wall: '#3b3026', top: '#4f4030', road: '#5a5040', path: '#5b4a33' },
  ruins: { floor: '#6a665c', alt: '#706b60', wall: '#8c867a', top: '#a59f92', road: '#7d776a', path: '#5f5546' },
  dome: { floor: '#3a3a4a', alt: '#40404f', wall: '#1c1c28', top: '#2c2c3c', road: '#3a3a4a', path: '#3a3a4a' },
};

function hash(x: number, y: number): number {
  let h = x * 374761393 + y * 668265263;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function drawTile(ctx: CanvasRenderingContext2D, ch: string, x: number, y: number, px: number, py: number, s: number, set: Tileset, time: number): void {
  const p = PALETTES[set];
  const r = hash(x, y);
  const floor = r < 0.5 ? p.floor : p.alt;
  const fill = (c: string) => { ctx.fillStyle = c; ctx.fillRect(px, py, s, s); };
  const dot = (c: string, n: number, size = 2) => {
    ctx.fillStyle = c;
    for (let i = 0; i < n; i++) ctx.fillRect(px + hash(x + i * 7, y + i * 13) * (s - size), py + hash(x + i * 11, y - i * 5) * (s - size), size, size);
  };
  switch (ch) {
    case ',': fill(floor); dot('rgba(120,160,80,0.35)', 4); break;
    case '=': fill(p.road); ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.strokeRect(px + 0.5, py + 0.5, s / 2, s / 2); ctx.strokeRect(px + s / 2 + 0.5, py + s / 2 + 0.5, s / 2 - 1, s / 2 - 1); break;
    case ':': fill(p.path); dot('rgba(0,0,0,0.2)', 3); break;
    case '.': fill(floor); if (set !== 'town') { ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.strokeRect(px + 0.5, py + 0.5, s - 1, s - 1); } break;
    case 'r': fill('#6a2d2d'); break;
    case '_': fill('#6b5236'); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(px, py + (i * s) / 4); ctx.lineTo(px + s, py + (i * s) / 4); ctx.stroke(); } break;
    case '#': case 'W': {
      fill(ch === 'W' ? '#4b3828' : p.wall);
      ctx.fillStyle = ch === 'W' ? '#6d5038' : p.top;
      ctx.fillRect(px, py, s, s * 0.7);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      for (let i = 1; i < 3; i++) { ctx.beginPath(); ctx.moveTo(px, py + i * s * 0.23); ctx.lineTo(px + s, py + i * s * 0.23); ctx.stroke(); }
      break;
    }
    case '~': fill('#1d3a52'); ctx.fillStyle = 'rgba(140,190,230,0.25)'; ctx.fillRect(px + ((time / 60 + x * 5) % s), py + s * 0.4, s * 0.4, 2); break;
    case 'w': fill('#2e5068'); dot('rgba(180,220,255,0.3)', 3); break;
    case 'T': fill(set === 'town' ? p.floor : floor); ctx.fillStyle = '#2a3d1f'; ctx.beginPath(); ctx.arc(px + s / 2, py + s / 2, s * 0.48, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#3b5a2a'; ctx.beginPath(); ctx.arc(px + s * 0.42, py + s * 0.4, s * 0.28, 0, Math.PI * 2); ctx.fill(); break;
    case 't': fill(floor); ctx.fillStyle = '#41612f'; ctx.beginPath(); ctx.arc(px + s / 2, py + s / 2, s * 0.32, 0, Math.PI * 2); ctx.fill(); break;
    case '%': fill(floor); ctx.fillStyle = '#6b655c'; for (let i = 0; i < 4; i++) ctx.fillRect(px + hash(x + i, y) * s * 0.7, py + hash(x, y + i) * s * 0.7, s * 0.3, s * 0.25); break;
    case 'x': fill(floor); ctx.fillStyle = '#d6cfb8'; for (let i = 0; i < 5; i++) ctx.fillRect(px + hash(x + i, y * 3) * s * 0.8, py + hash(x * 3, y + i) * s * 0.8, s * 0.25, s * 0.08); break;
    case 'c': fill(floor); ctx.fillStyle = '#7a5a36'; ctx.fillRect(px + s * 0.12, py + s * 0.12, s * 0.76, s * 0.76); ctx.strokeStyle = '#3e2c18'; ctx.strokeRect(px + s * 0.12, py + s * 0.12, s * 0.76, s * 0.76); ctx.beginPath(); ctx.moveTo(px + s * 0.12, py + s * 0.12); ctx.lineTo(px + s * 0.88, py + s * 0.88); ctx.stroke(); break;
    case 'b': fill(floor); ctx.fillStyle = '#6b4423'; ctx.beginPath(); ctx.ellipse(px + s / 2, py + s / 2, s * 0.34, s * 0.4, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#b8862b'; ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 1; ctx.fillStyle = '#ffb347'; ctx.font = `${s * 0.4}px serif`; ctx.textAlign = 'center'; ctx.fillText('!', px + s / 2, py + s * 0.65); break;
    case 'f': fill(floor); ctx.fillStyle = '#3a3330'; ctx.fillRect(px + s * 0.2, py + s * 0.5, s * 0.6, s * 0.4); flame(ctx, px + s / 2, py + s * 0.45, s * 0.35, time + x * 100); break;
    case 'F': fill('#3b2416'); flame(ctx, px + s / 2, py + s * 0.6, s * 0.3, time + x * 77 + y * 31); break;
    case 'a': fill('#2f4a1e'); ctx.fillStyle = `rgba(150,230,90,${0.25 + 0.1 * Math.sin(time / 300 + x)})`; ctx.beginPath(); ctx.ellipse(px + s / 2, py + s / 2, s * 0.45, s * 0.35, 0, 0, Math.PI * 2); ctx.fill(); break;
    case 'h': fill(set === 'vault' ? '#363c55' : '#5c5850'); ctx.strokeStyle = 'rgba(255,240,200,0.18)'; ctx.strokeRect(px + 1.5, py + 1.5, s - 3, s - 3); break;
    case 'D': fill(floor); ctx.fillStyle = '#7b5530'; ctx.fillRect(px + s * 0.1, py + s * 0.1, s * 0.8, s * 0.8); ctx.fillStyle = '#d4a45a'; ctx.fillRect(px + s * 0.65, py + s * 0.45, s * 0.1, s * 0.1); break;
    case '+': fill(floor); ctx.fillStyle = '#5a3f28'; ctx.fillRect(px, py + s * 0.25, s, s * 0.22); ctx.fillRect(px, py + s * 0.6, s, s * 0.12); break;
    case 'A': fill(floor); ctx.fillStyle = '#cfc6b0'; ctx.fillRect(px + s * 0.05, py + s * 0.2, s * 0.9, s * 0.6); ctx.fillStyle = '#9c8f70'; ctx.fillRect(px + s * 0.05, py + s * 0.7, s * 0.9, s * 0.1); break;
    case 'P': fill(floor); ctx.fillStyle = set === 'vault' ? '#3a4a7a' : '#6e6a62'; ctx.beginPath(); ctx.arc(px + s / 2, py + s / 2, s * 0.42, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.arc(px + s * 0.4, py + s * 0.4, s * 0.15, 0, Math.PI * 2); ctx.fill(); break;
    case 'g': fill(floor); ctx.fillStyle = '#8a857b'; ctx.beginPath(); ctx.moveTo(px + s * 0.25, py + s * 0.9); ctx.lineTo(px + s * 0.25, py + s * 0.35); ctx.arc(px + s / 2, py + s * 0.35, s * 0.25, Math.PI, 0); ctx.lineTo(px + s * 0.75, py + s * 0.9); ctx.fill(); break;
    case 'l': fill(p.road); ctx.fillStyle = '#2b2620'; ctx.fillRect(px + s * 0.45, py + s * 0.3, s * 0.1, s * 0.65); glow(ctx, px + s / 2, py + s * 0.25, s * 0.18, '#ffcf6b'); break;
    case 'o': fill(floor); ctx.fillStyle = '#7a756c'; ctx.beginPath(); ctx.arc(px + s / 2, py + s / 2, s * 0.42, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#0d1418'; ctx.beginPath(); ctx.arc(px + s / 2, py + s / 2, s * 0.25, 0, Math.PI * 2); ctx.fill(); break;
    case 'n': fill(floor); ctx.fillStyle = '#6b5236'; ctx.fillRect(px, py + s * 0.4, s, s * 0.12); ctx.fillRect(px + s * 0.2, py + s * 0.2, s * 0.1, s * 0.6); ctx.fillRect(px + s * 0.7, py + s * 0.2, s * 0.1, s * 0.6); break;
    case 'B': case 'K': fill(floor); ctx.fillStyle = ch === 'K' ? '#6e4c2c' : '#4f3a2a'; ctx.fillRect(px + s * 0.08, py + s * 0.15, s * 0.84, s * 0.7); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.strokeRect(px + s * 0.08, py + s * 0.15, s * 0.84, s * 0.7); break;
    case 'v': fill('#050505'); ctx.strokeStyle = 'rgba(80,60,40,0.6)'; ctx.strokeRect(px + 1, py + 1, s - 2, s - 2); break;
    case 's': fill(floor); ctx.fillStyle = 'rgba(0,0,0,0.35)'; for (let i = 0; i < 4; i++) ctx.fillRect(px, py + i * s / 4, s * (1 - i * 0.18), s / 8); break;
    case 'L': fill(p.road); ctx.fillStyle = '#3d2e1c'; ctx.beginPath(); ctx.arc(px + s / 2, py + s / 2, s * 0.5, 0, Math.PI * 2); ctx.fill(); for (let i = 0; i < 6; i++) glow(ctx, px + hash(i, 3) * s, py + hash(3, i) * s, s * 0.12, ['#ffcf6b', '#ff8f6b', '#9fd3ff', '#c99bff'][i % 4]); break;
    default: fill(floor);
  }
}

function flame(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number) {
  const k = 1 + 0.15 * Math.sin(t / 90);
  glow(ctx, x, y, r * 1.6, 'rgba(255,140,40,0.5)');
  ctx.fillStyle = '#ff9a2e'; ctx.beginPath(); ctx.ellipse(x, y, r * 0.5, r * k, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffe17a'; ctx.beginPath(); ctx.ellipse(x, y + r * 0.2, r * 0.25, r * 0.5 * k, 0, 0, Math.PI * 2); ctx.fill();
}

export function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2);
  g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 2, 0, Math.PI * 2); ctx.fill();
}

export function lightingTint(l: Lighting): { color: string; alpha: number } {
  switch (l) {
    case 'day': return { color: '0,0,0', alpha: 0 };
    case 'dusk': return { color: '40,20,60', alpha: 0.28 };
    case 'night': return { color: '5,8,25', alpha: 0.45 };
    case 'fog': return { color: '150,160,175', alpha: 0.22 };
    case 'dark': return { color: '0,0,8', alpha: 0.35 };
  }
}

/** Draw a creature token: coloured disc with a glyph and facing ring. */
export function drawToken(ctx: CanvasRenderingContext2D, px: number, py: number, s: number, color: string, glyph: string, opts: { ring?: string; dim?: boolean; selected?: boolean; enemy?: boolean } = {}): void {
  const cx = px + s / 2, cy = py + s / 2;
  ctx.save();
  if (opts.dim) ctx.globalAlpha = 0.45;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(cx, cy + s * 0.32, s * 0.36, s * 0.12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(cx, cy, s * 0.38, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = opts.selected ? 3 : 2;
  ctx.strokeStyle = opts.ring ?? (opts.enemy ? '#8b1e1e' : '#d4b26a');
  ctx.stroke();
  ctx.fillStyle = '#10131c';
  ctx.font = `bold ${Math.floor(s * 0.42)}px Georgia, serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(glyph, cx, cy + 1);
  ctx.restore();
}
