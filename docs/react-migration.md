# React Migration Plan

Migrate **ledgrid-controller** from vanilla TypeScript + `emoji-picker-element` to React + DaisyUI + `emoji-picker-react`.

---

## Goals

- Replace the imperative DOM manipulation in `main.ts` with React component state
- Use `emoji-picker-react` instead of the `emoji-picker-element` web component
- Use DaisyUI (Tailwind CSS-based) for all UI styling, replacing the embedded CSS in `index.html`
- Keep all existing non-UI logic unchanged: `LedGrid`, `EmojiDatabase`, `SerialConnection`, `BluetoothConnection`, `Queue`
- Redesign UX to prioritise the most common user journey: picking an emoji to display on others' LED grids, while moving device connection options out of the main flow

---

## New Dependencies

```bash
npm install react react-dom emoji-picker-react
npm install -D @types/react @types/react-dom tailwindcss @tailwindcss/vite daisyui
```

---

## Vite Configuration Changes

Update `vite.config.ts` to add the React plugin and Tailwind:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  root: 'src',
  build: { outDir: '../dist', emptyOutDir: true },
  plugins: [react(), tailwindcss()],
});
```

Add `@vitejs/plugin-react`:

```bash
npm install -D @vitejs/plugin-react
```

---

## TypeScript Configuration

Update `tsconfig.json` to add React JSX support:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    ...
  }
}
```

---

## CSS Setup

Replace the embedded styles in `index.html` with a `src/index.css` file:

```css
@import 'tailwindcss';
@plugin "daisyui";
```

The Google Fonts import (Roboto, Roboto Mono) can be added here or kept in `index.html`.

---

## UX Design

### Two user types

| User type  | Goal                                                  | Frequency             |
| ---------- | ----------------------------------------------------- | --------------------- |
| **Viewer** | Pick an emoji to show on nearby/shared LED grids      | Primary (most common) |
| **Owner**  | Connect their own LED grid to receive selected emojis | Secondary             |

### Layout

The primary view shows only what viewers need:

```
┌─────────────────────────────────┐
│           ledgrid               │  ← app title / header
│                                 │
│     [ emoji canvas preview ]    │  ← current emoji, large
│                                 │
│     [ emoji picker ]            │  ← full-width picker
│                                 │
│  ⚙ Connect your LED grid  ▾    │  ← collapsed by default
└─────────────────────────────────┘
```

Clicking the "Connect your LED grid" disclosure expands the device panel:

```
│  ⚙ Connect your LED grid  ▴    │
│  ┌───────────────────────────┐  │
│  │ Connection  [ Serial ▾ ]  │  │
│  │ Screen      [ 32×32  ▾ ]  │  │
│  │ Brightness  [ Full   ▾ ]  │  │
│  │ [ Connect ]               │  │  ← becomes [ Disconnect ] when connected
│  └───────────────────────────┘  │
```

A small status indicator (dot or badge) in the disclosure toggle shows connected/disconnected at a glance without requiring the panel to be open.

---

## Component Architecture

```
App
├── Header
├── EmojiCanvas                    (canvas preview, uses ref)
├── EmojiPickerPanel               (wraps emoji-picker-react)
└── DeviceDrawer                   (collapsed by default)
    ├── ConnectionTypeSelect        (Serial / Bluetooth)
    ├── ScreenSizeSelect            (16 / 22 / 32)
    ├── BrightnessSelect            (255 / 128 / 64 / 32 / 16)
    └── ConnectButton / DisconnectButton
```

All state lives in `App` and is passed down via props.

---

## State in `App`

| State variable   | Type                      | Persisted?   |
| ---------------- | ------------------------- | ------------ |
| `connectionType` | `'serial' \| 'bluetooth'` | localStorage |
| `screenSize`     | `16 \| 22 \| 32`          | localStorage |
| `brightness`     | `number`                  | localStorage |
| `connected`      | `boolean`                 | —            |
| `drawerOpen`     | `boolean`                 | —            |
| `ledGrid`        | `LedGrid \| null`         | —            |
| `currentEmoji`   | `string`                  | —            |

Custom hook `useLocalStorage<T>(key, defaultValue)` handles all persistence.

---

## Component Details

### `App`

- Instantiates `EmojiDatabase` once (via `useRef` or module-level singleton).
- Manages `connected` / `ledGrid` state.
- On mount, calls `emojiDatabase.getEmoji()` and `emojiDatabase.onEmojiUpdate()` to seed and sync emoji.
- `handleConnect`: creates `SerialConnection` or `BluetoothConnection`, creates `LedGrid`, sets `connected = true`.
- `handleDisconnect`: calls `ledGrid.disconnect()`, sets `ledGrid = null`, `connected = false`.
- `handleEmojiSelect(emoji)`: calls `emojiDatabase.setEmoji(emoji)`, draws to canvas via `drawEmoji()`.

### `EmojiCanvas`

- Holds a `useRef<HTMLCanvasElement>`.
- Exposes an imperative handle (`useImperativeHandle`) with a `drawEmoji(emoji, size)` method so `App` can trigger renders without re-mounting the canvas.
- Canvas size stays at `32×32` CSS pixels (styled to appear larger), matching current behavior.

