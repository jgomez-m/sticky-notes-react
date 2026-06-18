import { memo, useEffect, useRef, useState } from 'react';
import { getNextRect, isRectOverTrash } from '../geometry';
import type { DragMode, Note, Rect } from '../types';

type ActiveDrag = {
  mode: DragMode;
  startX: number;
  startY: number;
  origin: Rect;
};

type StickyNoteProps = {
  note: Note;
  boardRef: React.RefObject<HTMLDivElement | null>;
  isSelected: boolean;
  onSelect: (noteId: string) => void;
  onBringToFront: (noteId: string) => void;
  onCommitGeometry: (noteId: string, geometry: Rect) => void;
  onUpdateNote: (noteId: string, updates: Partial<Omit<Note, 'id'>>) => void;
  onDelete: (noteId: string) => void;
  onTrashHover: (isOverTrash: boolean) => void;
};

export const StickyNote = memo(function StickyNote({
  note,
  boardRef,
  isSelected,
  onSelect,
  onBringToFront,
  onCommitGeometry,
  onUpdateNote,
  onDelete,
  onTrashHover,
}: StickyNoteProps) {
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);
  const [draftRect, setDraftRect] = useState<Rect | null>(null);
  const latestRectRef = useRef<Rect>({
    x: note.x,
    y: note.y,
    width: note.width,
    height: note.height,
  });

  const renderedRect = draftRect ?? {
    x: note.x,
    y: note.y,
    width: note.width,
    height: note.height,
  };

  useEffect(() => {
    latestRectRef.current = renderedRect;
  }, [renderedRect]);

  useEffect(() => {
    if (!activeDrag) return undefined;

    const onPointerMove = (event: PointerEvent) => {
      const nextRect = getNextRect({
        mode: activeDrag.mode,
        origin: activeDrag.origin,
        startX: activeDrag.startX,
        startY: activeDrag.startY,
        clientX: event.clientX,
        clientY: event.clientY,
        board: boardRef.current,
      });

      latestRectRef.current = nextRect;
      setDraftRect(nextRect);
      onTrashHover(activeDrag.mode === 'move' && isRectOverTrash(nextRect, boardRef.current));
    };

    const onPointerUp = () => {
      const finalRect = latestRectRef.current;
      const shouldDelete = activeDrag.mode === 'move' && isRectOverTrash(finalRect, boardRef.current);

      if (shouldDelete) {
        onDelete(note.id);
      } else {
        onCommitGeometry(note.id, finalRect);
      }

      setActiveDrag(null);
      setDraftRect(null);
      onTrashHover(false);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [activeDrag, boardRef, note.id, onCommitGeometry, onDelete, onTrashHover]);

  const startDrag = (mode: DragMode, event: React.PointerEvent<HTMLElement>) => {
    event.stopPropagation();
    onSelect(note.id);
    onBringToFront(note.id);
    setActiveDrag({
      mode,
      startX: event.clientX,
      startY: event.clientY,
      origin: {
        x: note.x,
        y: note.y,
        width: note.width,
        height: note.height,
      },
    });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const stopInteractivePointer = (event: React.PointerEvent<HTMLElement>) => {
    event.stopPropagation();
    onSelect(note.id);
  };

  return (
    <article
      aria-label={`Note ${note.label}`}
      className={`note note--${note.color}${isSelected ? ' note--selected' : ''}`}
      style={{
        left: renderedRect.x,
        top: renderedRect.y,
        width: renderedRect.width,
        height: renderedRect.height,
        zIndex: note.zIndex,
      }}
      onPointerDown={(event) => startDrag('move', event)}
    >
      <div className="note-title">{note.label}</div>
      <textarea
        className="note-body"
        aria-label={`Content for ${note.label}`}
        value={note.content}
        onPointerDown={stopInteractivePointer}
        onChange={(event) => onUpdateNote(note.id, { content: event.target.value })}
      />
      <button
        type="button"
        className="resize-handle"
        aria-label={`Resize ${note.label}`}
        onPointerDown={(event) => startDrag('resize', event)}
      />
    </article>
  );
});
