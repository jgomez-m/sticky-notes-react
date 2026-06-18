export type NoteColor = 'yellow' | 'blue' | 'green' | 'pink';

export type Note = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  label: string;
  content: string;
  color: NoteColor;
};

export type NoteFormState = Pick<Note, 'x' | 'y' | 'width' | 'height' | 'label' | 'content' | 'color'>;

export type DragMode = 'move' | 'resize';

export type Rect = Pick<Note, 'x' | 'y' | 'width' | 'height'>;

export const MIN_SIZE = 100;
export const MAX_WIDTH = 1200;
export const MAX_HEIGHT = 760;
export const STORAGE_KEY = 'sticky-notes-app:notes';

export const TRASH_ZONE = {
  width: 180,
  height: 118,
  margin: 24,
};

export const NOTE_COLORS: Array<{ id: NoteColor; label: string }> = [
  { id: 'yellow', label: 'Yellow' },
  { id: 'blue', label: 'Blue' },
  { id: 'green', label: 'Green' },
  { id: 'pink', label: 'Pink' },
];
