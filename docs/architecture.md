# Kipu Study Architecture

Kipu Study is a client-side modular monolith. It uses a functional core with a
thin React and browser shell: rules and application transitions are pure, while
DOM events and browser APIs stay at the edge.

## Dependency Direction

```text
app -> ui -> application -> domain
```

Layers may depend on themselves and any layer to their right:

| Layer | Responsibility | Allowed dependencies |
| --- | --- | --- |
| `domain` | Go board model, rules, setup placement, path generation | `domain` |
| `application` | Study-session state, commands, history, invariants | `application`, `domain` |
| `ui` | React rendering, controls, pointer gestures, keyboard input | `ui`, `application`, `domain` |
| `app` | Composition, browser confirmation, transient timing | All inward layers |

`src/test/architecture.test.ts` enforces these dependencies, rejects source
cycles, and rejects product modules placed outside the defined layers.

## State Ownership

- `StudySession` owns product state: mode, tool, colors, board size, selection,
  notice, and snapshot history.
- `studySessionReducer` is the only place that applies product commands and
  session invariants.
- UI-local state owns temporary interaction details such as hover, setup-drag
  preview, panning, popover visibility, and zoom.
- Browser effects such as keyboard listeners, pointer capture, confirmation,
  scrolling, and notice timers stay in UI hooks or the composition root.

## Testing Boundaries

- Domain and application transitions run in the Node Vitest project.
- React workflows and deterministic SVG output run in jsdom component suites.
- Layout, computed styles, and real pointer behavior run in Playwright.
- V8 coverage includes every TypeScript module in the four product layers and
  enforces 90% statements, branches, functions, and lines per file.

This structure is intentionally lighter than Redux, XState, or full Clean
Architecture. Add an external state library only when concrete complexity
outgrows the reducer and focused interaction hooks.
