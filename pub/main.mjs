import {EmojiDatabase} from './database.mjs';
import {LedGrid} from './ledgrid.mjs';

const emojiDatabase = new EmojiDatabase();

const connect = document.querySelector('#connect');
const disconnect = document.querySelector('#disconnect');
const emojiPicker = document.querySelector('emoji-picker');
const canvas = document.querySelector('canvas');

const ctx = canvas.getContext('2d');
let ledgrid;

ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.font = "12px Arial";
ctx.fillText("👀", 0, 12);

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
  await ledgrid.sendImage(ctx.getImageData(0, 0, 16, 16).data);
});

emojiPicker.addEventListener('emoji-click', event => {
    emojiDatabase.setEmoji(event.detail.unicode);   
});

emojiDatabase.onEmojiUpdate((emoji) => {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "12px Arial";
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(emoji, 0, 12);
    if (ledgrid) {
      ledgrid.sendImage(ctx.getImageData(0, 0, 16, 16).data);
    }
});
