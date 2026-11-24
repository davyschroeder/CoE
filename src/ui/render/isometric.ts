import type { Character } from '../../engine/types';
import type { Tileset } from '../../data/maps/types';
import { MATERIALS, materialAtlasStatus, drawMaterialPlane } from './materials';

/** A 2:1 diamond camera. Integer world coordinates identify tile centres. */
export interface IsoView { tileWidth: number; originX: number; originY: number; }
export interface IsoPoint { x: number; y: number; }
export interface IsoDrawOptions { dim?: boolean; grid?: boolean; fade?: number; }
export interface IsoBuilding { x: number; y: number; w: number; h: number; id?: string; doors?: { x: number; y: number }[]; }
export interface IsoTokenOptions {
  character?: Character; npcId?: string; role?: string; enemy?: boolean; selected?: boolean;
  dim?: boolean; time?: number; facing?: number; sprite?: CanvasImageSource; down?: boolean; ring?: string;
}

export function createIsoView(width: number, height: number, camX: number, camY: number, tileWidth: number, offsetY = 0): IsoView {
  return { tileWidth, originX: width / 2 - (camX - camY) * tileWidth / 2, originY: height / 2 + offsetY - (camX + camY) * tileWidth / 4 };
}
export function isoPoint(x: number, y: number, view: IsoView): IsoPoint {
  return { x: view.originX + (x - y) * view.tileWidth / 2, y: view.originY + (x + y) * view.tileWidth / 4 };
}
export function isoTileAt(px: number, py: number, view: IsoView): IsoPoint {
  const dx = (px - view.originX) / (view.tileWidth / 2), dy = (py - view.originY) / (view.tileWidth / 4);
  return { x: Math.round((dx + dy) / 2), y: Math.round((dy - dx) / 2) };
}
export function isoElevation(ch: string, width: number): number { return ch === 'h' ? width * 0.065 : 0; }
export const HAS_ISO_PROP = new Set('#WTt%cbfFhD+APglonBKsxLC'.split(''));
export function hasIsoProp(ch: string): boolean { return HAS_ISO_PROP.has(ch); }

const TAU = Math.PI * 2;
function hash(x: number, y: number, salt = 0): number {
  let z = Math.imul(x + salt * 29, 374761393) + Math.imul(y + salt * 73, 668265263);
  z = Math.imul(z ^ (z >>> 13), 1274126177);
  return ((z ^ (z >>> 16)) >>> 0) / 4294967296;
}
function poly(ctx: CanvasRenderingContext2D, points: [number, number][], fill: string, stroke?: string, lineWidth = .007): void {
  ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
}
function line(ctx: CanvasRenderingContext2D, points: [number, number][], stroke: string, width = .009): void {
  ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
}
function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, stroke?: string): void {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = .008; ctx.stroke(); }
}
function diamond(ctx: CanvasRenderingContext2D, x = 0, y = 0, width = 1): void {
  ctx.beginPath(); ctx.moveTo(x, y - width / 4); ctx.lineTo(x + width / 2, y);
  ctx.lineTo(x, y + width / 4); ctx.lineTo(x - width / 2, y); ctx.closePath();
}
function uv(u: number, v: number, z = 0): [number, number] { return [(u - v) / 2, (u + v) / 4 - z]; }
function slab(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, z: number, top: string, left: string, right: string, bottom = 0): void {
  const a = uv(x, y, bottom), b = uv(x + w, y, bottom), c = uv(x + w, y + h, bottom), d = uv(x, y + h, bottom);
  const at = uv(x, y, z), bt = uv(x + w, y, z), ct = uv(x + w, y + h, z), dt = uv(x, y + h, z);
  poly(ctx, [b, c, ct, bt], right, 'rgba(6,9,14,.36)', .006);
  poly(ctx, [c, d, dt, ct], left, 'rgba(6,9,14,.34)', .006);
  poly(ctx, [at, bt, ct, dt], top, 'rgba(224,214,182,.12)', .006);
  // The fourth rear edge is deliberately omitted: neighbouring tiles join without seams.
  void a;
}
function lightGlow(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string): void {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, radius, 0, TAU); ctx.fill();
}

interface Palette { ground: string; grass: string; grassLight: string; road: string; stone: string; stoneLight: string; shadow: string; accent: string; }
const PALETTE: Record<Tileset, Palette> = {
  town: { ground: '#4b5435', grass: '#34482e', grassLight: '#657748', road: '#897867', stone: '#6d6e66', stoneLight: '#a3a68c', shadow: '#343c37', accent: '#d5a85b' },
  forest: { ground: '#374333', grass: '#253f31', grassLight: '#58754b', road: '#796552', stone: '#666e62', stoneLight: '#909b80', shadow: '#293b33', accent: '#8fbb7c' },
  interior: { ground: '#715440', grass: '#48523a', grassLight: '#77815b', road: '#755842', stone: '#645b54', stoneLight: '#a8997b', shadow: '#302d30', accent: '#e1b467' },
  cathedral: { ground: '#6c706a', grass: '#3c5039', grassLight: '#6c7e54', road: '#797a6a', stone: '#6e746d', stoneLight: '#a0a18c', shadow: '#353d40', accent: '#d5bd80' },
  undercroft: { ground: '#545d62', grass: '#334940', grassLight: '#597162', road: '#637072', stone: '#5c696b', stoneLight: '#889792', shadow: '#2b3c43', accent: '#adcaad' },
  vault: { ground: '#333b56', grass: '#334652', grassLight: '#627480', road: '#48516a', stone: '#485675', stoneLight: '#7d91ac', shadow: '#242c49', accent: '#b89ee8' },
  ruins: { ground: '#807c6b', grass: '#42503b', grassLight: '#6e7b52', road: '#948d7a', stone: '#878b7b', stoneLight: '#babca1', shadow: '#464f49', accent: '#c6af76' },
  dome: { ground: '#4c4b62', grass: '#3d4850', grassLight: '#697677', road: '#666378', stone: '#625f79', stoneLight: '#9f95b1', shadow: '#34334c', accent: '#d0a4e2' },
};

