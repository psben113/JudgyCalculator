import type { Dispatch } from 'react';
import { OP_SYMBOLS, formatNumber, type CalcAction, type CalcState, type Op } from '../calculator';

interface Props {
  state: CalcState;
  dispatch: Dispatch<CalcAction>;
}

const OPS: Op[] = ['/', '*', '-', '+'];

export function Calculator({ state, dispatch }: Props) {
  const expression =
    state.operator !== null && state.previous !== null
      ? `${formatNumber(state.previous)} ${OP_SYMBOLS[state.operator]}`
      : ' ';

  return (
    <div className="calc">
      <div className="display">
        <div className="expression">{expression}</div>
        <div className="result">{state.current}</div>
      </div>
      <div className="keys">
        <button className="key fn" onClick={() => dispatch({ type: 'clear' })}>AC</button>
        <button className="key fn" onClick={() => dispatch({ type: 'negate' })}>±</button>
        <button className="key fn" onClick={() => dispatch({ type: 'percent' })}>%</button>
        <button className="key op" onClick={() => dispatch({ type: 'operator', op: OPS[0] })}>÷</button>

        {['7', '8', '9'].map((d) => (
          <button key={d} className="key" onClick={() => dispatch({ type: 'digit', digit: d })}>{d}</button>
        ))}
        <button className="key op" onClick={() => dispatch({ type: 'operator', op: OPS[1] })}>×</button>

        {['4', '5', '6'].map((d) => (
          <button key={d} className="key" onClick={() => dispatch({ type: 'digit', digit: d })}>{d}</button>
        ))}
        <button className="key op" onClick={() => dispatch({ type: 'operator', op: OPS[2] })}>−</button>

        {['1', '2', '3'].map((d) => (
          <button key={d} className="key" onClick={() => dispatch({ type: 'digit', digit: d })}>{d}</button>
        ))}
        <button className="key op" onClick={() => dispatch({ type: 'operator', op: OPS[3] })}>+</button>

        <button className="key" onClick={() => dispatch({ type: 'backspace' })}>⌫</button>
        <button className="key" onClick={() => dispatch({ type: 'digit', digit: '0' })}>0</button>
        <button className="key" onClick={() => dispatch({ type: 'decimal' })}>.</button>
        <button className="key eq" onClick={() => dispatch({ type: 'equals' })}>=</button>
      </div>
    </div>
  );
}
