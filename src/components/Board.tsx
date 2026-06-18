import { useRef, useState } from 'react';
import { getBoardBounds } from '../geometry';
import type { Note, Rect } from '../types';
import { StickyNote } from './StickyNote';

type BoardProps = {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (noteId: string) => void;
  onBringToFront: (noteId: string) => void;
  onCommitGeometry: (noteId: string, geometry: Rect) => void;
  onUpdateNote: (noteId: string, updates: Partial<Omit<Note, 'id'>>) => void;
  onDeleteNote: (noteId: string) => void;
  onCreateNoteAt: (x: number, y: number) => void;
};

export function Board({
  notes,
  selectedNoteId,
  onSelectNote,
  onBringToFront,
  onCommitGeometry,
  onUpdateNote,
  onDeleteNote,
  onCreateNoteAt,
}: BoardProps) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [isOverTrash, setIsOverTrash] = useState(false);

  const handleDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;

    const bounds = getBoardBounds(boardRef.current);
    const boardRect = event.currentTarget.getBoundingClientRect();
    onCreateNoteAt(
      Math.min(Math.max(event.clientX - boardRect.left, 0), bounds.width),
      Math.min(Math.max(event.clientY - boardRect.top, 0), bounds.height),
    );
  };

  return (
    <main className="board-shell">
      <div ref={boardRef} className="board" onDoubleClick={handleDoubleClick}>
        {notes.map((note) => (
          <StickyNote
            key={note.id}
            note={note}
            boardRef={boardRef}
            isSelected={note.id === selectedNoteId}
            onSelect={onSelectNote}
            onBringToFront={onBringToFront}
            onCommitGeometry={onCommitGeometry}
            onUpdateNote={onUpdateNote}
            onDelete={onDeleteNote}
            onTrashHover={setIsOverTrash}
          />
        ))}
        <div className={`trash-zone${isOverTrash ? ' trash-zone--active' : ''}`} aria-label="Trash zone">
          <span className="trash-zone__icon">×</span>
          <span>Trash</span>
        </div>
      </div>
    </main>
  );
}