const groundCache = new Map<string, HTMLCanvasElement>();
const propCache = new Map<string, HTMLCanvasElement>();
let materialVersion = -1;
function canvas(w: number, h: number): HTMLCanvasElement { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function syncMaterialCaches(): number {
  const version = materialAtlasStatus().version;
  if (version !== materialVersion) { groundCache.clear(); propCache.clear(); materialVersion = version; }
  return version;
}
function materialPlane(ctx: CanvasRenderingContext2D, index: number, a: [number, number], b: [number, number], d: [number, number]): boolean {
  return drawMaterialPlane(ctx, index, { x: a[0], y: a[1] }, { x: b[0], y: b[1] }, { x: d[0], y: d[1] });
}

type AtlasName = 'miniatures' | 'props' | 'civilians';
interface AtlasFrame { x: number; y: number; w: number; h: number; }
const artAtlases = new Map<AtlasName, HTMLImageElement>();
const artFrames = new WeakMap<HTMLImageElement, AtlasFrame[]>();
function getArtAtlas(name: AtlasName): HTMLImageElement | null {
  if (typeof Image === 'undefined') return null;
  let im = artAtlases.get(name);
  if (!im) { im = new Image(); im.src = `${import.meta.env.BASE_URL}art/${name}.png`; artAtlases.set(name, im); }
  return im.complete && im.naturalWidth ? im : null;
}
function atlasFrame(im: HTMLImageElement, index: number): AtlasFrame {
  let frames = artFrames.get(im);
  if (!frames) {
    frames = [];
    let pixels: Uint8ClampedArray | null = null;
    // Trim transparent cell padding once. This anchors short children and narrow
    // lanterns just as accurately as broad trees, regardless of atlas resolution.
    try { const c = canvas(im.naturalWidth, im.naturalHeight), cx = c.getContext('2d')!; cx.drawImage(im, 0, 0); pixels = cx.getImageData(0, 0, c.width, c.height).data; } catch { /* file:// implementations can prohibit readback; full cells are safe. */ }
    for (let i = 0; i < 16; i++) {
      const x0 = Math.round(i % 4 * im.naturalWidth / 4), y0 = Math.round(Math.floor(i / 4) * im.naturalHeight / 4);
      const x1 = Math.round((i % 4 + 1) * im.naturalWidth / 4), y1 = Math.round((Math.floor(i / 4) + 1) * im.naturalHeight / 4);
      let left = x1, top = y1, right = x0, bottom = y0;
      if (pixels) for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (pixels[(y * im.naturalWidth + x) * 4 + 3] > 24) { left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y); }
      frames.push(pixels && right > left ? { x: left, y: top, w: right - left + 1, h: bottom - top + 1 } : { x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
    }
    artFrames.set(im, frames);
  }
  return frames[index];
}

function paintedProp(ctx: CanvasRenderingContext2D, ch: string, variant: number, set: Tileset, x: number, y: number, width: number): boolean {
  let index: number, height: number;
  switch (ch) {
    case 'T': index = set === 'town' && variant % 4 === 0 || set === 'ruins' && variant % 3 === 0 ? 1 : 0; height = 1.20 + variant % 3 * .09; break;
    case 'L': index = 1; height = 1.56; break;
    case 't': index = 12; height = .38; break;
    case '%': index = set === 'vault' || set === 'dome' ? 2 : 3; height = index === 2 ? .68 : .44; break;
    case 'P': index = 4; height = 1.04; break;
    case 'l': index = 5; height = 1.08; break;
    case 'o': index = 6; height = .91; break;
    case 'C': index = 7; height = .46; break;
    case 'c': index = 8; height = .57; break;
    case 'b': index = 9; height = .49; break;
    case 'A': index = 10; height = .62; break;
    case 'f': index = 11; height = .72; break;
    case '+': index = 13; height = .43; break;
    case 'D': index = 14; height = 1.01; break;
    case 's': if (set === 'interior') return false; index = 15; height = .43; break;
    default: return false;
  }
  const im = getArtAtlas('props'); if (!im) return false;
  const f = atlasFrame(im, index), dh = height * width, dw = dh * f.w / f.h;
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.ellipse(width * .03, width * .065, width * (ch === 'T' || ch === 'L' ? .48 : .29), width * .11, 0, 0, TAU); ctx.fillStyle = 'rgba(4,12,17,.24)'; ctx.fill();
  ctx.drawImage(im, f.x, f.y, f.w, f.h, -dw / 2, -dh + width * .10, dw, dh);
  ctx.restore(); return true;
}

function drawGroundArt(ctx: CanvasRenderingContext2D, ch: string, variant: number, set: Tileset): void {
  const p = PALETTE[set];
  const water = ch === '~' || ch === 'w';
  const grass = ch === ',' || ch === 'T' || ch === 't' || (set === 'forest' && ch === '.');
  const plank = ch === '_' || (set === 'interior' && ch === '.');
  const road = ch === '=' || ch === 'l' || ch === 'L';
  const dirt = ch === ':';
  const floor = water ? (ch === '~' ? '#24485c' : '#3e6871') : ch === 'v' ? '#101923' : ch === 'a' ? '#40542e' : grass ? p.grass : dirt ? '#6b5948' : plank ? '#72553e' : road ? p.road : ch === 'r' ? '#6b333a' : p.ground;
  diamond(ctx, 0, 0, 1.018); ctx.fillStyle = floor; ctx.fill();
  ctx.save(); diamond(ctx, 0, 0, 1.015); ctx.clip();
  const defaultMaterial: Record<Tileset, number> = { town: MATERIALS.cobblestone, forest: MATERIALS.forestFloor, interior: MATERIALS.woodPlanks, cathedral: MATERIALS.cathedralStone, undercroft: MATERIALS.cryptStone, vault: MATERIALS.vaultSlate, ruins: MATERIALS.ruinsStone, dome: MATERIALS.arcanePlumStone };
  const texture = water ? MATERIALS.water : ch === 'r' ? MATERIALS.redCarpet : grass ? (set === 'forest' ? MATERIALS.forestFloor : MATERIALS.grass) : dirt ? MATERIALS.earth : plank ? MATERIALS.woodPlanks : road ? MATERIALS.cobblestone : ch === 'a' ? MATERIALS.grass : defaultMaterial[set];
  ctx.save(); ctx.globalAlpha *= .83;
  const textured = ch !== 'v' && materialPlane(ctx, texture, [-.508, 0], [0, -.254], [0, .254]);
  ctx.restore();
  // A soft light fall-off ties repeated ground textures into the painted scenery.
  const g = ctx.createLinearGradient(-.5, -.25, .5, .25);
  g.addColorStop(0, 'rgba(248,227,172,.075)'); g.addColorStop(.48, 'rgba(180,180,160,.015)'); g.addColorStop(1, 'rgba(11,22,29,.13)');
  ctx.fillStyle = g; ctx.fillRect(-.55, -.3, 1.1, .6);
  ctx.save(); if (textured) ctx.globalAlpha *= .27;
  for (let i = 0; i < 44; i++) {
    const u = hash(variant, i, 12) - .5, v = hash(i, variant, 43) - .5, [x, y] = uv(u, v);
    const r = .008 + hash(i, variant, 3) * .013;
    ellipse(ctx, x, y, r, r * .4, i % 3 === 0 ? 'rgba(230,219,175,.08)' : 'rgba(8,18,23,.09)');
  }
  if (grass) {
    for (let i = 0; i < 21; i++) {
      const u = hash(i, variant, 34) - .5, v = hash(variant, i, 98) - .5, [x, y] = uv(u, v);
      line(ctx, [[x - .015, y], [x - .019, y - .025], [x, y], [x + .01, y - .038]], i % 3 ? p.grassLight : '#88975e', .005);
      if (i % 8 === 0) { ellipse(ctx, x, y - .035, .008, .004, set === 'forest' ? '#abc29c' : '#dfb897'); }
    }
    // Scattered moss islands hide the straight tile edges.
    for (let i = 0; i < 5; i++) {
      const [x, y] = uv(hash(i, variant, 6) - .5, hash(i, variant, 7) - .5);
      ellipse(ctx, x, y, .07, .023, 'rgba(100,121,64,.13)');
    }
  } else if (plank) {
    for (let i = -3; i <= 3; i++) {
      const v = i / 6;
      line(ctx, [uv(-.5, v), uv(.5, v)], '#342f2b', .014);
      line(ctx, [uv(-.5, v + .018), uv(.5, v + .018)], '#9c7951', .008);
      const cut = ((i + variant) % 3) / 3 - .5;
      line(ctx, [uv(cut, v), uv(cut, v + .16)], '#49372c', .008);
      for (let j = 0; j < 2; j++) {
        const [x, y] = uv(hash(i + 10, j, variant) - .5, v + .08);
        line(ctx, [[x - .06, y - .025], [x + .05, y + .025]], 'rgba(199,152,89,.15)', .005);
      }
    }
  } else if (road || (!water && !dirt && ch !== 'v' && ch !== 'a')) {
    const n = road ? 4 : 2;
    for (let j = 0; j < n; j++) for (let i = -1; i < n + 1; i++) {
      const ox = -.5 + i / n + (j % 2) * .5 / n, oy = -.5 + j / n;
      const points = [uv(ox + .012, oy + .012), uv(ox + 1 / n - .012, oy + .012), uv(ox + 1 / n - .012, oy + 1 / n - .012), uv(ox + .012, oy + 1 / n - .012)];
      poly(ctx, points, (i + j + variant) % 3 === 0 ? 'rgba(227,221,194,.055)' : 'rgba(18,25,32,.025)', 'rgba(20,26,30,.31)', .007);
      line(ctx, [points[0], points[1]], 'rgba(235,226,200,.13)', .005);
    }
    if (variant % 4 === 0) line(ctx, [[-.18, -.09], [-.08, -.035], [-.1, .012], [.02, .05]], 'rgba(8,17,23,.3)', .005);
    if ((set === 'ruins' || set === 'cathedral') && variant % 3 === 0) ellipse(ctx, .22, .05, .13, .026, 'rgba(66,92,50,.26)');
    if ((set === 'vault' || set === 'dome') && variant % 5 === 0) {
      line(ctx, [[-.43, 0], [-.12, .13], [.04, .07], [.4, .025]], 'rgba(173,141,240,.3)', .012);
      line(ctx, [[-.43, 0], [-.12, .13], [.04, .07], [.4, .025]], 'rgba(205,186,255,.45)', .003);
    }
  } else if (dirt) {
    for (let i = 0; i < 14; i++) {
      const [x, y] = uv(hash(i, variant, 111) - .5, hash(i, variant, 217) - .5);
      ellipse(ctx, x, y, .018, .009, i % 3 ? '#8d8065' : '#4f4b41');
    }
    line(ctx, [uv(-.47, -.23), uv(.47, -.23)], 'rgba(30,27,22,.13)', .026);
    line(ctx, [uv(-.47, .23), uv(.47, .23)], 'rgba(30,27,22,.13)', .026);
  } else if (water) {
    for (let i = 0; i < 6; i++) {
      const [x, y] = uv(hash(i, variant, 3) - .5, hash(i, variant, 7) - .5);
      line(ctx, [[x - .07, y], [x - .02, y - .009], [x + .04, y]], 'rgba(156,203,197,.13)', .006);
    }
    if (ch === 'w') for (let i = 0; i < 5; i++) {
      const [x, y] = uv(hash(i, variant, 22) - .5, hash(i, variant, 24) - .5);
      ellipse(ctx, x, y, .04, .013, 'rgba(123,143,121,.28)');
    }
  }
  ctx.restore(); ctx.restore();
}

export function drawIsoGround(ctx: CanvasRenderingContext2D, ch: string, x: number, y: number, view: IsoView, set: Tileset, time: number, opts: IsoDrawOptions = {}): void {
  const point = isoPoint(x, y, view), w = view.tileWidth;
  const variant = Math.floor(hash(x, y) * 16);
  const key = `${syncMaterialCaches()}:${set}:${ch}:${variant}`;
  let im = groundCache.get(key);
  if (!im) {
    im = canvas(132, 70); const c = im.getContext('2d')!;
    c.translate(66, 35); c.scale(128, 128); drawGroundArt(c, ch, variant, set);
    groundCache.set(key, im);
    if (groundCache.size > 512) groundCache.delete(groundCache.keys().next().value!);
  }
  ctx.save();
  if (opts.dim) ctx.globalAlpha = .34;
  ctx.drawImage(im, point.x - w * 66 / 128, point.y - w * 35 / 128, w * 132 / 128, w * 70 / 128);
  if ((ch === '~' || ch === 'w') && !opts.dim) {
    ctx.translate(point.x, point.y); ctx.scale(w, w); ctx.save(); diamond(ctx); ctx.clip();
    const phase = time / 2300 + x * .34 + y * .67;
    for (let i = 0; i < 2; i++) {
      const yy = -.12 + i * .17 + Math.sin(phase + i) * .02;
      line(ctx, [[-.24, yy], [-.07, yy - .012], [.13, yy], [.22, yy - .004]], `rgba(172,214,215,${.12 + .06 * Math.sin(phase)})`, .006);
    }
    ctx.restore();
  } else if (ch === 'a' && !opts.dim) {
    ctx.translate(point.x, point.y); ctx.scale(w, w);
    ellipse(ctx, 0, 0, .34, .15, `rgba(156,208,78,${.12 + .05 * Math.sin(time / 600 + x)})`);
    for (let i = 0; i < 3; i++) { const [xx, yy] = uv(hash(x + i, y) * .6 - .3, hash(y + i, x) * .6 - .3); ellipse(ctx, xx, yy, .015 + .004 * Math.sin(time / 300 + i), .008, 'rgba(212,238,137,.34)'); }
  }
  ctx.restore();
  if (opts.grid) drawIsoHighlight(ctx, x, y, view, 'rgba(0,0,0,0)', 'rgba(200,200,188,.13)');
}

export function drawIsoHighlight(ctx: CanvasRenderingContext2D, x: number, y: number, view: IsoView, fill: string, stroke?: string): void {
  const p = isoPoint(x, y, view);
  ctx.save(); diamond(ctx, p.x, p.y, view.tileWidth * .96); ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = Math.max(1, view.tileWidth / 70); ctx.stroke(); }
  ctx.restore();
}

function tree(ctx: CanvasRenderingContext2D, variant: number, set: Tileset, small = false, festival = false): void {
  const tall = small ? .47 : festival ? 1.35 : 1.06 + (variant % 3) * .08;
  const spread = small ? .35 : festival ? .67 : .54;
  ellipse(ctx, .09, .08, spread * .8, spread * .32, 'rgba(3,13,18,.32)');
  // Root flare, tapering trunk, and branches remain readable under layered leaves.
  poly(ctx, [[-.12, .04], [-.045, -.13], [-.055, -tall * .65], [.02, -tall * .76], [.065, -.17], [.16, .06], [.065, .015], [0, -.05], [-.04, .025]], '#514433', '#292e2a', .013);
  line(ctx, [[-.03, -.03], [-.017, -tall * .58], [-.18, -tall * .8]], '#887054', .024);
  line(ctx, [[.005, -tall * .38], [.18, -tall * .7], [.29, -tall * .73]], '#5c4c39', .039);
  const autumn = festival || (set === 'town' && variant % 4 === 0) || (set === 'ruins' && variant % 3 === 0);
  const colors = autumn ? ['#6e3e38', '#884c3a', '#a86543', '#be8350', '#65443c'] : ['#253e34', '#36523c', '#4c6844', '#6d8050', '#2c4940'];
  for (let i = 0; i < 32; i++) {
    const angle = hash(i, variant, 35) * TAU, rad = Math.sqrt(hash(i, variant, 41)) * spread;
    const xx = Math.cos(angle) * rad, yy = -tall * .71 + Math.sin(angle) * rad * .45;
    const rr = (small ? .10 : .16) + hash(i, variant, 22) * .12;
    ellipse(ctx, xx, yy, rr, rr * .6, colors[i % 5]);
    if (i % 2 === 0) {
      for (let j = 0; j < 4; j++) ellipse(ctx, xx - rr * .4 + j * rr * .25, yy - rr * .2 + hash(j, i) * .05, .03, .013, autumn ? '#bd8952' : '#82945b');
    }
  }
  if (festival) {
    line(ctx, [[-.45, -.76], [-.2, -.64], [.08, -.68], [.42, -.79]], '#cfaa67', .009);
    const hues = ['#e9bc71', '#b5a1e4', '#e1a176', '#96d5c6'];
    for (let i = 0; i < 9; i++) {
      const x = -.46 + i * .11, y = -.62 + Math.sin(i * .7) * .1;
      line(ctx, [[x, y - .12], [x, y]], '#876e49', .006);
      poly(ctx, [[x - .025, y], [x + .024, y], [x + .034, y + .07], [x - .034, y + .07]], hues[i % 4], '#735640', .007);
      line(ctx, [[x, y], [x, y + .07]], '#fae3b3', .008);
    }
  }
}

function pillar(ctx: CanvasRenderingContext2D, set: Tileset, broken: boolean): void {
  const p = PALETTE[set], height = broken ? .56 : .98;
  ellipse(ctx, .12, .055, .3, .12, 'rgba(0,8,15,.28)');
  slab(ctx, -.29, -.29, .58, .58, .08, p.stoneLight, p.stone, p.shadow);
  const gr = ctx.createLinearGradient(-.17, 0, .17, 0); gr.addColorStop(0, p.shadow); gr.addColorStop(.35, p.stoneLight); gr.addColorStop(.7, p.stone); gr.addColorStop(1, p.shadow);
  ctx.fillStyle = gr; ctx.fillRect(-.17, -height, .34, height - .03);
  ellipse(ctx, 0, -height, .17, .065, p.stoneLight, p.shadow);
  for (const i of [-.12, -.06, .06, .12]) line(ctx, [[i, -.12], [i, -height + .08]], 'rgba(22,34,42,.31)', .009);
  if (!broken) { slab(ctx, -.25, -.25, .5, .5, height + .04, p.stoneLight, p.stone, p.shadow, height - .03); }
  if (set === 'vault' || set === 'dome') {
    line(ctx, [[-.055, -.18], [.035, -.4], [-.015, -.57], [.06, -.8]], '#a3b4de', .018);
    line(ctx, [[-.055, -.18], [.035, -.4], [-.015, -.57], [.06, -.8]], '#e6dcff', .005);
  }
}

function wall(ctx: CanvasRenderingContext2D, set: Tileset, variant: number, wood = false): void {
  const p = PALETTE[set];
  const height = set === 'town' ? .66 : set === 'ruins' ? .41 + (variant % 3) * .11 : .62;
  slab(ctx, -.5, -.5, 1, 1, height, wood ? '#99816a' : p.stoneLight, wood ? '#705844' : p.stone, wood ? '#493f37' : p.shadow);
  const material = wood ? MATERIALS.woodGrain : set === 'vault' ? MATERIALS.vaultSlate : set === 'dome' ? MATERIALS.arcanePlumStone : MATERIALS.stoneMasonry;
  ctx.save(); ctx.globalAlpha *= .79;
  materialPlane(ctx, material, uv(-.5, .5, height), uv(.5, .5, height), uv(-.5, .5));
  materialPlane(ctx, material, uv(.5, -.5, height), uv(.5, .5, height), uv(.5, -.5));
  ctx.restore();
  poly(ctx, [uv(.5, -.5, height), uv(.5, .5, height), uv(.5, .5), uv(.5, -.5)], 'rgba(12,25,30,.32)');
  poly(ctx, [uv(-.5, .5, height), uv(.5, .5, height), uv(.5, .5), uv(-.5, .5)], 'rgba(25,31,25,.10)');
  ctx.save(); ctx.globalAlpha *= .66;
  materialPlane(ctx, wood ? MATERIALS.woodGrain : MATERIALS.mossyRock, uv(-.5, -.5, height), uv(.5, -.5, height), uv(-.5, .5, height));
  ctx.restore();
  for (let i = 1; i <= 3; i++) {
    const z = height * i / 4;
    line(ctx, [[-.5, -z], [0, .25 - z], [.5, -z]], wood ? '#392c25' : 'rgba(15,27,32,.43)', .012);
    if (!wood) {
      const off = i % 2 ? .13 : .29;
      line(ctx, [[-off, .25 - off / 2 - z], [-off, .25 - off / 2 - z - height / 4]], 'rgba(17,27,34,.3)', .007);
      line(ctx, [[off, .25 - off / 2 - z], [off, .25 - off / 2 - z - height / 4]], 'rgba(17,27,34,.4)', .007);
    }
  }
  if (variant % 3 === 0 && set !== 'vault' && set !== 'interior') {
    line(ctx, [[-.3, -.56], [-.24, -.36], [-.34, -.17], [-.29, .04]], '#4b6441', .025);
    for (let i = 0; i < 8; i++) ellipse(ctx, -.3 + Math.sin(i * 2) * .06, -.5 + i * .07, .035, .017, i % 2 ? '#768455' : '#526d44');
  }
  if ((set === 'ruins' || set === 'cathedral') && variant % 4 === 0) {
    line(ctx, [[.15, -height + .08], [.11, -height + .21], [.21, -height + .31], [.18, -.03]], '#35413e', .011);
  }
}

function crate(ctx: CanvasRenderingContext2D, variant: number, chest = false): void {
  ellipse(ctx, .06, .07, .35, .12, 'rgba(5,12,17,.3)');
  slab(ctx, -.33, -.29, .66, .58, chest ? .34 : .4, '#a17d50', '#775334', '#4e3e2e');
  for (const off of [-.18, .02, .21]) line(ctx, [[-.32 + off / 3, .16 - off / 6], [-.32 + off / 3, -.24 - off / 6]], '#4a3727', .01);
  if (chest) {
    line(ctx, [[-.3, -.26], [.02, -.1], [.32, -.25]], '#c7a462', .035);
    line(ctx, [[0, .16], [0, -.18]], '#c7a462', .031);
    ellipse(ctx, .015, -.03, .029, .037, '#d5b76d', '#4e3729');
  } else {
    line(ctx, [[-.3, -.38], [-.02, -.24], [.3, -.38]], '#d0a976', .018);
    line(ctx, [[-.3, -.17], [-.02, -.24], [-.02, .14]], '#bb9056', .027);
    line(ctx, [[.03, .13], [.3, -.31]], '#9a734a', .034);
    if (variant % 3 === 0) slab(ctx, -.15, -.14, .3, .27, .66, '#a78b5c', '#725539', '#4e4034', .4);
  }
}

function propArt(ctx: CanvasRenderingContext2D, ch: string, variant: number, set: Tileset): void {
  const p = PALETTE[set];
  switch (ch) {
    case '#': wall(ctx, set, variant); break;
    case 'W': wall(ctx, set, variant, true); break;
    case 'T': tree(ctx, variant, set); break;
    case 'L': tree(ctx, variant, set, false, true); break;
    case 't': tree(ctx, variant, set, true); break;
    case 'P': pillar(ctx, set, variant % 5 === 0 && set === 'ruins'); break;
    case '%': {
      for (let i = 0; i < 7; i++) {
        const [x, y] = uv(hash(i, variant, 12) * .75 - .375, hash(i, variant, 13) * .75 - .375);
        const w = .07 + hash(i, variant, 17) * .10, hh = .06 + hash(i, variant, 25) * .1;
        poly(ctx, [[x - w, y], [x - w * .7, y - hh], [x + w * .5, y - hh * .9], [x + w, y], [x, y + .04]], p.stone, p.shadow, .012);
        poly(ctx, [[x - w * .7, y - hh], [x, y - hh - .015], [x + w * .5, y - hh * .9], [x, y - hh * .3]], p.stoneLight);
      }
      break;
    }
    case 'c': crate(ctx, variant); break;
    case 'C': crate(ctx, variant, true); break;
    case 'b': {
      ellipse(ctx, .06, .06, .26, .1, 'rgba(2,10,16,.28)');
      const g = ctx.createLinearGradient(-.2, 0, .2, 0); g.addColorStop(0, '#49382b'); g.addColorStop(.3, '#aa7f4c'); g.addColorStop(1, '#5b3d2a');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-.18, -.4); ctx.bezierCurveTo(-.25, -.26, -.25, -.05, -.17, .015); ctx.quadraticCurveTo(0, .1, .17, .015); ctx.bezierCurveTo(.25, -.05, .25, -.26, .18, -.4); ctx.closePath(); ctx.fill();
      for (const x of [-.13, -.045, .06, .14]) line(ctx, [[x, -.37], [x * 1.15, -.1], [x, .015]], '#523d2b', .008);
      for (const y of [-.31, -.08]) { ctx.beginPath(); ctx.ellipse(0, y, .21, .055, 0, 0, Math.PI); ctx.strokeStyle = '#b0a584'; ctx.lineWidth = .025; ctx.stroke(); }
      ellipse(ctx, 0, -.4, .18, .08, '#a38455', '#3b3730');
      line(ctx, [[-.14, -.42], [.13, -.37]], '#695032', .01);
      ellipse(ctx, .04, -.4, .029, .013, '#503d2b');
      break;
    }
    case 'f': {
      slab(ctx, -.22, -.22, .44, .44, .12, '#898575', '#555b56', '#3f494b');
      for (const x of [-.12, .12]) line(ctx, [[x, -.08], [x * .85, -.45]], '#535553', .032);
      ellipse(ctx, 0, -.43, .22, .09, '#b4996b', '#2c3539');
      ellipse(ctx, 0, -.45, .17, .064, '#3d3030');
      break;
    }
    case 'h': {
      slab(ctx, -.5, -.5, 1, 1, .065, p.stoneLight, p.stone, p.shadow);
      ctx.save(); ctx.globalAlpha *= .84;
      materialPlane(ctx, set === 'vault' ? MATERIALS.vaultSlate : set === 'dome' ? MATERIALS.arcanePlumStone : MATERIALS.cathedralStone, uv(-.5, -.5, .065), uv(.5, -.5, .065), uv(-.5, .5, .065));
      ctx.restore(); break;
    }
    case 'D': {
      // Doorways remain walkable. The open arch makes the threshold unambiguous.
      slab(ctx, -.44, -.11, .16, .24, .8, p.stoneLight, p.stone, p.shadow);
      slab(ctx, .28, -.11, .16, .24, .8, p.stoneLight, p.stone, p.shadow);
      const a = uv(-.28, -.11, .72), b = uv(.28, -.11, .72), c = uv(.28, .13, .72), d = uv(-.28, .13, .72);
      poly(ctx, [[a[0], a[1] - .1], [b[0], b[1] - .1], [c[0], c[1] - .1], [d[0], d[1] - .1]], p.stoneLight, p.shadow);
      line(ctx, [uv(-.27, -.12, .08), uv(.27, -.12, .08)], '#cfac6d', .012);
      break;
    }
    case '+': {
      slab(ctx, -.42, -.18, .84, .36, .20, '#a58054', '#6b5038', '#483e32');
      line(ctx, [uv(-.4, .16, .16), uv(.4, .16, .16)], '#bd9566', .043);
      for (const x of [-.32, .32]) line(ctx, [uv(x, -.12), uv(x, -.12, .36)], '#544332', .035);
      line(ctx, [uv(-.42, -.12, .33), uv(.42, -.12, .33)], '#997047', .065);
      break;
    }
    case 'A': {
      slab(ctx, -.32, -.18, .64, .36, .29, p.stone, p.shadow, '#303940');
      slab(ctx, -.49, -.29, .98, .58, .38, p.stoneLight, p.stone, p.shadow, .29);
      poly(ctx, [uv(-.26, .1, .385), uv(.28, .1, .385), uv(.28, .3, .385), uv(.28, .3, .07), uv(-.26, .3, .07), uv(-.26, .3, .385)], set === 'vault' ? '#735f8f' : '#6d3941', '#aa9460', .009);
      for (const x of [-.28, .28]) { const pt = uv(x, -.1, .4); line(ctx, [[pt[0], pt[1]], [pt[0], pt[1] - .13]], '#d7c899', .022); ellipse(ctx, pt[0], pt[1] - .14, .016, .028, '#ffe5a0'); }
      break;
    }
    case 'g': {
      const g = ctx.createLinearGradient(-.16, 0, .16, 0); g.addColorStop(0, '#8b9183'); g.addColorStop(1, '#515c57');
      slab(ctx, -.24, -.15, .48, .3, .065, '#838b7a', '#576254', '#3c4b43');
      ctx.beginPath(); ctx.moveTo(-.14, -.03); ctx.lineTo(-.14, -.36); ctx.quadraticCurveTo(-.12, -.57, .04, -.52); ctx.quadraticCurveTo(.17, -.5, .17, -.32); ctx.lineTo(.17, .02); ctx.closePath(); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = '#33423d'; ctx.lineWidth = .012; ctx.stroke();
      line(ctx, [[.005, -.39], [.005, -.17]], '#c0c1a3', .016); line(ctx, [[-.064, -.31], [.076, -.29]], '#b3b99c', .016);
      ellipse(ctx, -.07, -.06, .09, .025, '#4e6244');
      break;
    }
    case 'l': {
      slab(ctx, -.13, -.13, .26, .26, .045, '#aaa184', '#666857', '#414b44');
      line(ctx, [[0, 0], [0, -.88]], '#3d423f', .035);
      line(ctx, [[-.009, -.03], [-.009, -.87]], '#aaa279', .006);
      line(ctx, [[-.08, -.82], [0, -.9], [.13, -.84]], '#8c8062', .021);
      poly(ctx, [[-.075, -.83], [.075, -.83], [.1, -.65], [-.1, -.65]], '#b69056', '#3e3d32', .013);
      poly(ctx, [[-.05, -.8], [.05, -.8], [.07, -.68], [-.07, -.68]], '#ffe4a0');
      poly(ctx, [[-.1, -.84], [0, -.94], [.1, -.84]], '#565e55', '#273739');
      break;
    }
    case 'o': {
      const g = ctx.createLinearGradient(-.33, 0, .33, 0); g.addColorStop(0, '#798376'); g.addColorStop(.3, '#959884'); g.addColorStop(1, '#4a5854');
      ctx.fillStyle = g; ctx.fillRect(-.34, -.24, .68, .24); ellipse(ctx, 0, .005, .34, .135, '#718070');
      ellipse(ctx, 0, -.24, .37, .15, '#abb09a', '#454f47'); ellipse(ctx, 0, -.24, .27, .095, '#1c333b');
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 6; line(ctx, [[Math.cos(a) * .33, Math.sin(a) * .13], [Math.cos(a) * .33, -.17 + Math.sin(a) * .13]], '#46544b', .008); }
      for (const x of [-.3, .3]) line(ctx, [[x, -.12], [x, -.65]], '#715d41', .04);
      line(ctx, [[-.37, -.67], [.37, -.67]], '#a08050', .05);
      line(ctx, [[.03, -.67], [.03, -.23]], '#c5ab77', .008);
      break;
    }
    case 'n': {
      for (const x of [-.4, .4]) { const pt = uv(x, 0); line(ctx, [[pt[0], pt[1]], [pt[0], pt[1] - .38]], '#a08b60', .036); }
      line(ctx, [uv(-.5, 0, .28), uv(.5, 0, .28)], '#8f764b', .04); line(ctx, [uv(-.5, 0, .12), uv(.5, 0, .12)], '#6e6042', .025);
      break;
    }
    case 'B': {
      slab(ctx, -.4, -.2, .8, .4, .5, '#96754e', '#684c37', '#44382e');
      for (const z of [.15, .3, .45]) {
        line(ctx, [uv(-.36, .22, z), uv(.35, .22, z)], '#b89359', .016);
        for (let i = 0; i < 5; i++) { const pt = uv(-.27 + i * .12, .225, z + .018); line(ctx, [[pt[0], pt[1]], [pt[0], pt[1] - .08]], ['#6b3948', '#55776c', '#ab935d'][i % 3], .028); }
      }
      break;
    }
    case 'K': {
      for (const x of [-.32, .32]) for (const y of [-.18, .18]) { const pt = uv(x, y); line(ctx, [[pt[0], pt[1]], [pt[0], pt[1] - .25]], '#594735', .03); }
      slab(ctx, -.46, -.3, .92, .6, .29, '#a68251', '#765435', '#4f4030', .23);
      const plate = uv(-.1, 0, .3); ellipse(ctx, plate[0], plate[1], .09, .035, '#c7c1a2', '#6f6b53');
      ellipse(ctx, .11, -.29, .027, .04, '#947552', '#46382c');
      break;
    }
    case 's': {
      for (let i = 4; i >= 0; i--) slab(ctx, -.5 + i * .2, -.5, .2, 1, (5 - i) * .045, p.stoneLight, p.stone, p.shadow);
      break;
    }
    case 'x': {
      for (let i = 0; i < 6; i++) { const [x, y] = uv(hash(i, variant, 67) * .7 - .35, hash(i, variant, 83) * .7 - .35); line(ctx, [[x - .04, y - .02], [x + .04, y + .02]], '#d3c9a8', .014); ellipse(ctx, x - .04, y - .02, .012, .009, '#b9b59a'); }
      ellipse(ctx, -.05, -.05, .05, .043, '#cbc7ad'); ellipse(ctx, -.07, -.055, .012, .013, '#4a5350'); ellipse(ctx, -.035, -.047, .01, .012, '#4a5350');
      break;
    }
  }
}

