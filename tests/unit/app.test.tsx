// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const key = (name: string) => screen.getByRole('button', { name });
const result = () => document.querySelector('.result')!.textContent;
const app = () => document.querySelector('.app')!;
const bubble = () => document.querySelector('.bubble');
const tick = (ms: number) => act(() => vi.advanceTimersByTime(ms));

function calculate(seq: string[]) {
  for (const k of seq) fireEvent.click(key(k));
}

describe('basic interaction', () => {
  it('renders a peaceful day with a zeroed display', () => {
    render(<App />);
    expect(result()).toBe('0');
    expect(app().classList.contains('night')).toBe(false);
    expect(document.querySelector('.sun.mood-idle')).not.toBeNull();
    expect(bubble()).toBeNull();
  });

  it('computes via button clicks', () => {
    render(<App />);
    calculate(['1', '2', '+', '3', '=']);
    expect(result()).toBe('15');
  });

  it('computes via keyboard', () => {
    render(<App />);
    for (const k of ['8', '*', '4']) fireEvent.keyDown(window, { key: k });
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(result()).toBe('32');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(result()).toBe('0');
  });
});

describe('the judgement', () => {
  it('5 × 5 turns the world dark and the sun mean, then daylight returns', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    render(<App />);
    calculate(['5', '×', '5', '=']);

    expect(result()).toBe('25');
    expect(app().classList.contains('night')).toBe(true);
    expect(document.querySelector('.sun.mood-mock')).not.toBeNull();
    expect(bubble()!.textContent).toBe('"5 × 5"? I have clouds smarter than that.');

    tick(4300);
    expect(app().classList.contains('night')).toBe(false);
    expect(bubble()).toBeNull();
    expect(document.querySelector('.sun.mood-idle')).not.toBeNull();
  });

  it('a fresh offense during an active judgement restarts the clock', () => {
    render(<App />);
    calculate(['2', '+', '2', '=']);
    tick(2000);
    calculate(['AC', '3', '+', '3', '=']);

    tick(3000); // 5s after first judgement, 3s after second: still night
    expect(app().classList.contains('night')).toBe(true);
    tick(1300); // past the second judgement's 4.2s
    expect(app().classList.contains('night')).toBe(false);
  });

  it('honest work is left in peace', () => {
    render(<App />);
    calculate(['4', '7', '×', '6', '2', '=']);
    expect(result()).toBe('2914');
    expect(app().classList.contains('night')).toBe(false);
    expect(bubble()).toBeNull();
  });

  it('hefty math earns praise without the darkness', () => {
    render(<App />);
    calculate(['2', '0', '0', '0', '×', '3', '0', '0', '0', '=']);
    expect(result()).toBe('6000000');
    expect(app().classList.contains('night')).toBe(false);
    expect(document.querySelector('.sun.mood-praise')).not.toBeNull();
    expect(bubble()).not.toBeNull();

    tick(3100);
    expect(document.querySelector('.sun.mood-idle')).not.toBeNull();
    expect(bubble()).toBeNull();
  });

  it('divide by zero shows Error and stays civil', () => {
    render(<App />);
    calculate(['5', '÷', '0', '=']);
    expect(result()).toBe('Error');
    expect(app().classList.contains('night')).toBe(false);
  });
});

describe('scene life', () => {
  it('renders clouds, critters, grass, and stars', () => {
    render(<App />);
    expect(document.querySelectorAll('.cloud').length).toBe(3);
    expect(document.querySelectorAll('.critter').length).toBe(3);
    expect(document.querySelector('.grass')).not.toBeNull();
    expect(document.querySelectorAll('.stars span').length).toBeGreaterThan(10);
  });

  it('the sun blinks now and then', () => {
    render(<App />);
    const svgBefore = document.querySelector('.sun svg')!.innerHTML;
    tick(3700); // into the blink window
    const svgDuring = document.querySelector('.sun svg')!.innerHTML;
    expect(svgDuring).not.toBe(svgBefore);
    tick(300); // blink over
    expect(document.querySelector('.sun svg')!.innerHTML).toBe(svgBefore);
  });
});
