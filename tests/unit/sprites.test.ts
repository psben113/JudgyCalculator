import { describe, expect, it } from 'vitest';
import { SPRITES } from '../../src/sprites';

describe('sprite integrity', () => {
  const entries = Object.entries(SPRITES);

  it('has the expected sprite set', () => {
    expect(Object.keys(SPRITES).sort()).toEqual(['bird', 'bunny', 'butterfly', 'cloud', 'sun']);
  });

  it.each(entries)('%s: every row is the same width', (_name, sprite) => {
    const widths = new Set(
      Object.values(sprite.frames).flatMap((rows) => rows.map((r) => r.length)),
    );
    expect(widths.size).toBe(1);
  });

  it.each(entries)('%s: every frame is the same height', (_name, sprite) => {
    const heights = new Set(Object.values(sprite.frames).map((rows) => rows.length));
    expect(heights.size).toBe(1);
  });

  it.each(entries)('%s: uses only palette characters and transparency', (_name, sprite) => {
    for (const [frameName, rows] of Object.entries(sprite.frames)) {
      for (const row of rows) {
        for (const ch of row) {
          expect(
            ch === '.' || ch in sprite.palette,
            `unknown char '${ch}' in ${frameName}`,
          ).toBe(true);
        }
      }
    }
  });

  it.each(entries)('%s: palette colors are hex and every color is used', (_name, sprite) => {
    const used = new Set(Object.values(sprite.frames).flatMap((rows) => rows.join('').split('')));
    for (const [ch, color] of Object.entries(sprite.palette)) {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(used.has(ch), `palette char '${ch}' is never drawn`).toBe(true);
    }
  });

  it('the sun has every mood the app can request', () => {
    expect(Object.keys(SPRITES.sun.frames).sort()).toEqual(
      ['blink', 'idle', 'laugh1', 'laugh2', 'praise'],
    );
    for (const rows of Object.values(SPRITES.sun.frames)) {
      expect(rows.length).toBe(16);
      expect(rows[0].length).toBe(16);
    }
  });

  it('animated critters have at least two frames', () => {
    for (const name of ['bunny', 'bird', 'butterfly'] as const) {
      expect(Object.keys(SPRITES[name].frames).length).toBeGreaterThanOrEqual(2);
    }
  });
});