export function drawIsoProp(ctx: CanvasRenderingContext2D, ch: string, x: number, y: number, view: IsoView, set: Tileset, time: number, opts: IsoDrawOptions = {}): void {
  if (!HAS_ISO_PROP.has(ch)) return;
  const p = isoPoint(x, y, view), w = view.tileWidth;
  const variant = Math.floor(hash(x, y) * 8), key = `${syncMaterialCaches()}:${set}:${ch}:${variant}`;
  ctx.save();
  ctx.globalAlpha *= (opts.dim ? .34 : 1) * (opts.fade ?? 1);
  const painted = paintedProp(ctx, ch, variant, set, p.x, p.y, w);
  if (!painted) {
    let im = propCache.get(key);
    if (!im) { im = canvas(256, 320); const c = im.getContext('2d')!; c.translate(128, 260); c.scale(128, 128); propArt(c, ch, variant, set); propCache.set(key, im); if (propCache.size > 192) propCache.delete(propCache.keys().next().value!); }
    ctx.drawImage(im, p.x - w, p.y - w * 260 / 128, w * 2, w * 2.5);
  }
  if ((ch === 'f' || ch === 'F' || ch === 'l' || ch === 'L') && !opts.dim) {
    ctx.translate(p.x, p.y); ctx.scale(w, w);
    if (ch === 'F' || ch === 'f') {
      const yy = ch === 'f' ? -.47 : 0, fl = Math.sin(time / 130 + x + y) * .03;
      lightGlow(ctx, 0, yy - .1, .6, 'rgba(255,177,76,.17)');
      if (!painted) {
        poly(ctx, [[-.095, yy], [-.06, yy - .13], [-.03, yy - .04], [.015, yy - .28 - fl], [.06, yy - .12], [.1, yy - .02], [.035, yy + .03]], '#e9a454');
        poly(ctx, [[-.04, yy], [0, yy - .14 - fl], [.045, yy], [.015, yy + .025]], '#ffe8a2');
      }
      const emberY = yy - .3 - (time % 1300) / 1300 * .3;
      ellipse(ctx, Math.sin(time / 300 + x) * .08, emberY, .007, .014, '#ffd186');
    } else if (ch === 'l') {
      const lx = painted ? .12 : 0, ly = painted ? -.56 : -.74;
      lightGlow(ctx, lx, ly, .55, 'rgba(255,192,100,.18)');
      if (!painted) ellipse(ctx, lx, ly, .028, .047 + Math.sin(time / 100) * .005, '#fff2b8');
    } else {
      if (painted) {
        line(ctx, [[-.55, -.82], [-.28, -.66], [.02, -.65], [.4, -.76]], '#c6ac6b', .01);
        for (let i = 0; i < 7; i++) {
          const xx = -.49 + i * .14, yy = -.77 + Math.sin(i / 6 * Math.PI) * .13;
          line(ctx, [[xx, yy], [xx, yy + .1]], '#b69753', .006);
          poly(ctx, [[xx - .025, yy + .09], [xx + .025, yy + .09], [xx + .032, yy + .15], [xx - .032, yy + .15]], ['#efc578', '#bd9cda', '#9bd2be'][i % 3], '#735d3e', .007);
        }
      }
      lightGlow(ctx, 0, -.6, .8, 'rgba(240,185,105,.08)');
      for (let i = 0; i < 6; i++) { const xx = -.35 + i * .14, yy = -.65 + Math.sin(i * 1.3) * .12; lightGlow(ctx, xx, yy, .12, 'rgba(247,209,135,.18)'); }
    }
  }
  ctx.restore();
}

