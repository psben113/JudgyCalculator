# Judgy Calculator — Chrome Extension

A calculator that lives in your toolbar. Blue sky, drifting clouds, critters
crossing the grass, and a sun that watches what you type. Use it for math a computer deserves
and all is peaceful. Use it for `5 × 5` and the sun laughs at you, mocks you in a speech
bubble, and the whole world briefly falls into night.

Built with React 19 + TypeScript + Vite (Manifest V3, no permissions, no `eval`).

## The judgement rules

- **Mocked** (laughing sun + temporary night mode): both operands are small integers (|n| ≤ 10),
  or identity operations (`× 1`, `× 0`, `+ 0`, `÷ 1`, `n − n`), which get extra-savage messages.
  Small division is only mocked when it divides evenly — `7 ÷ 3` is honest work.
- **Praised** (impressed sun): both operands ≥ 1000, or both have decimals.
- Everything else: the sun minds its own business.

## Develop

```sh
npm install
npm run dev        # Vite dev server for quick UI iteration
npm run build      # type-check + production build into dist/
node scripts/screenshot.mjs   # headless-Chrome screenshots of day/judged/praise states
```

## Test

```sh
npm test           # unit + property + component suites (fast, no browser)
npm run test:e2e   # builds, then loads dist/ into real headless Chrome
npm run test:watch # unit suites in watch mode
```

- `tests/unit/calculator.test.ts` — reducer behavior via a key-press DSL (`5+3=` → `8`):
  chaining, error states, the 12-digit cap, display formatting.
- `tests/unit/calculator.property.test.ts` — fast-check properties: hundreds of random
  action sequences never throw, never mutate state, and always leave a valid display;
  arithmetic round-trips are exact.
- `tests/unit/judge.test.ts` — the verdict matrix: what gets mocked, praised, or spared.
- `tests/unit/app.test.tsx` — the judgement flow under fake timers: night mode arrives
  and expires, repeat offenses restart the clock, praise skips the darkness.
- `tests/unit/sprites.test.ts` — pixel-map integrity (row widths, palette usage, moods).
- `tests/e2e/extension.test.ts` — loads the built extension into headless Chrome and
  drives the real `chrome-extension://` popup, asserting a CSP-clean console. The
  extension ID is derived from the dist path the same way Chrome derives it.

## Install in Chrome

1. `npm run build`
2. Open `chrome://extensions`, enable **Developer mode**.
3. **Load unpacked** → select the `dist/` folder (not the project root).
4. Pin **Judgy Calculator** and click the sun icon.

After code changes: rebuild, then hit reload (↻) on the extension card.

## Project structure

```
public/manifest.json     MV3 manifest (copied into dist/)
public/icons/            Toolbar icons, generated from the sun sprite
popup.html               Vite entry point
src/calculator.ts        Typed calculator state machine (reducer)
src/judge.ts             Triviality detection + mock/praise message pools
src/sprites.json         Pixel maps for sun faces, clouds, bunny, bird, butterfly
src/components/          PixelSprite (SVG renderer), SunFace, Scene, Calculator
src/styles.css           Day/night theming via CSS variables + animations
scripts/screenshot.mjs   Headless verification of the judgement flow
```

Keyboard works too: digits, `+ - * /`, `Enter`/`=`, `.`, `Backspace`, `Esc` to clear, `%`.
The sun still judges you either way.

Copyright © 2026 Pranav Swaroop. All rights reserved.
