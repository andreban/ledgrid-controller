import { memo, useImperativeHandle, useRef, type Ref } from 'react';

export interface EmojiCanvasHandle {
  drawEmoji: (emoji: string, size?: number) => void;
  getImageData: () => ImageData | null;
}

interface Props {
  ref: Ref<EmojiCanvasHandle>;
}

// memo prevents parent re-renders from resetting canvas dimensions set imperatively.
export const EmojiCanvas = memo(function EmojiCanvas({ ref }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useImperativeHandle(ref, () => ({
    drawEmoji(emoji: string, size?: number) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (size !== undefined) {
        canvas.width = size;
        canvas.height = size;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      renderEmoji(ctx, emoji, canvas.width, canvas.height);
    },
    getImageData() {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      return ctx.getImageData(0, 0, canvas.width, canvas.height);
    },
  }));

  return (
    <canvas
      ref={canvasRef}
      width={32}
      height={32}
      className="w-28 h-28 md:w-48 md:h-48 rounded [image-rendering:pixelated]"
    />
  );
});

function renderEmoji(ctx: CanvasRenderingContext2D, text: string, width: number, height: number) {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#00FFFF';

  let fontSize = height;
  let measurement = ctx.measureText(text);
  while (fontSize > 1) {
    ctx.font = `${fontSize}px Arial`;
    measurement = ctx.measureText(text);
    const w = measurement.width;
    const h = measurement.actualBoundingBoxAscent + measurement.actualBoundingBoxDescent;
    if (w <= width && h <= height) break;
    fontSize -= 1;
  }

  const h = measurement.actualBoundingBoxAscent + measurement.actualBoundingBoxDescent;
  const y = (height - h) / 2 + measurement.actualBoundingBoxAscent;
  ctx.fillText(text, width / 2, y);
}
