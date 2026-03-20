import 'emoji-picker-element';
import { Picker } from 'emoji-picker-element';
import { EmojiDatabase } from './database.js';
import { LedGrid } from './ledgrid.js';
import { BluetoothConnection } from './connections/bluetooth_connection.js';
import { SerialConnection } from './connections/serial_connection.js';

const SIZE = 32;

const emojiDatabase = new EmojiDatabase();
const brightness = document.querySelector('#brightness') as HTMLSelectElement;
const screen = document.querySelector('#screen') as HTMLSelectElement;
const connectionType = document.querySelector('#connection') as HTMLSelectElement;
const connect = document.querySelector('#connect') as HTMLButtonElement;
const disconnect = document.querySelector('#disconnect') as HTMLButtonElement;
const emojiPicker = document.querySelector('emoji-picker') as Picker;
const canvas = document.querySelector('canvas')! as HTMLCanvasElement;

canvas.width = SIZE;
canvas.height = SIZE;
const ctx = canvas.getContext('2d')!;

let ledgrid;
let lastEmoji = '👀';

drawEmoji(ctx, lastEmoji, 'Arial', canvas.width, canvas.height);

function getBrightness() {
  return parseInt(brightness?.value, 10) || 255;
}

screen.addEventListener('change', async () => {
  const size = parseInt(screen.value);
  localStorage['screen'] = screen.value;
  canvas.width = size;
  canvas.height = size;
  drawEmoji(ctx, lastEmoji, 'Arial', canvas.width, canvas.height);
});

connectionType.addEventListener('change', async () => {
  localStorage['connection'] = connectionType.value;
});

disconnect.addEventListener('click', async () => {
  if (ledgrid) {
    await ledgrid.connection.disconnect();
  }
  disconnect.disabled = true;
  connect.disabled = false;
  screen.disabled = false;
  connectionType.disabled = false;
  ledgrid = null;
});

connect.addEventListener('click', async () => {
  const size = parseInt(screen.value);
  let connection;
  if (connectionType.value === 'serial') {
    connection = new SerialConnection();
  } else {
    connection = new BluetoothConnection();
  }
  await connection.connect();
  ledgrid = new LedGrid(connection, size, size);
  connect.disabled = true;
  disconnect.disabled = false;
  screen.disabled = true;
  connectionType.disabled = true;
  await ledgrid.sendImage(
    ctx.getImageData(0, 0, ledgrid.width, ledgrid.height).data,
    getBrightness(),
  );
});

emojiPicker.addEventListener('emoji-click', (event) => {
  emojiDatabase.setEmoji(event.detail.unicode!);
});

emojiDatabase.onEmojiUpdate((emoji) => {
  lastEmoji = emoji;
  drawEmoji(ctx, emoji, 'Arial', canvas.width, canvas.height);
  if (ledgrid) {
    ledgrid.sendImage(ctx.getImageData(0, 0, ledgrid.width, ledgrid.height).data, getBrightness());
  }
});

brightness.addEventListener('change', () => (localStorage['brightness'] = getBrightness()));

document.addEventListener('DOMContentLoaded', () => {
  brightness.value = localStorage['brightness'] ?? '255';
  screen.value = localStorage['screen'] ?? '16';
  connectionType.value = localStorage['connection'] ?? 'serial';
  const size = parseInt(screen.value);
  canvas.width = size;
  canvas.height = size;
  drawEmoji(ctx, lastEmoji, 'Arial', canvas.width, canvas.height);
});

function drawEmoji(
  context: CanvasRenderingContext2D,
  text: string,
  font: string,
  maxWidth: number,
  maxHeight: number,
) {
  context.fillStyle = '#000000';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.textAlign = 'center';
  context.textBaseline = 'alphabetic';
  context.fillStyle = '#00FFFF';

  let fontSize = maxHeight;
  let measurement = context.measureText(text);
  while (fontSize > 1) {
    context.font = `${fontSize}px ${font}`;
    measurement = context.measureText(text);
    const w = measurement.width;
    const h = measurement.actualBoundingBoxAscent + measurement.actualBoundingBoxDescent;
    if (w <= maxWidth && h <= maxHeight) break;
    fontSize -= 1;
  }

  const h = measurement.actualBoundingBoxAscent + measurement.actualBoundingBoxDescent;
  const y = (maxHeight - h) / 2 + measurement.actualBoundingBoxAscent;
  context.fillText(text, maxWidth / 2, y);
}