/** A door is projected onto its actual facade, so a building cannot paint over its entrance. */
function buildingDoor(ctx: CanvasRenderingContext2D, u: number, v: number, side: 'south' | 'east', height: number, time: number): void {
  const point = (t: number, z: number): [number, number] => side === 'south' ? uv(u + t, v, z) : uv(u, v + t, z);
  const top = Math.min(.94, height - .08), spring = top - .19;
  const arch = (half: number, bottom: number, raise = 0): [number, number][] => {
    const points: [number, number][] = [point(-half, bottom), point(-half, spring + raise)];
    for (let i = 0; i <= 10; i++) { const a = Math.PI - i / 10 * Math.PI; points.push(point(Math.cos(a) * half, spring + raise + Math.sin(a) * .19)); }
    points.push(point(half, bottom)); return points;
  };
  // A shallow doorstep joins the outer wall to the walkable entrance tile.
  if (side === 'south') slab(ctx, u - .43, v - .08, .86, .28, .09, '#b0ad90', '#777e6d', '#58665b');
  else slab(ctx, u - .08, v - .43, .28, .86, .09, '#a2a48c', '#6b7767', '#505e56');
  poly(ctx, arch(.365, .09, .055), '#b8ac87', '#4c5448', .018);
  poly(ctx, arch(.285, .11), '#192d32', '#4d4838', .017);
  poly(ctx, arch(.255, .12, -.025), side === 'south' ? '#65523c' : '#4f4a38', '#c7a366', .012);
  for (let i = -2; i <= 2; i++) {
    const t = i * .085, z = spring - .025 + Math.sqrt(Math.max(0, 1 - t * t / (.255 * .255))) * .19;
    line(ctx, [point(t, .13), point(t, z - .015)], '#3c3e32', .012);
    line(ctx, [point(t + .012, .13), point(t + .012, z - .02)], 'rgba(210,177,111,.19)', .007);
  }
  for (const z of [.26, .57]) {
    line(ctx, [point(-.24, z), point(.24, z)], '#252f2d', .024);
    for (const t of [-.2, .2]) { const p = point(t, z); ellipse(ctx, p[0], p[1], .01, .008, '#c3b589'); }
  }
  const handle = point(.13, .42); ellipse(ctx, handle[0], handle[1], .024, .031, '#443e2a', '#cdb477');
  const lamp = point(-.47, .75);
  line(ctx, [point(-.39, .79), [lamp[0], lamp[1] - .08]], '#393f36', .016);
  lightGlow(ctx, lamp[0], lamp[1], .22, `rgba(245,189,100,${.16 + .025 * Math.sin(time / 160)})`);
  poly(ctx, [[lamp[0] - .045, lamp[1] - .065], [lamp[0] + .045, lamp[1] - .065], [lamp[0] + .037, lamp[1] + .05], [lamp[0] - .037, lamp[1] + .05]], '#ebca8b', '#5a533b', .012);
}

