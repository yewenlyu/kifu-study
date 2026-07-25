# Kipu Study

A minimalist, vector-first Go board for composing positions and studying
variations.

[Open Kipu Study](https://kipu-study.vercel.app/)

Kipu Study turns a printed game record or teaching shape into an interactive
board. Set up any position freely, then switch to simulation mode to play
numbered moves with captures and alternating turns.

![Kipu Study showing a zoomed 19 by 19 numbered Go position](docs/images/kipu-desktop.png)

## Why Kipu Study

Traditional Kipu diagrams are compact and expressive, but they are static.
Kipu Study keeps that quiet black-and-white visual language while making the
position editable, replayable, and easier to use while learning or teaching.

<p align="center">
  <img
    src="docs/images/reference-kipu.png"
    alt="The printed Kipu reference used to compose the interactive example"
    width="620"
  />
</p>

<p align="center"><em>Reference Kipu supplied for this project.</em></p>

## Features

- **Setup mode** places black or white stones in any order without applying Go
  rules. Left-drag with the Stone tool to preview and place an orthogonal path
  that can make right-angle turns. Starting on or crossing an occupied
  intersection cancels the drag. Right-click an intersection to clear its
  stone and triangle or circle label.
- **Simulation mode** alternates turns from a chosen starting color, captures
  groups with no liberties, and rejects self-capture. Right-click removes only
  a triangle or circle label; the numbered stone remains. Captured stones
  remove their move numbers and labels with them.
- **Automatic move numbers** preserve the played sequence directly on the
  stones.
- **Diagram marks** add triangles or circles with contrast-aware colors on
  black stones, white stones, or empty intersections.
- **Three board sizes** support 9x9, 13x13, and 19x19 study.
- **SVG rendering** keeps the board, stones, grid, and labels sharp at every
  zoom level.
- **Middle-button panning** moves a zoomed board when it is larger than the
  viewport.
- **Undo and redo** cover placement, marks, moves, captures, and board clearing.
  In Simulation mode, undo stops at the starting position without undoing
  Setup work. Clearing the board returns the application to Setup mode.
- **Responsive controls** keep the complete workflow available on desktop and
  mobile.
- **Shortcut cues** keep keyboard commands visible beside their controls, with
  the complete reference available from the question mark button.

## Using The Board

### Compose A Position

1. Choose a 9x9, 13x13, or 19x19 board.
2. Stay in **Setup** mode.
3. Select Black or White, then click or left-drag to place stones. Dragging
   previews an orthogonal path with right-angle turns and commits it on
   release; touching an occupied intersection cancels the drag.
4. Select the triangle or circle tool to annotate intersections.
5. Right-click an intersection to clear its stone and triangle or circle
   label.

### Play A Variation

1. Build the starting shape in Setup mode.
2. Switch to **Simulation** mode.
3. Choose whether Black or White moves first.
4. Place moves normally. Kipu Study numbers each move, alternates colors, and
   removes captured groups.
5. Right-click an intersection to clear its triangle or circle label without
   removing its numbered stone.
6. Use undo and redo to compare branches or revisit a teaching point.

## Shortcuts

Compact key badges appear beside keyboard-driven controls. Open the question
mark button in the bottom-left corner for the complete reference, including
pointer gestures.

| Action | macOS | Windows / Linux |
| --- | --- | --- |
| Toggle Setup / Simulation | `S` | `S` |
| Toggle stone color / first move | `X` | `X` |
| Cycle Stone / Triangle / Circle tool | `T` | `T` |
| Cycle 9x9 / 13x13 / 19x19 board | `B` | `B` |
| Clear the board and return to Setup | `C` | `C` |
| Clear setup point / simulation label | Right-click | Right-click |
| Undo | `U` | `U` |
| Redo | `R` | `R` |
| Pan an oversized board | Middle-drag | Middle-drag |

## Quick Start

Kipu Study currently requires Node.js 22.13 or newer.

```sh
npm install
npx playwright install chromium
npm run dev
```

Vite prints the local URL when the development server is ready.

Run the rules suite and create a production build with:

```sh
npm test
npm run build
```

`npm test` runs the coverage-enforced unit/component suite and the Playwright
browser suite. Use `npm run test:unit`, `npm run test:component`,
`npm run test:coverage`, `npm run test:watch`, or `npm run test:e2e` when
working on one layer. See
[the testing guide](docs/testing.md) for the requirement coverage map.

## Deployment

The production application is available at
[kipu-study.vercel.app](https://kipu-study.vercel.app/).

The site is public: anyone with the URL can use it without a Vercel account or
an invitation. Sharing the application URL does not grant access to the Vercel
project or its settings.

Vercel uses the Vite preset, runs `npm run build`, and serves the generated
`dist/` directory. The application currently requires no deployment
environment variables.

## Current Rules Scope

Implemented:

- Alternating black and white turns
- Group liberty calculation
- Single-stone and multi-stone captures
- Self-capture prevention
- Capture counts

Not implemented yet:

- Ko and superko
- Pass moves and game completion
- Territory scoring
- SGF import or export
- Saved games and named variations

## Architecture

Kipu Study is a client-side React and TypeScript application built with Vite.

```text
src/
  app/          Composition root and browser effects
  application/  Study-session reducer, commands, and history
  domain/go/    Pure board model, rules, setup, and paths
  ui/           Board, controls, shortcuts, and interaction hooks
  styles/       Global and feature-owned responsive styles
  test/         Architecture and component workflow tests
e2e/
  *.spec.ts     Playwright drag, panning, and responsive layout tests
  support/      Shared browser fixtures and board helpers
docs/
  architecture.md  Dependency and state-ownership boundaries
  testing.md       Quality gates and requirement coverage
docs/images/    README screenshots and visual reference
```

Dependencies point inward from `app` to `ui`, `application`, and `domain`. The
architecture test enforces this direction and rejects cycles. See
[`docs/architecture.md`](docs/architecture.md) for the full boundary rules.

## Roadmap

- Import and export SGF records
- Add ko, pass moves, and scoring
- Save named positions and variation branches
- Package the web application as an Electron desktop app
