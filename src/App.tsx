import { useEffect, useRef, useState } from 'react';

type Note = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  label: string;
};

type ActiveDrag = {
  id: string;
  mode: 'move' | 'resize';
  startX: number;
  startY: number;
  origX: number;
  origY: number;
  origWidth: number;
  origHeight: number;
};

const MIN_SIZE = 100;
const MAX_WIDTH = 1200;
const MAX_HEIGHT = 950;
const TRASH_ZONE = {
  width: 180,
  height: 118,
  margin: 24,
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [form, setForm] = useState({ x: 100, y: 100, width: 220, height: 180, label: 'New note' });
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);
  const [isOverTrash, setIsOverTrash] = useState(false);
  const [topZ, setTopZ] = useState(1);
  const boardRef = useRef<HTMLDivElement | null>(null);

  // Reads the live board size so dragging and resizing stay within the visible workspace.
  const getBoardBounds = () => {
    if (!boardRef.current) {
      return { width: MAX_WIDTH, height: MAX_HEIGHT };
    }
    return {
      width: boardRef.current.clientWidth,
      height: boardRef.current.clientHeight,
    };
  };

  // Keeps the trash target aligned with the visual zone rendered in the board.
  const getTrashBounds = () => {
    const bounds = getBoardBounds();
    return {
      x: Math.max(TRASH_ZONE.margin, bounds.width - TRASH_ZONE.width - TRASH_ZONE.margin),
      y: Math.max(TRASH_ZONE.margin, bounds.height - TRASH_ZONE.height - TRASH_ZONE.margin),
      width: TRASH_ZONE.width,
      height: TRASH_ZONE.height,
    };
  };

  // Reconstructs the dragged note rectangle from the original drag snapshot and pointer delta.
  const getDraggedNoteRect = (drag: ActiveDrag, event: PointerEvent | React.PointerEvent) => {
    const bounds = getBoardBounds();
    const nextX = drag.origX + event.clientX - drag.startX;
    const nextY = drag.origY + event.clientY - drag.startY;

    return {
      x: clamp(nextX, 0, bounds.width - drag.origWidth),
      y: clamp(nextY, 0, bounds.height - drag.origHeight),
      width: drag.origWidth,
      height: drag.origHeight,
    };
  };

  // A note is removed only when its center is released inside the trash zone.
  const isNoteOverTrash = (drag: ActiveDrag, event: PointerEvent | React.PointerEvent) => {
    if (drag.mode !== 'move') {
      return false;
    }

    const noteRect = getDraggedNoteRect(drag, event);
    const trashRect = getTrashBounds();
    const noteCenterX = noteRect.x + noteRect.width / 2;
    const noteCenterY = noteRect.y + noteRect.height / 2;

    return (
      noteCenterX >= trashRect.x &&
      noteCenterX <= trashRect.x + trashRect.width &&
      noteCenterY >= trashRect.y &&
      noteCenterY <= trashRect.y + trashRect.height
    );
  };

  useEffect(() => {
    if (!activeDrag) {
      return undefined;
    }

    const onPointerMove = (event: PointerEvent) => {
      const bounds = getBoardBounds();
      setIsOverTrash(isNoteOverTrash(activeDrag, event));

      setNotes((current) =>
        current.map((note) => {
          if (note.id !== activeDrag.id) return note;

          if (activeDrag.mode === 'move') {
            const nextX = activeDrag.origX + event.clientX - activeDrag.startX;
            const nextY = activeDrag.origY + event.clientY - activeDrag.startY;
            const x = clamp(nextX, 0, bounds.width - note.width);
            const y = clamp(nextY, 0, bounds.height - note.height);

            if (note.id === selectedNoteId) {
              setForm((prev) => ({ ...prev, x, y }));
            }

            return {
              ...note,
              x,
              y,
            };
          }

          const nextWidth = clamp(activeDrag.origWidth + event.clientX - activeDrag.startX, MIN_SIZE, bounds.width - note.x);
          const nextHeight = clamp(activeDrag.origHeight + event.clientY - activeDrag.startY, MIN_SIZE, bounds.height - note.y);

          if (note.id === selectedNoteId) {
            setForm((prev) => ({ ...prev, width: nextWidth, height: nextHeight }));
          }

          return {
            ...note,
            width: nextWidth,
            height: nextHeight,
          };
        }),
      );
    };

    const onPointerUp = (event: PointerEvent) => {
      if (isNoteOverTrash(activeDrag, event)) {
        setNotes((current) => current.filter((note) => note.id !== activeDrag.id));
        setSelectedNoteId((current) => (current === activeDrag.id ? null : current));
      }

      setActiveDrag(null);
      setIsOverTrash(false);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [activeDrag, selectedNoteId]);

  // Creates a note from the current form values and immediately selects it for later edits.
  const createNote = () => {
    const bounds = getBoardBounds();
    const width = clamp(form.width, MIN_SIZE, bounds.width);
    const height = clamp(form.height, MIN_SIZE, bounds.height);
    const newNote: Note = {
      id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      x: clamp(form.x, 0, bounds.width - width),
      y: clamp(form.y, 0, bounds.height - height),
      width,
      height,
      zIndex: topZ + 1,
      label: form.label || 'Sticky note',
    };

    setNotes((current) => [...current, newNote]);
    setSelectedNoteId(newNote.id);
    setTopZ((current) => current + 1);
  };

  // Lets the width and height inputs resize the currently selected note as well as future notes.
  const resizeSelectedNote = (dimension: 'width' | 'height', value: number) => {
    setForm((prev) => ({ ...prev, [dimension]: value }));

    if (!selectedNoteId) {
      return;
    }

    const bounds = getBoardBounds();
    setNotes((current) =>
      current.map((note) => {
        if (note.id !== selectedNoteId) return note;

        if (dimension === 'width') {
          return {
            ...note,
            width: clamp(value, MIN_SIZE, bounds.width - note.x),
          };
        }

        return {
          ...note,
          height: clamp(value, MIN_SIZE, bounds.height - note.y),
        };
      }),
    );
  };

  // Stores a drag snapshot so pointer movement can update note geometry without layout jumps.
  const handleStartDrag = (noteId: string, mode: ActiveDrag['mode'], event: React.PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    const note = notes.find((item) => item.id === noteId);
    if (!note) return;

    setSelectedNoteId(noteId);
    setForm({
      x: note.x,
      y: note.y,
      width: note.width,
      height: note.height,
      label: note.label,
    });

    setNotes((current) =>
      current.map((item) => (item.id === noteId ? { ...item, zIndex: topZ + 1 } : item)),
    );
    setTopZ((current) => current + 1);

    setActiveDrag({
      id: noteId,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      origX: note.x,
      origY: note.y,
      origWidth: note.width,
      origHeight: note.height,
    });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Sticky Notes</h1>
          <p>Use the form to create notes, drag notes to move them, and resize by dragging the corner handle.</p>
        </div>
        <div className="note-form">
          <label>
            X
            <input
              type="number"
              value={form.x}
              min={0}
              max={MAX_WIDTH}
              onChange={(event) => setForm((prev) => ({ ...prev, x: Number(event.target.value) }))}
            />
          </label>
          <label>
            Y
            <input
              type="number"
              value={form.y}
              min={0}
              max={MAX_HEIGHT}
              onChange={(event) => setForm((prev) => ({ ...prev, y: Number(event.target.value) }))}
            />
          </label>
          <label>
            Width
            <input
              type="number"
              value={form.width}
              min={MIN_SIZE}
              max={MAX_WIDTH}
              onChange={(event) => resizeSelectedNote('width', Number(event.target.value))}
            />
          </label>
          <label>
            Height
            <input
              type="number"
              value={form.height}
              min={MIN_SIZE}
              max={MAX_HEIGHT}
              onChange={(event) => resizeSelectedNote('height', Number(event.target.value))}
            />
          </label>
          <label className="label-input">
            Label
            <input
              type="text"
              value={form.label}
              onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value }))}
            />
          </label>
          <button type="button" onClick={createNote} className="create-button">
            Create note
          </button>
        </div>
      </header>

      <main className="board-shell">
        <div ref={boardRef} className="board">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`note${note.id === selectedNoteId ? ' note--selected' : ''}`}
              style={{
                left: note.x,
                top: note.y,
                width: note.width,
                height: note.height,
                zIndex: note.zIndex,
              }}
              onPointerDown={(event) => handleStartDrag(note.id, 'move', event)}
            >
              <div className="note-header">{note.label}</div>
              <div className="note-body">Drag anywhere to move. Resize from the corner. Drop on trash to remove.</div>
              <div
                className="resize-handle"
                onPointerDown={(event) => handleStartDrag(note.id, 'resize', event)}
              />
            </div>
          ))}
          <div className={`trash-zone${isOverTrash ? ' trash-zone--active' : ''}`} aria-label="Trash zone">
            <span className="trash-zone__icon">×</span>
            <span>Trash</span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
