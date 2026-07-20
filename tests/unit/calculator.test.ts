import { describe, expect, it } from 'vitest';
import {
  formatNumber,
  initialState,
  reducer,
  type CalcAction,
  type CalcState,
  type Op,
} from '../../src/calculator';

/** Replay a key sequence: digits, + - * / = . as themselves, C=clear, N=negate, %=percent, <=backspace. */
export function press(seq: string, from: CalcState = initialState): CalcState {
  const toAction = (ch: string): CalcAction => {
    if (/[0-9]/.test(ch)) return { type: 'digit', digit: ch };
    if (ch === '+' || ch === '-' || ch === '*' || ch === '/') return { type: 'operator', op: ch as Op };
    switch (ch) {
      case '=': return { type: 'equals' };
      case '.': return { type: 'decimal' };
      case 'C': return { type: 'clear' };
      case 'N': return { type: 'negate' };
      case '%': return { type: 'percent' };
      case '<': return { type: 'backspace' };
      default: throw new Error(`unknown key: ${ch}`);
    }
  };
  return [...seq].reduce((s, ch) => reducer(s, toAction(ch)), from);
}

const display = (seq: string) => press(seq).current;

describe('digit entry', () => {
  it('starts at 0 and replaces the leading zero', () => {
    expect(display('')).toBe('0');
    expect(display('007')).toBe('7');
  });

  it('appends digits and a single decimal point', () => {
    expect(display('12.34')).toBe('12.34');
    expect(display('1.2.3.4')).toBe('1.234');
  });

  it('starts a decimal from zero', () => {
    expect(display('.5')).toBe('0.5');
  });

  it('caps entry at 12 digits, not counting sign and point', () => {
    expect(display('1234567890123')).toBe('123456789012');
    expect(display('1.23456789012345')).toBe('1.23456789012');
  });
});

describe('arithmetic', () => {
  it.each([
    ['5+3=', '8'],
    ['9-4=', '5'],
    ['6*7=', '42'],
    ['8/2=', '4'],
    ['2N+5=', '3'],
  ])('%s shows %s', (seq, expected) => {
    expect(display(seq)).toBe(expected);
  });

  it('chains left to right as operators arrive', () => {
    expect(display('2+3+=')).toBe('5');
    expect(display('2+3*4=')).toBe('20');
    expect(display('100-10-10=')).toBe('80');
  });

  it('avoids floating point noise', () => {
    expect(display('0.1+0.2=')).toBe('0.3');
    expect(display('1/3=')).toBe('0.333333333333');
  });

  it('falls back to exponential when the result overflows the display', () => {
    expect(display('999999999999*999999999999=')).toBe('1e+24');
  });

  it('pressing equals with no pending operator is a no-op', () => {
    expect(display('5=')).toBe('5');
    expect(display('5+3==')).toBe('8');
  });
});

describe('after equals', () => {
  it('a digit starts a fresh calculation', () => {
    expect(display('5+3=7')).toBe('7');
    const s = press('5+3=7');
    expect(s.previous).toBeNull();
    expect(s.operator).toBeNull();
  });

  it('an operator continues from the result', () => {
    expect(display('5+3=*2=')).toBe('16');
  });

  it('a decimal starts a fresh 0.', () => {
    expect(display('5+3=.5')).toBe('0.5');
  });

  it('backspace does not eat the result', () => {
    expect(display('5+3=<')).toBe('8');
  });
});

describe('error handling', () => {
  it('divide by zero shows Error', () => {
    expect(display('5/0=')).toBe('Error');
  });

  it('operators are ignored while in Error, digits recover', () => {
    expect(display('5/0=+')).toBe('Error');
    expect(display('5/0=7')).toBe('7');
    expect(display('5/0=<')).toBe('0');
    expect(display('5/0=C')).toBe('0');
  });

  it('overflow to Infinity shows Error', () => {
    let s = press('999999999999*999999999999=');
    let sawError = false;
    for (let i = 0; i < 30 && !sawError; i++) {
      s = press('*999999999999=', s);
      sawError = s.current === 'Error';
    }
    expect(sawError).toBe(true);
  });
});

describe('negate, percent, backspace', () => {
  it('negate toggles sign and ignores zero', () => {
    expect(display('5N')).toBe('-5');
    expect(display('5NN')).toBe('5');
    expect(display('0N')).toBe('0');
  });

  it('percent divides by 100', () => {
    expect(display('50%')).toBe('0.5');
    expect(display('5%%')).toBe('0.0005');
  });

  it('backspace trims one character and bottoms out at 0', () => {
    expect(display('123<')).toBe('12');
    expect(display('123<<<')).toBe('0');
    expect(display('123<<<<')).toBe('0');
    expect(display('5N<')).toBe('0');
  });

  it('clear resets calculation state', () => {
    const s = press('5+3C');
    expect(s.current).toBe('0');
    expect(s.previous).toBeNull();
    expect(s.operator).toBeNull();
  });
});

describe('judgement wiring', () => {
  it('judges only on explicit equals, not on chaining', () => {
    const chained = press('5*5+');
    expect(chained.judgement).toBeNull();
    expect(chained.judgementId).toBe(0);

    const equalled = press('5*5=');
    expect(equalled.judgement?.verdict).toBe('mock');
    expect(equalled.judgementId).toBe(1);
  });

  it('does not judge an Error result', () => {
    expect(press('5/0=').judgement).toBeNull();
  });

  it('bumps judgementId on every judged equals', () => {
    const s = press('5*5=C2+2=');
    expect(s.judgementId).toBe(2);
  });

  it('clear leaves the active judgement alone so the bubble is not cancelled', () => {
    const s = press('5*5=C');
    expect(s.judgement?.verdict).toBe('mock');
  });
});

describe('formatNumber', () => {
  it.each([
    [0.30000000000000004, '0.3'],
    [1e25, '1e+25'],
    [-42, '-42'],
    [NaN, 'Error'],
    [Infinity, 'Error'],
  ])('formats %s as %s', (n, expected) => {
    expect(formatNumber(n)).toBe(expected);
  });
});