/** Render a coherent town structure over the exact occupied W footprint. */
export function drawIsoBuilding(ctx: CanvasRenderingContext2D, rect: IsoBuilding, view: IsoView, time: number, style: Tileset = 'town', fade = 1): void {
  const w = view.tileWidth, pos = isoPoint(rect.x, rect.y, view);
  ctx.save(); ctx.translate(pos.x, pos.y); ctx.scale(w, w); ctx.globalAlpha *= fade;
  const rw = rect.w, rh = rect.h, x = -.5, y = -.5;
  const tall = rect.id?.includes('mill') ? 1.75 : Math.min(1.35, .85 + Math.min(rw, rh) * .075);
  const roofH = .65 + Math.min(rw, rh) * .09;
  const variant = Math.floor(hash(rect.x, rect.y) * 7);
  const isStone = style === 'ruins' || style === 'cathedral' || rect.id?.includes('hall');
  const roofColors = ['#53696a', '#625a64', '#696b59', '#6b5b53', '#545f70', '#756752', '#5a6b62'];
  const roof = roofColors[variant];
  const a = uv(x, y, tall), b = uv(x + rw, y, tall), c = uv(x + rw, y + rh, tall), d = uv(x, y + rh, tall);
  // Long structure shadow and dressed-stone footing.
  poly(ctx, [uv(x, y), uv(x + rw + .5, y + .5), uv(x + rw + .5, y + rh + .5), uv(x + .2, y + rh + .35)], 'rgba(5,13,18,.24)');
  slab(ctx, x - .045, y - .045, rw + .09, rh + .09, .13, '#969682', '#687265', '#434f47');
  slab(ctx, x, y, rw, rh, tall, '#a89778', isStone ? '#8c907f' : '#b4a384', isStone ? '#626f65' : '#7d7766');
  ctx.save(); ctx.globalAlpha *= isStone ? .72 : .32;
  for (let i = 0; i < rw; i++) materialPlane(ctx, isStone ? MATERIALS.stoneMasonry : MATERIALS.woodGrain, uv(x + i, y + rh, tall), uv(x + i + 1, y + rh, tall), uv(x + i, y + rh, .13));
  for (let i = 0; i < rh; i++) materialPlane(ctx, isStone ? MATERIALS.stoneMasonry : MATERIALS.woodGrain, uv(x + rw, y + i, tall), uv(x + rw, y + i + 1, tall), uv(x + rw, y + i, .13));
  ctx.restore();
  poly(ctx, [b, c, uv(x + rw, y + rh, .13), uv(x + rw, y, .13)], 'rgba(17,32,31,.18)');
  // Timber framing on both visible elevations, in projected world coordinates.
  for (let i = 0; i <= rw; i++) line(ctx, [uv(x + i, y + rh, .12), uv(x + i, y + rh, tall)], '#4b493c', .052);
  for (let i = 0; i <= rh; i++) line(ctx, [uv(x + rw, y + i, .12), uv(x + rw, y + i, tall)], '#3a433e', .048);
  for (const z of [.18, tall * .47, tall - .06]) {
    line(ctx, [uv(x, y + rh, z), uv(x + rw, y + rh, z)], '#514d3d', .054);
    line(ctx, [uv(x + rw, y, z), uv(x + rw, y + rh, z)], '#42493e', .048);
  }
  for (let i = 0; i < rw; i++) {
    line(ctx, [uv(x + i + .08, y + rh, .2), uv(x + i + .92, y + rh, tall * .46)], '#706346', .025);
    if (i % 2 === 0 && !rect.doors?.some(door => door.y === rect.y + rh - 1 && door.x === rect.x + i)) {
      const pt = uv(x + i + .5, y + rh, tall * .75);
      const glow = .7 + .15 * Math.sin(time / 2000 + i);
      poly(ctx, [[pt[0] - .13, pt[1] - .17], [pt[0] + .13, pt[1] - .04], [pt[0] + .13, pt[1] + .18], [pt[0] - .13, pt[1] + .05]], `rgba(244,195,114,${glow})`, '#574d36', .024);
      line(ctx, [[pt[0], pt[1] - .1], [pt[0], pt[1] + .11]], '#6d6144', .016);
      line(ctx, [[pt[0] - .12, pt[1] - .025], [pt[0] + .12, pt[1] + .095]], '#6d6144', .014);
    }
  }
  for (let i = 0; i < rh; i++) if (i % 2 === 0 && !rect.doors?.some(door => door.x === rect.x + rw - 1 && door.y === rect.y + i)) {
    const pt = uv(x + rw, y + i + .5, tall * .72);
    poly(ctx, [[pt[0] - .12, pt[1] - .03], [pt[0] + .12, pt[1] - .15], [pt[0] + .12, pt[1] + .07], [pt[0] - .12, pt[1] + .19]], '#c6ae79', '#435048', .023);
    line(ctx, [[pt[0], pt[1] - .08], [pt[0], pt[1] + .12]], '#57624f', .016);
  }
  for (const door of rect.doors ?? []) {
    if (door.y === rect.y + rh - 1) buildingDoor(ctx, door.x - rect.x, y + rh, 'south', tall, time);
    else if (door.x === rect.x + rw - 1) buildingDoor(ctx, x + rw, door.y - rect.y, 'east', tall, time);
  }
  // Roof ridge follows the long axis, giving every house one readable mass.
  const ridge0 = uv(x, y + rh / 2, tall + roofH), ridge1 = uv(x + rw, y + rh / 2, tall + roofH);
  poly(ctx, [a, d, ridge0], '#74674e', '#433f38', .02);
  poly(ctx, [b, c, ridge1], '#615e4e', '#35413b', .02);
  poly(ctx, [a, b, ridge1, ridge0], roof, '#374443', .025);
  poly(ctx, [ridge0, ridge1, c, d], roof, '#263c3d', .025);
  const roofSections = Math.ceil(rw / 1.5);
  ctx.save(); ctx.globalAlpha *= .85;
  for (let i = 0; i < roofSections; i++) {
    const u0 = x + rw * i / roofSections, u1 = x + rw * (i + 1) / roofSections;
    materialPlane(ctx, MATERIALS.roofShingles, uv(u0, y + rh / 2, tall + roofH), uv(u1, y + rh / 2, tall + roofH), uv(u0, y, tall));
    materialPlane(ctx, MATERIALS.roofShingles, uv(u0, y + rh / 2, tall + roofH), uv(u1, y + rh / 2, tall + roofH), uv(u0, y + rh, tall));
  }
  ctx.restore();
  poly(ctx, [a, b, ridge1, ridge0], 'rgba(12,27,32,.25)');
  // Shingle courses follow the sloping geometry, with alternating tile breaks.
  const rows = Math.ceil((roofH + rh / 3) * 5);
  ctx.save(); if (materialAtlasStatus().ready) ctx.globalAlpha *= .30;
  for (let i = 1; i < rows; i++) {
    const t = i / rows;
    const q0: [number, number] = [ridge0[0] + (d[0] - ridge0[0]) * t, ridge0[1] + (d[1] - ridge0[1]) * t];
    const q1: [number, number] = [ridge1[0] + (c[0] - ridge1[0]) * t, ridge1[1] + (c[1] - ridge1[1]) * t];
    line(ctx, [q0, q1], i % 2 ? 'rgba(187,188,163,.25)' : 'rgba(15,30,36,.4)', .025);
    for (let j = 0; j < rw * 3; j++) {
      const s = (j + (i % 2) * .5) / (rw * 3); if (s >= 1) continue;
      const px = q0[0] + (q1[0] - q0[0]) * s, py = q0[1] + (q1[1] - q0[1]) * s;
      line(ctx, [[px, py], [px - (d[0] - ridge0[0]) / rows, py - (d[1] - ridge0[1]) / rows]], 'rgba(20,33,37,.34)', .012);
    }
  }
  ctx.restore();
  line(ctx, [ridge0, ridge1], '#b0a17d', .055);
  // Chimney uses its own projection so it stands above the roof instead of becoming a decal.
  const chimneyX = x + rw * .7, chimneyY = y + rh * .43;
  slab(ctx, chimneyX - .15, chimneyY - .17, .33, .34, tall + roofH + .3, '#b9ac88', '#807d6a', '#555f56', tall + roofH * .6);
  const flue = uv(chimneyX, chimneyY, tall + roofH + .31);
  ellipse(ctx, flue[0], flue[1], .095, .04, '#313e3b');
  for (let i = 0; i < 3; i++) {
    const t = ((time / 5000 + i / 3) % 1), drift = t * .45;
    ellipse(ctx, flue[0] + drift, flue[1] - t * .8, .11 + t * .18, .08 + t * .14, `rgba(191,193,176,${(1 - t) * .11})`);
  }
  ctx.restore();
}

