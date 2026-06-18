import type { DragMode, Rect } from './types';
import { MIN_SIZE, TRASH_ZONE } from './types';

export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const getBoardBounds = (board: HTMLDivElement | null) => ({
  width: board?.clientWidth || 1200,
  height: board?.clientHeight || 950,
});

export const getTrashBounds = (board: HTMLDivElement | null) => {
  const bounds = getBoardBounds(board);

  return {
    x: Math.max(TRASH_ZONE.margin, bounds.width - TRASH_ZONE.width - TRASH_ZONE.margin),
    y: Math.max(TRASH_ZONE.margin, bounds.height - TRASH_ZONE.height - TRASH_ZONE.margin),
    width: TRASH_ZONE.width,
    height: TRASH_ZONE.height,
  };
};

export const getNextRect = ({
  mode,
  origin,
  startX,
  startY,
  clientX,
  clientY,
  board,
}: {
  mode: DragMode;
  origin: Rect;
  startX: number;
  startY: number;
  clientX: number;
  clientY: number;
  board: HTMLDivElement | null;
}) => {
  const bounds = getBoardBounds(board);

  if (mode === 'move') {
    return {
      ...origin,
      x: clamp(origin.x + clientX - startX, 0, bounds.width - origin.width),
      y: clamp(origin.y + clientY - startY, 0, bounds.height - origin.height),
    };
  }

  return {
    ...origin,
    width: clamp(origin.width + clientX - startX, MIN_SIZE, bounds.width - origin.x),
    height: clamp(origin.height + clientY - startY, MIN_SIZE, bounds.height - origin.y),
  };
};

export const isRectOverTrash = (rect: Rect, board: HTMLDivElement | null) => {
  const trash = getTrashBounds(board);
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;

  return (
    centerX >= trash.x &&
    centerX <= trash.x + trash.width &&
    centerY >= trash.y &&
    centerY <= trash.y + trash.height
  );
};
