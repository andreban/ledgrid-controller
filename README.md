# ledgrid-controller

A TypeScript web app that lets users pick an emoji and display it on a physical LED grid over Web Serial or Web Bluetooth. Emoji selections are synced across clients via Firebase Realtime Database.

## How it works

1. Select an emoji using the emoji picker
2. The emoji is rendered onto an HTML `<canvas>` (with γ=2.8 gamma correction for accurate LED colours)
3. The RGB pixel data is sent to the connected LED grid
4. The selection is written to Firebase so all open clients stay in sync

## Connections

Two connection methods are supported:

- **Web Serial** — connects at 115200 baud
- **Web Bluetooth** — BLE UART service, filters for devices named `mpy-uart`, sends data in 100-byte chunks

## Development

```bash
npm install       # Install dependencies
npm start         # Dev server with hot reload (Vite)
npm run build     # Production build → dist/
```

Requires a browser with [Web Serial API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API) or [Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API) support (e.g. Chrome/Edge).

## Deploy to staging

```
firebase hosting:channel:deploy <channel>
```

## Deploy to production

```
firebase deploy --only hosting
```
