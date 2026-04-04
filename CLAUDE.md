# CLAUDE.md - Project Intelligence

## Project Overview

**web-slide-presenter** is a browser-based presentation tool that loads Marp Markdown (`.md`) or HTML (`.html`) decks at runtime without pre-building. It renders slides in the browser, provides presenter tools (camera, drawing, spotlight, zoom), and supports theming, transitions, and offline use via Service Worker.

## Tech Stack

- **Vite** (v6) - Dev server and bundler
- **TypeScript** (v5.7) - Type-safe source
- **Marp Core** (`@marp-team/marp-core` v4) - Markdown-to-slide conversion at runtime
- **Shiki** (v4) - Syntax highlighting for code blocks (lazy-loaded)

## Commands

```bash
npm run dev       # Start Vite dev server
npm run build     # TypeScript check + Vite production build
npm run preview   # Preview production build locally
npx tsc --noEmit  # Type check only (no emit)
```

## Project Structure

```
src/
  main.ts                    # Entry point. Orchestrates startup: URL params, start page, engine init
  types.ts                   # Core types: Slide, Deck, DeckFormat, ThemeMode
  style.css                  # Global styles (imports theme CSS, layout, transitions, overlays)

  engine/
    slide-engine.ts          # Central state: current slide/fragment index, navigation, event emitter, keyboard/click/hash handling
    fragment.ts              # Fragment (step reveal) logic - applies visibility per fragment index

  renderer/
    slide-renderer.ts        # Renders current slide HTML into viewport, handles transitions (slide/fade/zoom/none), View Transitions API for shared images
    code-highlight.ts        # Shiki-based syntax highlighting (lazy-loaded)

  loader/
    index.ts                 # Deck loading dispatcher: detects format (.md → marp, else → html)
    marp-loader.ts           # Fetches + parses Marp Markdown into Deck via @marp-team/marp-core
    html-loader.ts           # Fetches + parses HTML decks (<section> = 1 slide)

  theme/
    theme-manager.ts         # Light/dark toggle + 6 custom theme presets, loads CSS dynamically
    base.css                 # CSS custom properties (--slide-bg, --slide-text, --slide-accent, etc.)
    light.css                # Light theme values
    dark.css                 # Dark theme values

  camera/
    camera-overlay.ts        # getUserMedia camera with shape (circle/rect), size (S/M/L), draggable

  ui/
    controls.ts              # Toolbar initialization: creates all buttons, wires keyboard shortcuts, manages toolbar visibility
    slide-grid.ts            # Grid overview of all slides with click-to-navigate; hosts action buttons (Presenter, Print, Share)
    help.ts                  # Help overlay showing keyboard shortcuts table
    timer.ts                 # Elapsed timer / clock display with 5 position options
    presenter.ts             # Presenter view in separate window, synced via BroadcastChannel
    blackout.ts              # Blackout (B) / Whiteout (W) full-screen overlay
    spotlight.ts             # Spotlight overlay with adjustable radius
    drawing.ts               # Freehand/straight-line pen tool, per-slide storage, undo, 5 colors, 3 widths
    magnifier.ts             # Region-select zoom with backdrop
    print.ts                 # PDF/Print export
    start-page.ts            # Landing page: file drop, URL input, sample decks
```

## Architecture

```
main.ts
  ├─ loader/        → loadDeck() / loadDeckFromText() → returns Deck
  ├─ SlideEngine    → holds Deck, manages currentIndex/fragment, emits 'slidechange'/'fragmentchange'
  ├─ SlideRenderer  → listens to engine events, renders HTML into viewport, applies transitions & code highlighting
  ├─ ThemeManager   → light/dark toggle + preset CSS injection
  ├─ CameraOverlay  → getUserMedia overlay (independent of engine)
  └─ initControls() → wires toolbar UI, keyboard shortcuts, and all overlay tools
```

**Data flow:** `main.ts` loads a Deck, creates `SlideEngine(deck)`, passes engine to `SlideRenderer` and `initControls`. Engine emits events; renderer and controls listen. Controls create overlay instances (drawing, spotlight, blackout, magnifier, etc.) and bind keyboard shortcuts.

## Key Conventions

### CSS Variables for Theming
All colors use CSS custom properties defined in `src/theme/base.css`:
- `--slide-bg`, `--slide-text`, `--slide-accent`, etc.
- Theme files (`light.css`, `dark.css`) set values under `[data-theme="light"]` / `[data-theme="dark"]`
- Custom theme presets override variables via dynamically loaded CSS from `themes/*.css`

### Keyboard Shortcuts Pattern
Shortcuts are handled in two places:
1. **`SlideEngine.initKeyboard()`** - Navigation keys (arrows, space, Home, End, F for fullscreen)
2. **`initControls()` keydown listener** - All tool shortcuts (T, C, P, B, W, S, D, Z, G, M, ?, Esc)

Both check `engine.navigationLocked` to suppress navigation during drawing/zoom.

### Adding Features
New overlay/tool pattern:
1. Create a class in `src/ui/` with `toggle()`, `active` getter, and DOM management
2. Import and instantiate in `initControls()`
3. Add keyboard shortcut in the keydown handler
4. If the tool needs navigation lock, call `syncNavLock()` after toggling
5. Add button to toolbar via `btn()` helper if needed

## Important Patterns

### NavigationLocked
`engine.navigationLocked` is a boolean that suppresses arrow/click navigation. Set it when modal tools (drawing, magnifier) are active:
```ts
function syncNavLock() {
  engine.navigationLocked = drawing.active || magnifier.active;
}
```

### syncOptVisibility
Conditionally shows/hides toolbar buttons that are only relevant when their parent feature is active (e.g., camera shape/size buttons only visible when camera is on; timer position button only visible when timer is not off).

### grid.addAction
The slide grid overlay exposes `addAction(label, callback)` for adding action buttons (Presenter, Print/PDF, Share) that appear in the grid view.

### Event System
`SlideEngine` uses a simple event emitter (`on`/`off`/`emit`) with two events:
- `'slidechange'` - fired on slide navigation, triggers hash sync
- `'fragmentchange'` - fired on fragment step change

### Transition System
`SlideRenderer` supports 4 transition types stored in localStorage:
- `slide` (default), `fade`, `zoom`, `none`
- View Transitions API is used automatically when consecutive slides share images (same `src`)
