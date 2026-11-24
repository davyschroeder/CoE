import { afterEach, describe, expect, it, vi } from 'vitest';

class TestImage {
  src = '';
  decoding = '';
  complete = false;
  naturalWidth = 0;
  naturalHeight = 0;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
}

async function materialRenderer() {
  vi.resetModules();
  const images: TestImage[] = [];
  vi.stubGlobal('Image', class extends TestImage { constructor() { super(); images.push(this); } });
  const materials = await import('../src/ui/render/materials');
  const context = { globalAlpha: 0.42, drawImage: vi.fn(), save: vi.fn(), restore: vi.fn(), transform: vi.fn() };
  return { materials, images, context, ctx: context as unknown as CanvasRenderingContext2D };
}

async function complete(image: TestImage) {
  await Promise.resolve();
  image.complete = true;
  image.naturalWidth = image.naturalHeight = 1254;
  image.onload?.();
}

afterEach(() => vi.unstubAllGlobals());

describe('painted material atlas', () => {
  it('loads lazily once and changes the cache version when asynchronous art becomes ready', async () => {
    const { materials, images, ctx, context } = await materialRenderer();
    expect(images).toHaveLength(0);
    const fallback = materials.materialAtlasStatus();
    expect(fallback.ready).toBe(false);
    expect(materials.drawMaterialPatch(ctx, materials.MATERIALS.grass, 0, 0, 64, 64)).toBe(false);
    expect(context.drawImage).not.toHaveBeenCalled();
    expect(images).toHaveLength(1);
    expect(images[0].src).toMatch(/art\/materials\.png$/);
    await complete(images[0]);
    const loaded = materials.materialAtlasStatus();
    expect(loaded.ready).toBe(true);
    expect(loaded.version).toBeGreaterThan(fallback.version);
    images[0].onload?.();
    expect(materials.materialAtlasStatus()).toEqual(loaded);
    expect(materials.drawMaterialPatch(ctx, materials.MATERIALS.grass, 0, 0, 64, 64)).toBe(true);
    expect(images).toHaveLength(1);
  });

  it('samples fractional cells with a one-pixel inset and projects an affine diamond without resetting alpha', async () => {
    const { materials, images, ctx, context } = await materialRenderer();
    materials.materialAtlasStatus();
    await complete(images[0]);
    expect(materials.drawMaterialPlane(ctx, materials.MATERIALS.cathedralStone,
      { x: -0.5, y: 0 }, { x: 0, y: -0.25 }, { x: 0, y: 0.25 })).toBe(true);
    expect(context.transform).toHaveBeenCalledWith(0.5, -0.25, 0.5, 0.25, -0.5, 0);
    expect(context.drawImage).toHaveBeenCalledWith(images[0], 314.5, 314.5, 311.5, 311.5, 0, 0, 1, 1);
    expect(context.globalAlpha).toBe(0.42);
    expect(context.save).toHaveBeenCalledTimes(1);
    expect(context.restore).toHaveBeenCalledTimes(1);
  });

  it('keeps the procedural fallback after a failed load without retrying each frame', async () => {
    const { materials, images, ctx, context } = await materialRenderer();
    const pending = materials.materialAtlasStatus();
    images[0].onerror?.();
    const failed = materials.materialAtlasStatus();
    expect(failed.ready).toBe(false);
    expect(failed.version).toBeGreaterThan(pending.version);
    for (let i = 0; i < 3; i++) expect(materials.drawMaterialPatch(ctx, 14, 0, 0, 1, 1)).toBe(false);
    expect(images).toHaveLength(1);
    expect(context.drawImage).not.toHaveBeenCalled();
    expect(materials.materialAtlasStatus()).toEqual(failed);
  });
});
