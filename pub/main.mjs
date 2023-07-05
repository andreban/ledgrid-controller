import {EmojiDatabase} from './database.mjs';
import {LedGrid} from './ledgrid.mjs';
import {UartBluetooth} from './bluetooth_uart.mjs';

const emojiDatabase = new EmojiDatabase();

const brightness = document.querySelector('#brightness');
const connect = document.querySelector('#connect');
const disconnect = document.querySelector('#disconnect');
const btConnect = document.querySelector('#bt_connect');
const btDisconnect = document.querySelector('#bt_disconnect');
const emojiPicker = document.querySelector('emoji-picker');
const canvas = document.querySelector('canvas');

const ctx = canvas.getContext('2d');
const uartBluetoothConnection = new UartBluetooth();
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
  ledgrid = await LedGrid.connect();
  connect.disabled = true;
  disconnect.disabled = false;
  await ledgrid.sendImage(ctx.getImageData(0, 0, 32, 32).data, getBrightness());
});

btConnect.addEventListener('click', async() => {
  await uartBluetoothConnection.connect();
});

btDisconnect.addEventListener('click', async () => {
  await uartBluetoothConnection.disconnect();
});

emojiPicker.addEventListener('emoji-click', event => {
    emojiDatabase.setEmoji(event.detail.unicode);   
});

emojiDatabase.onEmojiUpdate((emoji) => {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "32px Arial";
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(emoji, 0, 28);
    // if (ledgrid) {
    //   ledgrid.sendImage(ctx.getImageData(0, 0, 32, 32).data, getBrightness());
    // }

    if (uartBluetoothConnection.connected) {
      uartBluetoothConnection.sendImage(ctx.getImageData(0, 0, 32, 32).data);
    }

});

brightness.addEventListener('change', () =>
    localStorage['brightness'] = getBrightness());

document.addEventListener('DOMContentLoaded', () =>
    brightness.value = localStorage['brightness'] ?? '255');
