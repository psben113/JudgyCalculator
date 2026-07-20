import { OP_SYMBOLS, formatNumber, type Op } from './calculator';

export type Verdict = 'mock' | 'praise';

export interface Judgement {
  verdict: Verdict;
  message: string;
  expr: string;
}

const MOCKS = [
  '"{expr}"? I have clouds smarter than that.',
  'The bunny knew that one. The BUNNY.',
  'I am a whole computer and you bring me "{expr}".',
  '"{expr}". Groundbreaking work, professor.',
  'My grass grows faster than your mental math.',
  'Even the butterfly is embarrassed for you.',
  'That is literally on a times-table poster.',
  'HA! HAHAHA! ...oh wait, you were serious.',
  'Somewhere, a maths teacher just felt a chill.',
  'I shine on this planet for THIS?',
];

const IDENTITY_MOCKS: Array<{ test: (a: number, op: Op, b: number) => boolean; msg: string }> = [
  {
    test: (a, op, b) => op === '*' && (a === 0 || b === 0),
    msg: 'Multiplying by zero. The answer was inside you all along.',
  },
  {
    test: (a, op, b) => op === '*' && (a === 1 || b === 1),
    msg: 'Times one. A journey to nowhere.',
  },
  {
    test: (a, op, b) => op === '+' && (a === 0 || b === 0),
    msg: 'Adding zero. Bold. Pointless, but bold.',
  },
  {
    test: (_a, op, b) => op === '-' && b === 0,
    msg: 'Minus zero. I felt that effort from up here.',
  },
  {
    test: (a, op, b) => op === '-' && a === b,
    msg: '{expr}. It is zero. I need to sit down.',
  },
  {
    test: (_a, op, b) => op === '/' && b === 1,
    msg: 'Divided by one. It was always the same number.',
  },
];

const PRAISES = [
  'Okay. THAT one earned my respect.',
  'Now THAT is worth a computer. Carry on.',
  'Ooh. The critters are impressed. So am I.',
  'Finally, some real math. I retract 30% of my judgement.',
];

function pick(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)];
}

export function judge(a: number, op: Op, b: number): Judgement | null {
  const expr = `${formatNumber(a)} ${OP_SYMBOLS[op]} ${formatNumber(b)}`;
  const fill = (msg: string) => msg.replace('{expr}', expr);

  for (const { test, msg } of IDENTITY_MOCKS) {
    if (test(a, op, b)) return { verdict: 'mock', message: fill(msg), expr };
  }

  const smallInts =
    Number.isInteger(a) && Number.isInteger(b) && Math.abs(a) <= 10 && Math.abs(b) <= 10;
  // Small division only counts as trivial when it divides evenly (7 ÷ 3 is honest work).
  const trivial = smallInts && (op !== '/' || Number.isInteger(a / b));
  if (trivial) return { verdict: 'mock', message: fill(pick(MOCKS)), expr };

  const hefty = Math.abs(a) >= 1000 && Math.abs(b) >= 1000;
  const fiddly = !Number.isInteger(a) && !Number.isInteger(b);
  if (hefty || fiddly) return { verdict: 'praise', message: pick(PRAISES), expr };

  return null;
}
