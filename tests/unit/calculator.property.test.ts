import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  initialState,
  reducer,
  type CalcAction,
  type CalcState,
} from '../../src/calculator';

const actionArb: fc.Arbitrary<CalcAction> = fc.oneof(
  fc.constantFrom(...'0123456789').map((d): CalcAction => ({ type: 'digit', digit: d })),
  fc.constantFrom('+', '-', '*', '/').map((op): CalcAction => ({ type: 'operator', op })),
  fc.constantFrom<CalcAction>(
    { type: 'decimal' },
    { type: 'equals' },
    { type: 'clear' },
    { type: 'negate' },
    { type: 'percent' },
    { type: 'backspace' },
  ),
);

function deepFreeze<T>(obj: T): T {
  Object.freeze(obj);
  for (const v of Object.values(obj as object)) {
    if (v !== null && typeof v === 'object' && !Object.isFrozen(v)) deepFreeze(v);
  }
  return obj;
}

function typeInt(state: CalcState, n: number): CalcState {
  let s = state;
  for (const d of String(Math.abs(n))) s = reducer(s, { type: 'digit', digit: d });
  if (n < 0) s = reducer(s, { type: 'negate' });
  return s;
}

describe('reducer invariants', () => {
  it('never throws, never mutates, and the display always holds a number or Error', () => {
    fc.assert(
      fc.property(fc.array(actionArb, { maxLength: 80 }), (actions) => {
        let s = initialState;
        for (const a of actions) {
          s = reducer(deepFreeze(s), a);
          expect(s.current === 'Error' || Number.isFinite(parseFloat(s.current))).toBe(true);
          expect(s.current.length).toBeLessThanOrEqual(15); // "-0." + 12 digits
          if (s.operator !== null) expect(s.previous).not.toBeNull();
        }
      }),
      { numRuns: 300 },
    );
  });

  it('typed digits then backspace equals not typing the last digit', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 99999999999 }),
        fc.constantFrom(...'0123456789'),
        (n, extra) => {
          const typed = typeInt(initialState, n);
          const typedThenDeleted = reducer(
            reducer(typed, { type: 'digit', digit: extra }),
            { type: 'backspace' },
          );
          expect(typedThenDeleted.current).toBe(typed.current);
        },
      ),
    );
  });

  it('negate twice is the identity for any nonzero entry', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 999999999 }), (n) => {
        const typed = typeInt(initialState, n);
        const doubleNegated = reducer(reducer(typed, { type: 'negate' }), { type: 'negate' });
        expect(doubleNegated.current).toBe(typed.current);
      }),
    );
  });
});

describe('arithmetic properties', () => {
  const smallInt = fc.integer({ min: -99999, max: 99999 });

  it('a + b and a - b are exact for integers', () => {
    fc.assert(
      fc.property(smallInt, smallInt, fc.constantFrom('+', '-'), (a, b, op) => {
        let s = typeInt(initialState, a);
        s = reducer(s, { type: 'operator', op });
        s = typeInt(s, b);
        s = reducer(s, { type: 'equals' });
        expect(parseFloat(s.current)).toBe(op === '+' ? a + b : a - b);
      }),
    );
  });

  it('multiplying then dividing by the same nonzero value returns the original', () => {
    fc.assert(
      fc.property(smallInt, smallInt.filter((n) => n !== 0), (a, b) => {
        let s = typeInt(initialState, a);
        s = reducer(s, { type: 'operator', op: '*' });
        s = typeInt(s, b);
        s = reducer(s, { type: 'equals' });
        s = reducer(s, { type: 'operator', op: '/' });
        s = typeInt(s, b);
        s = reducer(s, { type: 'equals' });
        expect(parseFloat(s.current)).toBe(a);
      }),
    );
  });

  it('judgement never praises small-integer math', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -10, max: 10 }),
        fc.integer({ min: -10, max: 10 }),
        fc.constantFrom('+', '-', '*'),
        (a, b, op) => {
          let s = typeInt(initialState, a);
          s = reducer(s, { type: 'operator', op });
          s = typeInt(s, b);
          s = reducer(s, { type: 'equals' });
          expect(s.judgement?.verdict).toBe('mock');
        },
      ),
    );
  });
});
