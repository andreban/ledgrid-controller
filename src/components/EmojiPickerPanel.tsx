import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react';

interface Props {
  onEmojiSelect: (emoji: string) => void;
}

export function EmojiPickerPanel({ onEmojiSelect }: Props) {
  function handleClick(data: EmojiClickData) {
    onEmojiSelect(data.emoji);
  }

  return <EmojiPicker onEmojiClick={handleClick} width="100%" height="100%" />;
}
