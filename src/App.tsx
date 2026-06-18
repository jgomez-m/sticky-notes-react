import { useCallback, useEffect, useMemo, useState } from 'react';
import { Board } from './components/Board';
import { NoteForm } from './components/NoteForm';
import { clamp } from './geometry';
import type { Note, NoteColor, NoteFormState } from './types';
import { MAX_HEIGHT, MAX_WIDTH, MIN_SIZE, NOTE_COLORS, STORAGE_KEY } from './types';

const createId = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

const initialForm: NoteFormState = {
  x: 100,
  y: 100,
  width: 220,
  height: 180,
  label: 'New note',
  content: 'Double-click this text to edit the note.',
  color: 'yellow',
};

const isNoteColor = (value: unknown): value is NoteColor =>
  typeof value === 'string' && NOTE_COLORS.some((color) => color.id === value);

const normalizeNote = (value: unknown): Note | null => {
  if (!value || typeof value !== 'object') return null;

  const note = value as Partial<Note>;
  if (typeof note.id !== 'string') return null;

  return {
    id: note.id,
    x: Number.isFinite(note.x) ? Number(note.x) : initialForm.x,
    y: Number.isFinite(note.y) ? Number(note.y) : initialForm.y,
    width: Number.isFinite(note.width) ? Math.max(Number(note.width), MIN_SIZE) : initialForm.width,
    height: Number.isFinite(note.height) ? Math.max(Number(note.height), MIN_SIZE) : initialForm.height,
    zIndex: Number.isFinite(note.zIndex) ? Number(note.zIndex) : 1,
    label: typeof note.label === 'string' && note.label.trim() ? note.label : 'Sticky note',
    content: typeof note.content === 'string' ? note.content : '',
    color: isNoteColor(note.color) ? note.color : 'yellow',
  };
};

const loadNotes = () => {
  try {
    const storedNotes = window.localStorage.getItem(STORAGE_KEY);
    if (!storedNotes) return [];

    const parsed = JSON.parse(storedNotes);
    if (!Array.isArray(parsed)) return [];

    return parsed.map(normalizeNote).filter((note): note is Note => Boolean(note));
  } catch {
    return [];
  }
};

function App() {
  const [notes, setNotes] = useState<Note[]>(loadNotes);
  const [form, setForm] = useState<NoteFormState>(initialForm);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [topZ, setTopZ] = useState(() => notes.reduce((max, note) => Math.max(max, note.zIndex), 1));

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedNoteId) ?? null,
    [notes, selectedNoteId],
  );

  const createNote = useCallback(
    (overrides: Partial<Pick<Note, 'x' | 'y' | 'width' | 'height' | 'label' | 'content' | 'color'>> = {}) => {
      const width = clamp(overrides.width ?? form.width, MIN_SIZE, MAX_WIDTH);
      const height = clamp(overrides.height ?? form.height, MIN_SIZE, MAX_HEIGHT);
      const nextZ = topZ + 1;
      const newNote: Note = {
        id: createId(),
        x: clamp(overrides.x ?? form.x, 0, MAX_WIDTH - width),
        y: clamp(overrides.y ?? form.y, 0, MAX_HEIGHT - height),
        width,
        height,
        zIndex: nextZ,
        label: (overrides.label ?? form.label).trim() || 'Sticky note',
        content: overrides.content ?? form.content,
        color: overrides.color ?? form.color,
      };

      setNotes((current) => [...current, newNote]);
      setSelectedNoteId(newNote.id);
      setTopZ(nextZ);
      setForm({
        x: newNote.x,
        y: newNote.y,
        width: newNote.width,
        height: newNote.height,
        label: newNote.label,
        content: newNote.content,
        color: newNote.color,
      });
    },
    [form, topZ],
  );

  const createNoteAt = useCallback(
    (x: number, y: number) => {
      createNote({ x, y });
    },
    [createNote],
  );

  const updateNote = useCallback((noteId: string, updates: Partial<Omit<Note, 'id'>>) => {
    setNotes((current) =>
      current.map((note) => (note.id === noteId ? { ...note, ...updates } : note)),
    );
  }, []);

  const commitGeometry = useCallback(
    (noteId: string, geometry: Pick<Note, 'x' | 'y' | 'width' | 'height'>) => {
      updateNote(noteId, geometry);
      setForm((current) =>
        selectedNoteId === noteId
          ? { ...current, ...geometry }
          : current,
      );
    },
    [selectedNoteId, updateNote],
  );

  const deleteNote = useCallback((noteId: string) => {
    setNotes((current) => current.filter((note) => note.id !== noteId));
    setSelectedNoteId((current) => (current === noteId ? null : current));
  }, []);

  const selectNote = useCallback(
    (noteId: string) => {
      const note = notes.find((item) => item.id === noteId);
      if (!note) return;

      setSelectedNoteId(noteId);
      setForm({
        x: note.x,
        y: note.y,
        width: note.width,
        height: note.height,
        label: note.label,
        content: note.content,
        color: note.color,
      });
    },
    [notes],
  );

  const bringToFront = useCallback((noteId: string) => {
    setTopZ((currentTopZ) => {
      const nextZ = currentTopZ + 1;
      setNotes((current) =>
        current.map((note) => (note.id === noteId ? { ...note, zIndex: nextZ } : note)),
      );
      return nextZ;
    });
  }, []);

  const updateForm = useCallback(
    (updates: Partial<NoteFormState>) => {
      setForm((current) => ({ ...current, ...updates }));

      if (!selectedNoteId) return;

      const selected = notes.find((note) => note.id === selectedNoteId);
      if (!selected) return;

      const noteUpdates: Partial<Omit<Note, 'id'>> = {};
      if (updates.width !== undefined) {
        noteUpdates.width = clamp(updates.width, MIN_SIZE, MAX_WIDTH - selected.x);
      }
      if (updates.height !== undefined) {
        noteUpdates.height = clamp(updates.height, MIN_SIZE, MAX_HEIGHT - selected.y);
      }
      if (updates.label !== undefined) {
        noteUpdates.label = updates.label.trim() || 'Sticky note';
      }
      if (updates.color !== undefined) {
        noteUpdates.color = updates.color;
      }
      if (Object.keys(noteUpdates).length > 0) {
        updateNote(selectedNoteId, noteUpdates);
      }
    },
    [notes, selectedNoteId, updateNote],
  );

  const handleInlineUpdate = useCallback(
    (noteId: string, updates: Partial<Omit<Note, 'id'>>) => {
      updateNote(noteId, updates);

      if (noteId === selectedNoteId) {
        setForm((current) => ({
          ...current,
          ...(updates.label !== undefined ? { label: updates.label } : null),
          ...(updates.content !== undefined ? { content: updates.content } : null),
          ...(updates.color !== undefined ? { color: updates.color } : null),
        }));
      }
    },
    [selectedNoteId, updateNote],
  );

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Sticky Notes</h1>
          <p>Create, edit, drag, resize, color and persist notes directly on the board.</p>
        </div>
        <NoteForm
          form={form}
          selectedNote={selectedNote}
          onChange={updateForm}
          onCreate={() => createNote()}
        />
      </header>

      <Board
        notes={notes}
        selectedNoteId={selectedNoteId}
        onSelectNote={selectNote}
        onBringToFront={bringToFront}
        onCommitGeometry={commitGeometry}
        onUpdateNote={handleInlineUpdate}
        onDeleteNote={deleteNote}
        onCreateNoteAt={createNoteAt}
      />
    </div>
  );
}

export default App;