/** Named companions keep their identity when they move between exploration and battle. */
export function civilianIndex(c?: Character, role = '', npcId = ''): number | null {
  if (c?.kind === 'enemy') return null;
  const companions: Record<string, number> = { brakka: 12, vaelis: 13, orren: 14, tessa: 15 };
  if (c?.companionId && companions[c.companionId] !== undefined) return companions[c.companionId];
  if (!npcId) return null;
  const id = `${npcId} ${role}`.toLowerCase();
  for (const [name, index] of Object.entries(companions)) if (id.includes(name)) return index;
  if (/bellwarden|halric|sentinel|ossaryx|wyrm|maelis|maren|ilyra|seris|nima|kael|varek|korr|caddoc/.test(id)) return null;
  if (/tobin|innkeeper/.test(id)) return 0;
  if (/garrick|abel|hob|lenn|piet|lamplighter|blacksmith|miller|farmer/.test(id)) return 1;
  if (/wenna|aunra|greenmother|hedge.witch/.test(id)) return 2;
  if (/mayor|edda|agna/.test(id)) return 3;
  if (/corvin|archivist|scholar|severin/.test(id)) return 4;
  if (/hale|watch|guard|sentry|warden|scout|vex|dag|hawk/.test(id)) return 5;
  if (/ysolde|merchant|dunla|refugee|annet|lanternbearer|maddie/.test(id)) return 6;
  if (/lio|minstrel|bard/.test(id)) return 7;
  if (/pell/.test(id)) return 8;
  if (/mira/.test(id)) return 9;
  if (/(?:^|[\s_])lira(?:$|[\s_])/.test(id)) return 10;
  if (/jory/.test(id)) return 11;
  return null;
}

