# AGENTS.md

These instructions apply to the entire repository.

## Product

Kipu Study is a minimalist web application for composing Go positions and
studying numbered variations. Its visual target is a printed black-and-white
Kipu: quiet, precise, diagram-first, and useful for repeated teaching work.

Read the implementation before changing behavior. When documentation and code
disagree, treat the code as current behavior and update the documentation with
the change.

## Stack And Commands

- React 19 and TypeScript
- Vite for development and production builds
- Vitest and Testing Library for rules and component behavior
- Playwright for real-browser interaction and responsive layout
- SVG for the board and all board content

```sh
npm install
npx playwright install chromium
npm run dev
npm test
npm run build
```

`npm run build` includes strict TypeScript checks. Run both tests and the build
before handing off a code change.

## Code Map

- `src/App.tsx` owns application state, history, controls, keyboard shortcuts,
  board panning, and SVG rendering.
- `src/test/app/` contains single-concern component workflow suites;
  `src/test/app/support/` separates rendering, controls, and board interactions.
- `src/App.css` owns the responsive monochrome interface.
- `src/go.ts` is the UI-independent board model and Go rule engine.
- `src/go.test.ts` covers board utilities, legality, captures, and setup paths.
- `e2e/*.spec.ts` separates browser-only drag, panning, and responsive layout
  contracts; `e2e/support/` contains shared browser helpers.
- `docs/testing.md` maps product requirements to automated coverage.
- `docs/images/` contains the README product and reference images.

Keep Go rules independent from React. Prefer adding or changing pure functions
in `src/go.ts` and covering them in `src/go.test.ts`.

## Test Requirements

Every implemented feature requirement in this file must be traceable to
automated tests. A feature change is incomplete unless:

- Each added or changed behavior has a direct test that would fail if the
  requirement regressed; aggregate coverage alone is not sufficient.
- Tests cover the successful workflow plus relevant rejection paths, boundary
  conditions, state transitions, and undo/redo behavior.
- Deterministic visual requirements such as SVG geometry, responsive layout,
  overflow, and computed interaction states are asserted in component or
  browser tests. Qualitative visual inspection supplements these assertions but
  does not replace them.
- `docs/testing.md` is updated whenever a requirement or its owning test suite
  changes, preserving the requirement-to-test map.
- `npm test` and `npm run build` pass before handoff.

Maintain strict separation of concerns across test layers:

- Pure Go rules, board transformations, and path generation belong in
  `src/go.test.ts` and run in the Node-based `unit` Vitest project.
- React state, history, controls, keyboard behavior, and deterministic SVG
  output belong in a single-concern suite under `src/test/app/` and run in the
  jsdom-based `component` Vitest project.
- Real layout, computed styles, responsive overflow, and browser pointer
  semantics belong in focused Playwright specs under `e2e/`.
- Shared support modules may contain rendering, querying, interaction drivers,
  fixtures, and cross-cutting reliability gates. Feature-specific setup and
  assertions must remain in the owning spec.
- Do not add unrelated scenarios to an existing suite for convenience. Create
  or choose the suite whose single responsibility matches the requirement.
- Keep `npm run test:unit`, `npm run test:component`,
  `npm run test:coverage`, and `npm run test:e2e` independently runnable.

## Current Behavior Contracts

### Setup Mode

- Black and white stones may be placed in any order.
- Setup placement does not apply capture or self-capture rules.
- Left-dragging with the Stone tool previews a consecutive orthogonal path
  with right-angle turns and applies it as one undoable action on release.
- Starting a drag on or crossing an occupied intersection cancels the entire
  drag.
- With the Stone tool active, clicking an occupied intersection selects that
  stone.
- Delete or Backspace removes the selected stone and its mark through the
  normal undoable history.
- A stationary right-click has no action.

### Simulation Mode

- The user chooses the first player before the first move.
- Colors alternate after every legal move.
- Captures are implemented for complete connected groups.
- Self-capture is forbidden.
- Move numbers remain attached to stones while they are on the board.
- Ko, pass moves, scoring, SGF, and saved variations are not implemented.

### Board And Labels

- Board sizes are 9x9, 13x13, and 19x19.
- Stones are tangent: a stone's outer diameter equals one grid spacing.
- White stone outlines use the same stroke weight as interior grid lines.
- Triangle and circle marks must maintain visible contrast on black stones,
  white stones, and empty intersections.
- The board stays SVG-based and must remain sharp at every zoom level.

### Navigation And History

- Right-drag pans only when the board is larger than its viewport.
- The cursor changes to `grabbing` while right-button panning is active.
- Undo is `U`.
- Redo is `R`.
- `M` toggles Setup and Simulation.
- `S` toggles stone color, or the first player before simulation begins.
- `T` cycles Stone, Triangle, and Circle tools.
- `B` cycles 9x9, 13x13, and 19x19 boards.
- Clearing the board, including with `C`, switches to Setup mode.
- Delete or Backspace removes a selected setup stone.
- Escape clears the current stone selection.
- Keep shortcuts documented in the README, but do not add visible shortcut
  cues to the application controls.
- The fixed question mark button in the bottom-left is the only in-app shortcut
  reference and opens a compact, dismissible shortcut popover.

All board-changing actions should participate in the existing snapshot history
unless a product requirement explicitly says otherwise.

## UI Conventions

- Preserve the restrained black, white, and neutral-gray palette.
- Keep the board as the dominant work surface; do not turn the app into a
  marketing page.
- Keep controls compact, readable, and consistent across desktop and mobile.
- Use the existing segmented controls for mode, color, tool, and board size.
- Use Lucide icons for familiar commands.
- Avoid decorative gradients, illustration, excessive rounding, nested cards,
  and instructional copy inside the application.
- Preserve the complete two-column mobile control grid without horizontal page
  overflow.

## Verification

Scale verification with the change, but use these as the default gates:

1. Run `npm test`, which includes coverage-enforced Vitest tests and Playwright.
2. Run `npm run build`.
3. Inspect the live app with Playwright after interaction or visual changes.
4. Check both a desktop viewport and a phone-width viewport.
5. Exercise the affected workflow, not only the initial render.
6. Check the browser console for fresh errors or warnings.

For board geometry changes, verify SVG attributes or computed dimensions in
addition to visual inspection. For responsive changes, confirm there is no
page-level horizontal overflow.

## Documentation And Hygiene

- Update `README.md` when behavior, shortcuts, setup, or limitations change.
- Refresh README screenshots when a visual change makes them materially stale.
- Keep documentation images under `docs/images/` and ensure their file
  extension matches their real format.
- Use `/private/tmp` for disposable screenshots and conversion intermediates.
- Do not leave generated scratch files in the repository.
- Do not add `Co-Authored-By` trailers to commits.