### `EmojiPickerPanel`

- Renders `<EmojiPicker>` from `emoji-picker-react`.
- Calls `onEmojiSelect` prop with the unified emoji string on pick.
- Set `theme` and `skinTonePickerLocation` as needed.

### `DeviceDrawer`

- DaisyUI `collapse` or a simple controlled `<details>` element.
- Toggle button shows a coloured status dot: green when `connected`, grey otherwise — visible even when the drawer is closed so owners can see connection state at a glance.
- When `connected === true`, disable the connection type / screen size selects and hide the connect button; show the disconnect button instead.
- `drawerOpen` state lives in `App` so that a successful connection can auto-expand the drawer to confirm status, then the user can close it again.

---

## Files to Keep Unchanged

- `src/ledgrid.ts`
- `src/database.ts`
- `src/queue.ts`
- `src/connections/connection.ts`
- `src/connections/serial_connection.ts`
- `src/connections/bluetooth_connection.ts`

---

## Files to Remove / Replace

| Old file                         | Replacement                          |
| -------------------------------- | ------------------------------------ |
| `src/main.ts`                    | `src/main.tsx` + `src/App.tsx`       |
| `src/index.html` (embedded CSS)  | `src/index.css` (Tailwind + DaisyUI) |
| `emoji-picker-element` (npm dep) | `emoji-picker-react`                 |

---

## Pull Request Plan

Each PR leaves the app in a buildable, deployable state.

---

### PR 1 — Tooling: add React + Tailwind + DaisyUI

**Goal:** Wire in all new build tooling without touching any runtime behaviour. The existing vanilla app continues to work identically after this PR.

Changes:

- Upgrade `vite` to v8 (required by `@vitejs/plugin-react` v6)
- `npm install` React, `emoji-picker-react`, `@vitejs/plugin-react`
- `npm install -D` Tailwind, `@tailwindcss/vite`, DaisyUI, `@types/react`, `@types/react-dom`
- Update `vite.config.ts` — add `react()` and `tailwindcss()` plugins
- Update `tsconfig.json` — add `"jsx": "react-jsx"`
- Create `src/index.css` — `@import "tailwindcss"` + `@plugin "daisyui"` (not yet imported by anything)

Note: `emoji-picker-element` is kept for now because `main.ts` still imports it. It will be removed in PR 2 when `main.ts` is deleted.

**Why it's safe:** `main.ts` and `index.html` are untouched; `index.css` is not yet imported. The Vite React plugin is additive — it does not break existing `.ts` entry points.

---

### PR 2 — Viewer experience: React shell + emoji picker + Firebase sync

**Goal:** Replace the vanilla entry point with a React app that delivers the complete viewer experience. Device connection is not yet present; the app is still fully useful for picking and syncing emojis.

Changes:

- Delete `src/main.ts`
- Create `src/main.tsx` — renders `<App />` into `#app`
- Create `src/App.tsx` — manages `currentEmoji`, `screenSize`, `brightness` state; wires Firebase on mount; calls `drawEmoji` on the canvas ref
- Create `src/components/EmojiCanvas.tsx` — canvas with `useImperativeHandle` exposing `drawEmoji(emoji, size)`
- Create `src/components/EmojiPickerPanel.tsx` — wraps `<EmojiPicker>` from `emoji-picker-react`, calls `onEmojiSelect`
- Update `src/index.html` — point script tag at `main.tsx`, import `index.css`, remove embedded `<style>` block, remove `<emoji-picker>` and all old DOM elements, keep only `<div id="app">`

**State of the app after this PR:** A viewer can open the page, see the current emoji on the canvas, pick a new one, and have it sync to Firebase (and thus to other clients' canvases). Device connection is absent but the app is coherent.

---

### PR 3 — Owner experience: DeviceDrawer

**Goal:** Restore full device-connection functionality behind the new collapsible drawer, completing the migration.

Changes:

- Create `src/components/DeviceDrawer.tsx` — DaisyUI collapsible panel containing: connection type select (Serial / Bluetooth), screen size select, brightness select, connect / disconnect button, and a status dot indicator
- Update `src/App.tsx` — add `connectionType`, `connected`, `drawerOpen`, `ledGrid` state; add `handleConnect` / `handleDisconnect` handlers; render `<DeviceDrawer>`; persist `connectionType`, `screenSize`, `brightness` to localStorage via `useLocalStorage`
- Create `src/hooks/useLocalStorage.ts` — generic `useLocalStorage<T>(key, defaultValue)` hook

**State of the app after this PR:** Full feature parity with the original app, plus the new UX where device controls are hidden by default.

---

## Notes

- **Canvas must use a ref** — do not let React control the canvas DOM node; write to it imperatively via `drawEmoji`.
- **Web Serial / Bluetooth are browser APIs** — no mocking needed; they won't work in Node test environments.
- **Firebase config is intentionally public** — this is a single shared LED grid demo; no auth changes needed.
- **`emoji-picker-react`** renders an iframe internally in some versions — confirm the `onEmojiClick` callback signature matches what `App` expects.
