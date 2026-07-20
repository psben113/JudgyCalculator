import { judge, type Judgement } from './judge';

export type Op = '+' | '-' | '*' | '/';

export const OP_SYMBOLS: Record<Op, string> = { '+': '+', '-': '−', '*': '×', '/': '÷' };

const MAX_DIGITS = 12;

export interface CalcState {
  current: string;
  previous: number | null;
  operator: Op | null;
  justEvaluated: boolean;
  judgement: Judgement | null;
  judgementId: number;
}

export const initialState: CalcState = {
  current: '0',
  previous: null,
  operator: null,
  justEvaluated: false,
  judgement: null,
  judgementId: 0,
};

export type CalcAction =
  | { type: 'digit'; digit: string }
  | { type: 'operator'; op: Op }
  | { type: 'decimal' }
  | { type: 'equals' }
  | { type: 'clear' }
  | { type: 'negate' }
  | { type: 'percent' }
  | { type: 'backspace' };

function compute(a: number, op: Op, b: number): number {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/': return b === 0 ? NaN : a / b;
  }
}

export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return 'Error';
  let s = String(parseFloat(n.toPrecision(12)));
  // Leading zeros are not significant: "0.333333333333" fits the display.
  if (s.replace(/[-.]/g, '').replace(/^0+/, '').length > MAX_DIGITS) {
    s = n.toExponential(6).replace(/\.?0+e/, 'e');
  }
  return s;
}

function startFresh(state: CalcState): CalcState {
  if (state.current === 'Error' || state.justEvaluated) {
    return { ...state, current: '0', previous: null, operator: null, justEvaluated: false };
  }
  return state;
}

function evaluate(state: CalcState, wantJudgement: boolean): CalcState {
  if (state.operator === null || state.previous === null || state.current === 'Error') {
    return state;
  }
  const a = state.previous;
  const b = parseFloat(state.current);
  const result = compute(a, state.operator, b);
  const judgement = wantJudgement && Number.isFinite(result) ? judge(a, state.operator, b) : null;
  return {
    ...state,
    current: formatNumber(result),
    previous: null,
    operator: null,
    justEvaluated: true,
    judgement: judgement ?? state.judgement,
    judgementId: judgement ? state.judgementId + 1 : state.judgementId,
  };
}

export function reducer(state: CalcState, action: CalcAction): CalcState {
  switch (action.type) {
    case 'digit': {
      const s = startFresh(state);
      if (s.current.replace(/[-.]/g, '').length >= MAX_DIGITS) return s;
      return { ...s, current: s.current === '0' ? action.digit : s.current + action.digit };
    }

    case 'decimal': {
      const s = startFresh(state);
      if (s.current.includes('.')) return s;
      return { ...s, current: s.current + '.' };
    }

    case 'operator': {
      if (state.current === 'Error') return state;
      let s = state;
      // Chain: 2 + 3 + … evaluates the pending pair first (silently, no judgement).
      if (s.operator !== null && s.previous !== null && !s.justEvaluated && s.current !== '0') {
        s = evaluate(s, false);
        if (s.current === 'Error') return s;
      }
      return {
        ...s,
        previous: parseFloat(s.current),
        operator: action.op,
        current: '0',
        justEvaluated: false,
      };
    }

    case 'equals':
      return evaluate(state, true);

    case 'clear':
      return { ...initialState, judgement: state.judgement, judgementId: state.judgementId };

    case 'negate': {
      if (state.current === 'Error' || state.current === '0') return state;
      return {
        ...state,
        current: state.current.startsWith('-') ? state.current.slice(1) : '-' + state.current,
      };
    }

    case 'percent': {
      if (state.current === 'Error') return state;
      return { ...state, current: formatNumber(parseFloat(state.current) / 100) };
    }

    case 'backspace': {
      if (state.current === 'Error') return { ...state, current: '0' };
      if (state.justEvaluated) return state;
      let c = state.current.length > 1 ? state.current.slice(0, -1) : '0';
      if (c === '-') c = '0';
      return { ...state, current: c };
    }
  }
}
