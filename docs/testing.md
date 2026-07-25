# Testing Kipu Study

The default quality gate is:

```sh
npm test
npm run build
```

`npm test` runs the enforced coverage and browser layers:

- `npm run test:coverage` runs all Vitest suites with V8 coverage thresholds.
- `npm run test:e2e` runs Playwright against a local Vite server.

Focused commands keep each concern independent during development:

- `npm run test:unit` runs module-owned domain and application tests in Node.
- `npm run test:architecture` runs the separate dependency-direction and source
  cycle project in Node.
- `npm run test:component` runs the Testing Library project in jsdom.
- `npm run test:watch` watches all Vitest suites.

Install Playwright's browser once after installing dependencies:

```sh
npx playwright install chromium
```

## Coverage Enforcement

Vitest measures every TypeScript product module under `src/app/`,
`src/application/`, `src/domain/`, and `src/ui/`. Every measured file must
maintain at least 90% statements, branches, functions, and lines. Tests and the
bootstrap entry point are excluded from measurement. Browser-only CSS and
layout behavior is enforced by Playwright instead of being represented as
JavaScript coverage.

Coverage reports are generated under `coverage/` and are not committed.

## Architecture Enforcement

`src/test/architecture.test.ts` parses TypeScript and TSX imports and enforces
the dependency direction `app -> ui -> application -> domain`. A layer may
depend on itself and inward layers only. The same test rejects source
dependency cycles.

## Requirement Coverage

| Area | Product contract | Automated coverage |
| --- | --- | --- |
| Setup | Place black and white freely without captures or self-capture | `domain/go/setup.test.ts`; `setup-mode.test.tsx` |
| Setup | Preview and commit consecutive orthogonal drags with turns | `domain/go/path.test.ts`; `setup-mode.test.tsx`; `setup-drag.spec.ts` |
| Setup | Cancel a drag that starts on or crosses an occupied point | `setup-mode.test.tsx` |
| Setup | Right-click clears a stone and triangle or circle label through history | `domain/go/model.test.ts`; `application/study-session/reducer.test.ts`; `setup-mode.test.tsx`; `remove-action.spec.ts` |
| Simulation | Choose the first player before move one and lock it afterward | `simulation-mode.test.tsx` |
| Simulation | Alternate colors and retain move numbers on live stones | `domain/go/rules.test.ts`; `application/study-session/reducer.test.ts`; `simulation-mode.test.tsx`, including move 100 |
| Simulation | Right-click clears only triangle or circle labels and preserves numbered stones | `application/study-session/reducer.test.ts`; `simulation-mode.test.tsx`; `remove-action.spec.ts` |
| Simulation | Capture complete single, connected, and adjacent groups | `domain/go/rules.test.ts`; `simulation-mode.test.tsx` |
| Simulation | Reject occupied moves and self-capture without advancing history | `domain/go/rules.test.ts`; `application/study-session/reducer.test.ts`; `simulation-mode.test.tsx` |
| Simulation | Clear captured stones' move numbers and labels, and update capture counts | `domain/go/rules.test.ts`; `simulation-mode.test.tsx` |
| Board | Support 9x9, 13x13, and 19x19 grids and star points | `domain/go/model.test.ts`; `board-rendering.test.tsx` |
| Board | Keep all four outer grid corners visibly joined | `board-rendering.test.tsx` |
| Board | Keep stones tangent and white outlines equal to interior grid strokes | `board-rendering.test.tsx` |
| Board | Render contrast-aware triangle and circle marks on any intersection | `domain/go/model.test.ts`; `diagram-marks.test.tsx` |
| Board | Keep the board and content SVG-based at every zoom level | `board-rendering.test.tsx`; `board-controls.test.tsx` |
| History | Undo and redo placements, drag batches, marks, deletion, captures, and clearing | Component suites under `src/test/app/` |
| History | Stop Simulation undo at its starting position without undoing Setup actions | `application/study-session/reducer.test.ts`; `history.test.tsx` |
| History | Clear redo when a new branch is created | `application/study-session/history.test.ts`; `application/study-session/reducer.test.ts`; `history.test.tsx` |
| Navigation | Pan only an oversized board with middle-button drag and show `grabbing` | `panning.test.tsx`; `panning.spec.ts` |
| Navigation | Enforce `U`, `R`, `S`, `X`, `T`, `B`, and `C`, with no Delete or Backspace removal | `keyboard-shortcuts.test.tsx` |
| Navigation | Ignore shortcuts in editable fields or with modifiers/repeat | `keyboard-shortcuts.test.tsx` |
| Navigation | Clear returns to Setup mode and remains undoable | `history.test.tsx` |
| Navigation | Destructive board-size changes confirm, then reset zoom and history | `board-controls.test.tsx` |
| Help | Keep `S`, `X`, `T`, `B`, `U`, `R`, and `C` badges visible beside their controls | `shortcut-cues.test.tsx`; `responsive.spec.ts` |
| Help | Fixed question-mark control opens and dismisses the current shortcut reference | `shortcut-help.test.tsx`; `responsive.spec.ts` |
| Responsive | Keep all four control groups in a two-column phone layout without page overflow | `responsive.spec.ts` |
| Reliability | Avoid fresh browser console errors during critical workflows | Automatic fixture in `e2e/support/fixtures.ts` |
| Architecture | Keep dependencies inward and source modules acyclic | `architecture.test.ts` |

## Adding Or Changing A Feature

1. Update the product contract in `AGENTS.md` when behavior changes.
2. Add pure domain coverage under `src/domain/` or application transition
   coverage under `src/application/` when no browser state is required.
3. Add public workflow coverage to the matching suite under `src/test/app/`.
4. Add Playwright coverage only for behavior that requires layout, computed
   styles, or real browser pointer semantics.
5. Run `npm test` and `npm run build` before handoff.
