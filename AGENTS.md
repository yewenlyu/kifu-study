# AGENTS.md

These instructions apply to the entire repository.

## Product

Kifu Study is a minimalist web application for composing Go positions and
studying numbered variations. Its visual target is a printed black-and-white
Kifu: quiet, precise, diagram-first, and useful for repeated teaching work.

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

- `src/app/App.tsx` is the composition root and owns browser-level
  confirmation, notice timing, and UI wiring.
- `src/application/study-session/` owns study state, commands, snapshot
  history, and pure application transitions.
- `src/domain/go/` owns the UI-independent board model, Go rules, setup
  placement, and path generation.
- `src/ui/board/` owns SVG rendering, board geometry, setup dragging, and
  panning.
- `src/ui/controls/` and `src/ui/shortcuts/` own controls and keyboard
  interaction.
- `src/test/app/` contains single-concern component workflow suites;
  `src/test/app/support/` separates rendering, controls, and board interactions.
- `src/styles/` separates global, board, control, and shortcut styling.
- `src/domain/go/*.test.ts` colocates board model, rules, setup, and path tests
  with their owning modules.
- `src/application/study-session/*.test.ts` separates model defaults, generic
  history behavior, and application transitions by owner.
- `src/test/architecture.test.ts` enforces inward dependency direction and
  rejects source cycles.
- `e2e/*.spec.ts` separates browser-only drag, panning, and responsive layout
  contracts; `e2e/support/` contains shared browser helpers.
- `docs/testing.md` maps product requirements to automated coverage.
- `docs/architecture.md` documents dependency and state-ownership boundaries.
- `docs/images/` contains the README product and reference images.

## Architecture Rules

These are implementation constraints, not suggestions. A change that violates
them is incomplete even when its behavioral tests pass.

### Dependency Direction

Dependencies must point inward:

- `domain` may depend only on `domain`.
- `application` may depend on `application` and `domain`.
- `ui` may depend on `ui`, `application`, and `domain`.
- `app` may depend on every inward layer and is the only composition root.
- No inward layer may import from an outward layer.
- Source dependency cycles are forbidden.
- New production modules must live in one of these four layers. Do not add a
  new top-level source layer without an explicit architecture decision,
  corresponding documentation, and an updated architecture test.

Use the owning module's public exports for cross-layer imports. Do not reach
through another layer to import its private implementation files or duplicate
an inward type merely to avoid a valid dependency.

### Responsibility Boundaries

- `domain` contains Go concepts and deterministic transformations. It must not
  import React or access the DOM, browser globals, storage, timers, or network
  APIs.
- `application` contains use-case state, commands, invariants, and snapshot
  history. Its transitions must remain pure and independently testable. It
  must not import React or access browser APIs.
- `ui` renders state and translates user or pointer input into application
  commands. Components should receive data and semantic callbacks; hooks may
  own one focused browser interaction such as panning, keyboard input, or
  pointer capture.
- `app` wires modules and owns process-edge effects such as confirmation,
  transient timing, persistence adapters, or future telemetry. Keep it a thin
  composition root; do not move feature logic back into `App.tsx`.
- Styles belong with the UI concern they affect. Keep global foundations,
  board, controls, and shortcut styles separate unless a real shared design
  primitive emerges.

### State And Effects

- Durable product state belongs in `StudySession` and changes through
  `studySessionReducer`.
- Board-changing commands and their undo/redo semantics must be implemented as
  application transitions. UI handlers must not mutate snapshots or maintain a
  parallel history.
- Ephemeral interaction state stays local to the owning UI module: hover,
  active pointer gestures, panning, popover visibility, and zoom are examples.
- Keep side effects at the edge. Pure layers return explicit results or
  rejection reasons; they must not display notices, confirm actions, swallow
  errors, or write to the console.

### Module Design

- Split by reason to change, not by arbitrary line count. A separate rule
  engine, state transition, state machine, browser effect, or reusable visual
  control is a meaningful module boundary.
- Keep one authoritative implementation of each rule. Do not repeat behavior
  across reducers, hooks, and components.
