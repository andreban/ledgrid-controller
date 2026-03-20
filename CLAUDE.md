# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start        # Dev server (Vite, hot reload)
npm run build    # Production build → dist/

# Firebase deployment
firebase hosting:channel:deploy <channel>   # Deploy to staging channel
firebase deploy --only hosting              # Deploy to production
```

No test suite exists in this project.

## Architecture

**ledgrid-controller** is a TypeScript web app that lets users pick an emoji and display it on a physical LED grid over Web Serial or Web Bluetooth.

### Data flow

1. User selects emoji via `emoji-picker-element`
2. Emoji is drawn to an HTML `<canvas>` with gamma correction (γ=2.8)
3. RGBA pixel data is sent to the LED grid via the active `DeviceConnection`
4. Simultaneously, the emoji is written to Firebase Realtime Database so other clients can sync

### Connection abstraction (`src/connections/`)

`DeviceConnection` interface (`connection.ts`) is implemented by two strategies:
- **SerialConnection** — Web Serial API, 115200 baud
- **BluetoothConnection** — BLE UART service (`6e400001-…`), 100-byte MTU chunking, device name filter `"mpy-uart"`

`BluetoothConnection` uses `AsyncBlockingQueue<DataView>` (`src/queue.ts`) to buffer incoming BLE notifications as async-readable packets.

### Key files

| File | Role |
|---|---|
| `src/main.ts` | Entry point; UI event wiring, localStorage persistence, orchestrates connection + database |
| `src/ledgrid.ts` | `LedGrid` class — converts canvas RGBA → RGB with gamma, writes to connection |
| `src/database.ts` | `EmojiDatabase` — Firebase Realtime DB read/write/listen for shared emoji state |
| `src/queue.ts` | `Queue<T>` and `AsyncBlockingQueue<T>` generic data structures |

### Build tooling

Vite v6. No `tsconfig.json` — TypeScript is handled by Vite/esbuild defaults. Entry point is `src/index.html`. Config is in `vite.config.ts` (root set to `src/`, output to `dist/`).
