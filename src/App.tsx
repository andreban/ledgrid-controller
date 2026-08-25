import { useEffect, useRef, useState } from 'react';
import { EmojiDatabase } from './database.js';
import { LedGrid } from './ledgrid.js';
import { SerialConnection } from './connections/serial_connection.js';
import { BluetoothConnection } from './connections/bluetooth_connection.js';
import { EmojiCanvas, type EmojiCanvasHandle } from './components/EmojiCanvas.js';
import { EmojiPickerPanel } from './components/EmojiPickerPanel.js';
import { DeviceDrawer } from './components/DeviceDrawer.js';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { useEmojiWebMCP } from './hooks/useEmojiWebMCP.js';

const emojiDatabase = new EmojiDatabase();

export function App() {
  const canvasRef = useRef<EmojiCanvasHandle>(null);
  const currentEmojiRef = useRef('');
  const ledGridRef = useRef<LedGrid | null>(null);
  // Ref keeps brightness current inside the Firebase callback closure.
  const brightnessRef = useRef(255);

  const [connectionType, setConnectionType] = useLocalStorage<'serial' | 'bluetooth'>(
    'connection',
    'serial',
  );
  const [screenSize, setScreenSize] = useLocalStorage<number>('screen', 32);
  const [brightness, setBrightness] = useLocalStorage<number>('brightness', 255);
  const [connected, setConnected] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  function handleEmojiSelect(emoji: string) {
    emojiDatabase.setEmoji(emoji);
  }

  // Register WebMCP tools (search_emojis, display_emoji) with the browser modelContext
  useEmojiWebMCP({
    onSelectEmoji: handleEmojiSelect,
  });

  useEffect(() => {
    brightnessRef.current = brightness;
  }, [brightness]);

  useEffect(() => {
    emojiDatabase.onEmojiUpdate((emoji) => {
      currentEmojiRef.current = emoji;
      canvasRef.current?.drawEmoji(emoji);
      const imageData = canvasRef.current?.getImageData();
      if (ledGridRef.current && imageData) {
        void ledGridRef.current.sendImage(imageData.data, brightnessRef.current);
      }
    });
  }, []);

  function handleScreenSizeChange(size: number) {
    setScreenSize(size);
    canvasRef.current?.drawEmoji(currentEmojiRef.current, size);
  }

  async function handleConnect() {
    try {
      const connection =
        connectionType === 'serial' ? new SerialConnection() : new BluetoothConnection();
      await connection.connect();
      ledGridRef.current = new LedGrid(connection, screenSize, screenSize);
      setConnected(true);
      const imageData = canvasRef.current?.getImageData();
      if (imageData) {
        await ledGridRef.current.sendImage(imageData.data, brightness);
      }
    } catch (err) {
      console.error('Failed to connect:', err);
    }
  }

  async function handleDisconnect() {
    await ledGridRef.current?.disconnect();
    ledGridRef.current = null;
    setConnected(false);
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[lightsteelblue]">
      <div className="navbar bg-[#6a8ab7] text-white shadow-md">
        <span className="text-xl font-bold uppercase tracking-widest px-2">ledgrid</span>
      </div>
      <main className="flex flex-col gap-4 p-4 flex-1 min-h-0">
        <div className="flex flex-col md:flex-row flex-1 min-h-0 gap-4">
          <div className="self-center shrink-0 flex flex-col items-center gap-1">
            <EmojiCanvas ref={canvasRef} />
            <span className="text-xs font-semibold text-[#2c4a6e] uppercase tracking-wider">
              Preview
            </span>
          </div>
          <div className="flex-1 min-h-0 w-full overflow-hidden rounded-lg border border-[#6a8ab7]">
            <EmojiPickerPanel onEmojiSelect={handleEmojiSelect} />
          </div>
        </div>
        <DeviceDrawer
          open={drawerOpen}
          onToggle={() => setDrawerOpen((o) => !o)}
          connected={connected}
          connectionType={connectionType}
          onConnectionTypeChange={setConnectionType}
          screenSize={screenSize}
          onScreenSizeChange={handleScreenSizeChange}
          brightness={brightness}
          onBrightnessChange={setBrightness}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
        />
      </main>
    </div>
  );
}