- Prefer small named domain and application functions over generic `utils`,
  `helpers`, or catch-all `shared` modules. Introduce shared abstractions only
  after multiple concrete consumers establish the common contract.
- Keep feature-specific code with its owner. Do not create a generic component
  or hook solely to make a file shorter.
- When moving behavior between modules, preserve its public contract and move
  or add direct tests at the new owning layer.

### Architecture Enforcement

- `npm run test:architecture` must pass after any source-structure or import
  change. Do not weaken its allowed dependency graph to make a convenient
  import pass.
- `npm run test:coverage` measures every production TypeScript module in the
  four layers and enforces all thresholds per file. Do not exclude a module or
  add passthrough code merely to satisfy coverage.
- Keep Go rules independent from React and cover pure changes in the
  corresponding module-owned test under `src/domain/go/`.

## Test Requirements

For every code change, invoke and follow the
`superpowers:test-driven-development` skill before editing code.

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

- Pure Go rules, board transformations, setup placement, and path generation
  belong in the corresponding module-owned test under `src/domain/go/` and run
  in the Node-based `unit` Vitest project.
- Pure study-session model, history, and reducer behavior belong in the
  corresponding module-owned test under `src/application/study-session/`.
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
- Keep `npm run test:unit`, `npm run test:architecture`,
  `npm run test:component`, `npm run test:coverage`, and `npm run test:e2e`
  independently runnable.

## Current Behavior Contracts

### Setup Mode

- Black and white stones may be placed in any order.
- Setup placement does not apply capture or self-capture rules.
- Left-dragging with the Stone tool previews a consecutive orthogonal path
  with right-angle turns and applies it as one undoable action on release.
- Starting a drag on or crossing an occupied intersection cancels the entire
  drag.
- Right-clicking an intersection clears the cell, removing its stone and
  triangle or circle mark through the normal undoable history.

### Simulation Mode

- The user chooses the first player before the first move.
- Colors alternate after every legal move.
- Captures remove complete connected groups together with their move numbers
  and triangle or circle marks.
- Self-capture is forbidden.
- Move numbers remain attached to stones while they are on the board.
- Right-clicking an intersection clears its triangle or circle mark through
  the normal undoable history. It never removes a stone or move number.
- Ko, pass moves, scoring, SGF, and saved variations are not implemented.

### Board And Labels

- Board sizes are 9x9, 13x13, and 19x19.
- Board coordinates are hidden by default. `N` toggles balanced edge labels
  using Go columns `A` through `T` without `I` and rows numbered from the
  bottom. Toggling coordinates must not resize the board, and labels stay
  close to the edge stones without overlapping them.
- Stones are tangent: a stone's outer diameter equals one grid spacing.
- White stone outlines use the same stroke weight as interior grid lines.
- Triangle and circle marks must maintain visible contrast on black stones,
  white stones, and empty intersections.
- Circle marks on empty intersections use an opaque white fill so grid lines
  do not show through them.
- The board stays SVG-based and must remain sharp at every zoom level.

### Navigation And History

- Middle-button drag pans only when the board is larger than its viewport.
- The cursor changes to `grabbing` while middle-button panning is active.
- Undo is `U`.
- Redo is `R`.
- In Simulation mode, undo stops at the position where Simulation began and
  does not undo earlier Setup actions.
- `S` toggles Setup and Simulation.
- `X` toggles stone color, or the first player before simulation begins.
- `T` cycles Stone, Triangle, and Circle tools.
- `B` cycles 9x9, 13x13, and 19x19 boards.
- `N` toggles board coordinates.
- Clearing the board, including with `C`, switches to Setup mode and resets
  the selected stone to black.
- Keep shortcuts documented in the README. Show compact, always-visible key
  badges beside the controls for `S`, `X`, `T`, and `B`; reveal the `U`, `R`,
  and `C` toolbar badges on hover or keyboard focus.
- The fixed question mark button in the bottom-left opens the complete,
  dismissible shortcut reference, including pointer gestures.

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