/** Stable art assignments; no sprite choice consumes gameplay randomness. */
export function miniatureIndex(c?: Character, role = '', npcId = '', glyph = ''): number | null {
  const id = `${c?.templateId ?? ''} ${c?.name ?? ''} ${npcId}`.toLowerCase();
  if (/ossaryx|wyrm|crystal|sentinel/.test(id)) return 15;
  if (/hound|wolf|stalker/.test(id)) return 12;
  if (/wraith|hollow_echo|lira|ysolde_echo/.test(id)) return 13;
  if (/ossuary|skeleton|pilgrim|undead/.test(id) && !/crawler/.test(id)) return 9;
  if (/crawler/.test(id)) return null;
  if (/ogre|troll/.test(id)) return 11;
  if (/bellwarden|halric/.test(id)) return null;
  if (/cultist|arcanist|seeker/.test(id)) return 10;
  if (/sellsword|soldier|warden|knight|hawk|hale|dag/.test(id)) return 14;
  if (/maren|ilyra/.test(id)) return 8;
  if (/seris/.test(id)) return 0;
  if (/kael/.test(id)) return 4;
  if (/nima/.test(id)) return 2;
  if (/varek|ysolt/.test(id)) return 3;
  if (/korr/.test(id)) return 6;
  if (/caddoc|sefa|rue/.test(id)) return 7;
  if (/maelis/.test(id)) return 13;
  if (npcId && !c) return null;
  const cls = c?.classId ?? role;
  if (/dwarf/.test(c?.ancestry ?? '')) return 5;
  if (/ashkin|dragon/.test(c?.ancestry ?? '') && ['cleric', 'sorcerer', 'wizard'].includes(cls)) return 6;
  if (c?.companionId === 'nima') return 2;
  const index: Record<string, number> = { fighter: 1, paladin: 0, cleric: 8, wizard: 3, sorcerer: 2, warlock: 3, bard: 7, ranger: 7, rogue: 4, barbarian: 1 };
  if (index[cls] !== undefined) return index[cls];
  if (c?.kind === 'enemy') return /undead/.test(c.creatureType ?? '') ? 9 : /beast/.test(c.creatureType ?? '') ? 12 : /echo/.test(c.creatureType ?? '') ? 13 : 14;
  if (glyph === '☽') return 13;
  return null;
}

function bellwardenArt(ctx: CanvasRenderingContext2D, phase: number): void {
  ellipse(ctx, 0, .025, .38, .135, 'rgba(2,10,17,.57)');
  lightGlow(ctx, 0, -.4, .72, 'rgba(150,122,210,.1)');
  const metal = ctx.createLinearGradient(-.34, -.2, .34, 0);
  metal.addColorStop(0, '#50443a'); metal.addColorStop(.2, '#a58c5b'); metal.addColorStop(.38, '#d8b97a'); metal.addColorStop(.59, '#957d53'); metal.addColorStop(1, '#4d5148');
  ctx.beginPath(); ctx.moveTo(-.14, -.45); ctx.bezierCurveTo(-.24, -.4, -.16, -.12, -.35, -.02);ctx.quadraticCurveTo(-.38, .08, 0, .12);ctx.quadraticCurveTo(.4, .07, .35, -.02);ctx.bezierCurveTo(.17, -.12, .24, -.4, .14, -.45);ctx.closePath();ctx.fillStyle=metal;ctx.fill();ctx.lineWidth=.014;ctx.strokeStyle='#3a403d';ctx.stroke();
  ellipse(ctx, 0, -.005, .34, .105, 'rgba(76,61,42,.17)', '#e0bb78');
  line(ctx, [[-.18, -.38], [-.12, -.36], [.12, -.36], [.19, -.38]], '#b9a16a', .02);
  line(ctx, [[-.07, -.35], [-.02, -.23], [-.06, -.12], [.01, .055]], '#4b4849', .013);
  line(ctx, [[-.065, -.35], [-.015, -.23], [-.055, -.12], [.015, .055]], '#a39ad1', .004);
  for (let i=0;i<10;i++) {const x=-.25+i*.055;line(ctx,[[x,-.05],[x,-.09-(i%2)*.025]],'#796d4d',.011);}
  poly(ctx,[[-.18,-.47],[-.16,-.69],[-.09,-.75],[.11,-.74],[.19,-.57],[.14,-.42]],'#485057','#8b8880',.014);
  poly(ctx,[[-.15,-.7],[-.26,-.51],[-.37,-.34],[-.3,-.3],[-.14,-.5]],'#576064','#2c3c43',.014);
  poly(ctx,[[.17,-.65],[.26,-.51],[.31,-.32],[.25,-.3],[.17,-.49]],'#3c4a53','#2c3540',.014);
  ellipse(ctx,-.32,-.32,.04,.05,'#aab0a2');ellipse(ctx,.28,-.31,.04,.05,'#9ca998');
  poly(ctx,[[-.125,-.7],[-.12,-.88],[-.045,-.99],[.07,-.95],[.145,-.79],[.1,-.68]],'#363b4c','#8e91a1',.014);
  ellipse(ctx,.015,-.805,.064,.08,'#171f30');
  ellipse(ctx,-.012,-.82,.012,.006,'#cdbdf3');ellipse(ctx,.045,-.813,.012,.006,'#cdbdf3');
  line(ctx,[[-.06,-.71],[.02,-.61],[.07,-.67]],'#9e977f',.015);
  // A hanging bronze clapper swings slightly; the bell remains anchored to its tile.
  line(ctx,[[0,.04],[Math.sin(phase)*.025,.13]],'#776142',.017);
  ellipse(ctx,Math.sin(phase)*.025,.13,.032,.035,'#bda16b');
  for (let i=0;i<6;i++) { const yy=-.32+i*.046;ellipse(ctx,.33+Math.sin(i)*.008,yy,.017,.022,'rgba(0,0,0,0)','#b7b5a1'); }
}

function crawlerArt(ctx: CanvasRenderingContext2D, phase: number): void {
  // Segmented carapace and articulated limbs keep the actual many-legged monster readable.
  ellipse(ctx, .04, .015, .36, .13, 'rgba(5,12,16,.55)');
  for (const side of [-1, 1]) for (let i = 0; i < 5; i++) {
    const y = -.13 - i * .055, tip = side * (.34 + Math.sin(i) * .045), bend = side * .26;
    const sway = Math.sin(phase + i) * .008;
    line(ctx, [[side * .12, y], [bend, y - .06], [tip, .015 + sway]], '#433d35', .034);
    line(ctx, [[side * .12, y - .007], [bend, y - .067], [tip, .005 + sway]], '#a79a76', .013);
    ellipse(ctx, bend, y - .06, .025, .021, '#c5b18a', '#655a42');
  }
  const shell = ctx.createLinearGradient(-.16, 0, .16, 0); shell.addColorStop(0, '#514d40'); shell.addColorStop(.35, '#b8aa81'); shell.addColorStop(1, '#625344');
  for (let i = 5; i >= 0; i--) {
    const y = -.12 - i * .055, rx = .155 - i * .012;
    ctx.fillStyle = shell; ctx.beginPath();ctx.ellipse(0, y, rx, .085, 0, 0, TAU);ctx.fill();
    line(ctx, [[-rx * .8, y + .025], [0, y + .063], [rx * .8, y + .025]], '#66533f', .012);
  }
  ellipse(ctx, 0, -.105, .105, .075, '#a5966f', '#554734');
  for (const side of [-1, 1]) {
    ellipse(ctx, side * .052, -.12, .018, .014, '#d98867');
    line(ctx, [[side * .06, -.06], [side * .09, .015], [side * .035, -.005]], '#e0cf9a', .023);
    line(ctx, [[side * .04, -.17], [side * .07, -.24], [side * .12, -.26]], '#bcb58d', .012);
  }
}

