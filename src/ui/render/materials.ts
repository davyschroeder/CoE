/** Local, painted surface materials. Loading never blocks the procedural renderer. */
export const MATERIALS = {
  grass: 0, forestFloor: 1, cobblestone: 2, earth: 3,
  woodPlanks: 4, cathedralStone: 5, cryptStone: 6, vaultSlate: 7,
  ruinsStone: 8, arcanePlumStone: 9, redCarpet: 10, water: 11,
  mossyRock: 12, stoneMasonry: 13, roofShingles: 14, woodGrain: 15,
} as const;

export interface MaterialAtlasStatus { ready: boolean; version: number; }
export interface MaterialPoint { x: number; y: number; }
interface MaterialFrame { image: HTMLImageElement; x: number; y: number; w: number; h: number; }

const COLUMNS = 4, ROWS = 4, INSET = 1;
let atlas: HTMLImageElement | null = null;
let ready = false;
let settled = false;
let version = 0;

function settle(image: HTMLImageElement, loaded: boolean): void {
  if (settled || image !== atlas) return;
  settled = true;
  ready = loaded && image.naturalWidth / COLUMNS > INSET * 2 && image.naturalHeight / ROWS > INSET * 2;
  // A caller can cache fallback tiles under version 0, then discard them as soon
  // as the image finishes. Increment on failure too, without retrying every frame.
  version++;
}

function ensureAtlas(): void {
  if (typeof Image === 'undefined') return;
  if (!atlas) {
    const image = new Image();
    atlas = image;
    image.decoding = 'async';
    image.onload = () => settle(image, true);
    image.onerror = () => settle(image, false);
    image.src = `${import.meta.env.BASE_URL}art/materials.png`;
  }
  // Cached local files can already be complete before their load callback runs.
  if (!settled && atlas.complete && atlas.naturalWidth > 0) settle(atlas, true);
}

/** Include version in tile/prop cache keys; ready turns true once local art loads. */
export function materialAtlasStatus(): MaterialAtlasStatus {
  ensureAtlas();
  return { ready, version };
}

function materialFrame(index: number): MaterialFrame | null {
  if (!Number.isInteger(index) || index < 0 || index >= COLUMNS * ROWS) return null;
  ensureAtlas();
  if (!ready || !atlas) return null;
  const w = atlas.naturalWidth / COLUMNS, h = atlas.naturalHeight / ROWS;
  return {
    image: atlas,
    // Keep fractional source coordinates: the 1254px atlas has 313.5px cells.
    x: index % COLUMNS * w + INSET,
    y: Math.floor(index / COLUMNS) * h + INSET,
    w: w - INSET * 2, h: h - INSET * 2,
  };
}

/** Paint one atlas cell into a rectangle in the caller's current coordinate space. */
export function drawMaterialPatch(
  ctx: CanvasRenderingContext2D, index: number,
  x: number, y: number, width: number, height: number,
): boolean {
  if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return false;
  const frame = materialFrame(index);
  if (!frame) return false;
  ctx.drawImage(frame.image, frame.x, frame.y, frame.w, frame.h, x, y, width, height);
  return true;
}

/**
 * Affine square → parallelogram, for a floor diamond or roof/wall facet.
 * origin is the source top-left; axisXEnd and axisYEnd are the two adjacent
 * destination corners (absolute points, not vectors). Existing alpha, clipping,
 * and camera transforms are respected. Returns false while artwork is loading.
 */
export function drawMaterialPlane(
  ctx: CanvasRenderingContext2D, index: number,
  origin: MaterialPoint, axisXEnd: MaterialPoint, axisYEnd: MaterialPoint,
): boolean {
  const ax = axisXEnd.x - origin.x, ay = axisXEnd.y - origin.y;
  const bx = axisYEnd.x - origin.x, by = axisYEnd.y - origin.y;
  const determinant = ax * by - ay * bx;
  if (![origin.x, origin.y, ax, ay, bx, by, determinant].every(Number.isFinite) || Math.abs(determinant) < 1e-12) return false;
  const frame = materialFrame(index);
  if (!frame) return false;
  ctx.save();
  try {
    ctx.transform(ax, ay, bx, by, origin.x, origin.y);
    ctx.drawImage(frame.image, frame.x, frame.y, frame.w, frame.h, 0, 0, 1, 1);
  } finally {
    ctx.restore();
  }
  return true;
}
