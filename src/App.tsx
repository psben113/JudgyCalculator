import { useEffect, useReducer, useState } from 'react';
import { initialState, reducer } from './calculator';
import type { Judgement } from './judge';
import { Calculator } from './components/Calculator';
import { Scene } from './components/Scene';
import type { Mood } from './components/SunFace';

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [active, setActive] = useState<Judgement | null>(null);

  useEffect(() => {
    if (!state.judgement) return;
    setActive(state.judgement);
    const ms = state.judgement.verdict === 'mock' ? 4200 : 3000;
    const t = setTimeout(() => setActive(null), ms);
    return () => clearTimeout(t);
  }, [state.judgement, state.judgementId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      if (/^[0-9]$/.test(k)) dispatch({ type: 'digit', digit: k });
      else if (k === '+' || k === '-' || k === '*' || k === '/') dispatch({ type: 'operator', op: k });
      else if (k === '.' || k === ',') dispatch({ type: 'decimal' });
      else if (k === 'Enter' || k === '=') { e.preventDefault(); dispatch({ type: 'equals' }); }
      else if (k === 'Backspace') dispatch({ type: 'backspace' });
      else if (k === 'Escape' || k === 'Delete') dispatch({ type: 'clear' });
      else if (k === '%') dispatch({ type: 'percent' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const mood: Mood = active === null ? 'idle' : active.verdict === 'mock' ? 'mock' : 'praise';

  return (
    <div className={`app${mood === 'mock' ? ' night' : ''}`}>
      <Scene mood={mood} message={active?.message ?? null} />
      <Calculator state={state} dispatch={dispatch} />
    </div>
  );
}
