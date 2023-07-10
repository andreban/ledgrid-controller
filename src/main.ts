import { Picker } from 'emoji-picker-element';
import { EmojiDatabase } from './database.js';
import { LedGrid } from './ledgrid.js';
import { BluetoothConnection } from './connections/bluetooth_connection.js';
import { SerialConnection } from './connections/serial_connection.js';

const emojiDatabase = new EmojiDatabase();

const brightness = document.querySelector('#brightness') as HTMLSelectElement;
const connect = document.querySelector('#connect') as HTMLButtonElement;
const disconnect = document.querySelector('#disconnect') as HTMLButtonElement;
const btConnect = document.querySelector('#bt_connect') as HTMLButtonElement;
const btDisconnect = document.querySelector('#bt_disconnect') as HTMLButtonElement;
const emojiPicker = document.querySelector('emoji-picker') as Picker;
const canvas = document.querySelector('canvas')! as HTMLCanvasElement;

const ctx = canvas.getContext('2d')!;

let ledgrid;

ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.font = "32px Arial";
ctx.fillText("👀", 0, 30);

function getBrightness() {
  return parseInt(brightness?.value, 10) || 255;
}

disconnect.addEventListener('click', async () => {
  if (ledgrid) {
    await ledgrid.disconnect();
  }
  disconnect.disabled = true;
  connect.disabled = false;
});

connect.addEventListener('click', async () => {
  const serialConnection = new SerialConnection();
  await serialConnection.connect();
  ledgrid = new LedGrid(serialConnection, 16, 16);
  connect.disabled = true;
  disconnect.disabled = false;
  await ledgrid.sendImage(ctx.getImageData(0, 0, 16, 16).data, getBrightness());
});

btConnect.addEventListener('click', async() => {
  const bluetoothConnection = new BluetoothConnection();
  await bluetoothConnection.connect();
  ledgrid = new LedGrid(bluetoothConnection, 32, 32);
  await ledgrid.sendImage(ctx.getImageData(0, 0, 32, 32).data, getBrightness());
});

btDisconnect.addEventListener('click', async () => {
  await ledgrid.connection.disconnect();
});

emojiPicker.addEventListener('emoji-click', event => {
    emojiDatabase.setEmoji(event.detail.unicode!);   
});

emojiDatabase.onEmojiUpdate((emoji) => {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "32px Arial";
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(emoji, 0, 28);
    if (ledgrid) {
      ledgrid.sendImage(ctx.getImageData(0, 0, 32, 32).data, getBrightness());
    }
});

brightness.addEventListener('change', () =>
    localStorage['brightness'] = getBrightness());

document.addEventListener('DOMContentLoaded', () =>
    brightness.value = localStorage['brightness'] ?? '255');
