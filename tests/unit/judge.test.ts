import { afterEach, describe, expect, it, vi } from 'vitest';
import { judge } from '../../src/judge';

afterEach(() => vi.restoreAllMocks());

describe('mock verdicts', () => {
  it.each([
    [5, '*', 5],
    [2, '+', 2],
    [10, '-', 3],
    [8, '/', 2],
    [10, '+', 10],
    [-10, '*', -10],
    [0, '/', 5],
  ] as const)('mocks %s %s %s', (a, op, b) => {
    expect(judge(a, op, b)?.verdict).toBe('mock');
  });

  it('spares small division that does not divide evenly', () => {
    expect(judge(7, '/', 3)).toBeNull();
  });

  it('mocks identity operations regardless of size', () => {
    expect(judge(123456, '*', 1)?.message).toContain('Times one');
    expect(judge(123456, '*', 0)?.message).toContain('zero');
    expect(judge(987654, '+', 0)?.message).toContain('Adding zero');
    expect(judge(987654, '-', 0)?.message).toContain('Minus zero');
    expect(judge(4321, '/', 1)?.message).toContain('Divided by one');
  });

  it('mocks n minus itself with the expression named', () => {
    const j = judge(555, '-', 555);
    expect(j?.verdict).toBe('mock');
    expect(j?.message).toContain('555 − 555');
  });

  it('fills the {expr} template with formatted operands', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const j = judge(5, '*', 5);
    expect(j?.message).toBe('"5 × 5"? I have clouds smarter than that.');
    expect(j?.expr).toBe('5 × 5');
  });
});

describe('praise verdicts', () => {
  it('praises hefty operands (both >= 1000)', () => {
    expect(judge(2000, '*', 3000)?.verdict).toBe('praise');
  });

  it('praises decimal-on-decimal math', () => {
    expect(judge(1.5, '+', 2.5)?.verdict).toBe('praise');
    expect(judge(1234.5, '*', 6789.1)?.verdict).toBe('praise');
  });

  it('identity beats praise: a million times one is still mocked', () => {
    expect(judge(1000000, '*', 1)?.verdict).toBe('mock');
  });
});

describe('the indifferent middle', () => {
  it.each([
    [11, '+', 11],
    [999, '*', 1000],
    [1.5, '+', 2],
    [47, '*', 62],
  ] as const)('stays quiet for %s %s %s', (a, op, b) => {
    expect(judge(a, op, b)).toBeNull();
  });
});

describe('message pools', () => {
  it('every mock message is reachable and non-empty', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 10; i++) {
      vi.spyOn(Math, 'random').mockReturnValue(i / 10 + 0.0001);
      const j = judge(3, '+', 4);
      expect(j?.verdict).toBe('mock');
      expect(j?.message.length).toBeGreaterThan(0);
      expect(j?.message).not.toContain('{expr}');
      seen.add(j!.message);
      vi.restoreAllMocks();
    }
    expect(seen.size).toBeGreaterThan(5);
  });
});