function civilianArt(ctx: CanvasRenderingContext2D, id: string, color: string, phase: number): void {
  const child = /pell|mira|lira|child|girl|boy/.test(id), witch = /wenna|witch|greenmother|druid/.test(id), scholar = /corvin|scholar|priest|maren/.test(id);
  const smith = /garrick|smith|miller|abel/.test(id), female = /maren|wenna|mayor|edda|ysolde|mira|lira|greenmother/.test(id);
  ctx.scale(child ? .74 : 1, child ? .74 : 1);
  const bob = Math.sin(phase) * .008;
  ctx.translate(0, bob);
  ellipse(ctx, 0, .015, .21, .07, 'rgba(4,9,13,.5)');
  line(ctx, [[-.08, -.28], [-.105, -.02]], '#373d3e', .072); line(ctx, [[.075, -.28], [.11, -.02]], '#444740', .072);
  ellipse(ctx, -.105, -.005, .064, .028, '#282f30'); ellipse(ctx, .12, -.005, .066, .028, '#252c2d');
  const robe = witch ? '#435f4b' : scholar ? '#788b8a' : female ? '#6c5058' : smith ? '#846247' : color;
  poly(ctx, [[-.135, -.55], [.12, -.54], [.18, -.14], [-.18, -.14]], robe, '#29363b', .015);
  poly(ctx, [[-.09, -.53], [-.2, -.31], [-.17, -.2], [-.1, -.37]], robe, '#303b3a', .012);
  poly(ctx, [[.1, -.54], [.21, -.31], [.18, -.2], [.1, -.38]], robe, '#303b3a', .012);
  ellipse(ctx, -.17, -.22, .033, .04, '#c4a17a'); ellipse(ctx, .18, -.22, .033, .04, '#c9a781');
  line(ctx, [[-.135, -.32], [.14, -.32]], '#b3a17a', .026);
  if (smith) poly(ctx, [[-.09, -.49], [.1, -.49], [.13, -.15], [-.13, -.15]], '#514638', '#a1845b', .012);
  if (female) poly(ctx, [[-.1, -.35], [.12, -.35], [.22, -.07], [-.2, -.07]], robe, '#484743', .014);
  ellipse(ctx, 0, -.605, .098, .114, '#d1ad82', '#715f4b');
  poly(ctx, [[-.105, -.61], [-.1, -.71], [-.045, -.757], [.057, -.739], [.105, -.65], [.07, -.66], [.04, -.704], [-.025, -.67]], witch ? '#c0b5a0' : scholar ? '#a7a599' : '#665341');
  if (female) { line(ctx, [[-.09, -.67], [-.12, -.55], [-.09, -.49]], '#796044', .04); line(ctx, [[.085, -.67], [.12, -.54]], '#796044', .035); }
  ellipse(ctx, -.035, -.61, .009, .008, '#293c3c'); ellipse(ctx, .035, -.61, .009, .008, '#293c3c');
  if (scholar) { ellipse(ctx, -.034, -.611, .025, .022, 'rgba(205,220,206,.16)', '#a79365'); ellipse(ctx, .034, -.611, .025, .022, 'rgba(205,220,206,.16)', '#a79365'); }
  if (witch) {
    ellipse(ctx, -.015, -.72, .18, .043, '#43534b', '#89916c'); poly(ctx, [[-.11, -.73], [-.04, -.98], [.045, -.91], [.1, -.72]], '#4f6250', '#34443d', .012);
    line(ctx, [[.26, .015], [.29, -.81]], '#a99a6e', .026); ellipse(ctx, .29, -.83, .04, .045, '#acbc8c');
  } else if (scholar) {
    poly(ctx, [[.1, -.37], [.27, -.31], [.24, -.15], [.08, -.21]], '#b9a57a', '#574d3e', .012);
    line(ctx, [[.15, -.34], [.13, -.2]], '#806c4e', .008);
  } else if (/mira/.test(id)) {
    line(ctx, [[.17, -.23], [.26, -.38]], '#c1a16c', .012); ellipse(ctx, .29, -.35, .07, .085, '#e5ba73', '#8e774c');
  } else if (/lio|bard|minstrel/.test(id)) {
    ellipse(ctx, .15, -.3, .1, .14, '#ae854a', '#6b5039'); line(ctx, [[.17, -.39], [.28, -.61]], '#a18b5c', .045);
  } else if (/tobin|innkeeper/.test(id)) {
    poly(ctx, [[-.09, -.47], [.12, -.47], [.16, -.16], [-.1, -.16]], '#b9b192', '#777461', .01);
    ellipse(ctx, .21, -.23, .045, .06, '#9b8057', '#463c31');
  }
}

/** Character art is anchored by the base at (px, py); letters are never painted. */
export function drawIsoToken(ctx: CanvasRenderingContext2D, px: number, py: number, width: number, color: string, glyph: string, opts: IsoTokenOptions = {}): void {
  const c = opts.character, time = opts.time ?? 0;
  const down = opts.down || (c && c.hp <= 0), faint = opts.dim || down;
  ctx.save();
  if (faint) ctx.globalAlpha *= down ? .43 : .57;
  const ring = opts.ring ?? (opts.enemy ? '#de7f77' : opts.selected ? '#ffe2a1' : '#8cd3bc');
  ctx.translate(px, py);
  const pulse = .5 + Math.sin(time / 750) * .15;
  if (opts.selected) lightGlow(ctx, 0, -width * .05, width * .55, `rgba(221,191,111,${pulse * .15})`);
  ctx.beginPath(); ctx.ellipse(0, width * .025, width * .39, width * .17, 0, 0, TAU); ctx.fillStyle = 'rgba(2,9,16,.47)'; ctx.fill();
  ctx.strokeStyle = ring; ctx.lineWidth = opts.selected ? 2.5 : 1.5; ctx.stroke();
  const civilian = civilianIndex(c, opts.role, opts.npcId);
  const civilianAtlas = civilian !== null ? getArtAtlas('civilians') : null;
  const atlas = getArtAtlas('miniatures'), idx = miniatureIndex(c, opts.role, opts.npcId, glyph);
  const bob = down ? 0 : Math.sin(time / 700 + hash(c?.name.length ?? 0, idx ?? 0) * TAU) * width * .005;
  if (opts.sprite) {
    ctx.drawImage(opts.sprite, -width * .47, -width * .84 + bob, width * .94, width * .88);
  } else if (civilianAtlas && civilian !== null) {
    const f = atlasFrame(civilianAtlas, civilian);
    const scale = [8, 9, 10, 11].includes(civilian) ? .57 : [12, 14, 15].includes(civilian) ? .68 : .81;
    const dh = width * scale, dw = dh * f.w / f.h;
    const echo = /ysolde_echo|maddie|a1w_lenn$/.test(opts.npcId ?? '');
    if (echo) { ctx.globalAlpha *= .65; lightGlow(ctx, 0, -width * .3, width * .52, 'rgba(141,183,207,.15)'); }
    ctx.drawImage(civilianAtlas, f.x, f.y, f.w, f.h, -dw / 2, -dh + width * .065 + bob, dw, dh);
  } else if (atlas && idx !== null) {
    const sw = atlas.naturalWidth / 4, sh = atlas.naturalHeight / 4;
    const dw = width * 1.08, dh = dw * sh / sw;
    ctx.drawImage(atlas, (idx % 4) * sw, Math.floor(idx / 4) * sh, sw, sh, -dw / 2, -dh + width * .115 + bob, dw, dh);
  } else {
    ctx.scale(width, width);
    if (/crawler/.test(c?.templateId ?? opts.npcId ?? '')) crawlerArt(ctx, time / 700);
    else if (/bellwarden|halric/.test(c?.templateId ?? opts.npcId ?? '')) bellwardenArt(ctx, time / 900);
    else civilianArt(ctx, opts.npcId ?? c?.name.toLowerCase() ?? '', color, time / 700);
    ctx.scale(1 / width, 1 / width);
  }
  // A subtle front edge keeps team allegiance legible even under large silhouettes.
  ctx.beginPath(); ctx.ellipse(0, width * .025, width * .39, width * .17, 0, .08, Math.PI - .08);
  ctx.strokeStyle = ring; ctx.lineWidth = opts.selected ? 2 : 1; ctx.stroke();
  ctx.restore();
}
