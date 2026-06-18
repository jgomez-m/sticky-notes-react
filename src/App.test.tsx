import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { STORAGE_KEY } from './types';

const BOARD_WIDTH = 1200;
const BOARD_HEIGHT = 760;

const boardSize = {
  width: BOARD_WIDTH,
  height: BOARD_HEIGHT,
};

const setupBoardMeasurements = () => {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get() {
      return this.classList.contains('board') ? boardSize.width : 0;
    },
  });

  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get() {
      return this.classList.contains('board') ? boardSize.height : 0;
    },
  });
};

const setInputValue = (label: string, value: string) => {
  const input = screen.getByLabelText(label);

  fireEvent.change(input, { target: { value } });
};

const createNote = ({
  x = '100',
  y = '100',
  width = '220',
  height = '180',
  label = 'New note',
} = {}) => {
  setInputValue('X', x);
  setInputValue('Y', y);
  setInputValue('Width', width);
  setInputValue('Height', height);
  setInputValue('Label', label);

  fireEvent.click(screen.getByRole('button', { name: /create/i }));
};

const getNote = (label: string) => {
  const note = screen.getByLabelText(`Note ${label}`);

  if (!note) {
    throw new Error(`Expected note "${label}" to be rendered`);
  }

  return note as HTMLElement;
};

describe('App', () => {
  beforeEach(() => {
    boardSize.width = BOARD_WIDTH;
    boardSize.height = BOARD_HEIGHT;
    setupBoardMeasurements();
    window.localStorage.clear();

    let id = 0;
    Object.defineProperty(window, 'crypto', {
      configurable: true,
      value: {
        ...window.crypto,
        randomUUID: vi.fn(() => `note-${++id}`),
      },
    });
  });

  it('renders the creation form, empty board, and trash target', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /sticky notes/i })).toBeInTheDocument();
    expect(screen.getByLabelText('X')).toHaveValue(100);
    expect(screen.getByLabelText('Y')).toHaveValue(100);
    expect(screen.getByLabelText('Width')).toHaveValue(220);
    expect(screen.getByLabelText('Height')).toHaveValue(180);
    expect(screen.getByLabelText('Label')).toHaveValue('New note');
    expect(screen.getByLabelText('Content')).toHaveValue('Double-click this text to edit the note.');
    expect(screen.getByLabelText(/trash zone/i)).toBeInTheDocument();
    expect(screen.queryByLabelText('Note Sticky note')).not.toBeInTheDocument();
  });

  it('creates a note from form values and clamps impossible geometry to the board', async () => {
    render(<App />);

    createNote({
      x: '2000',
      y: '-50',
      width: '80',
      height: '2000',
      label: '',
    });

    const note = getNote('Sticky note');
    expect(note).toHaveClass('note--selected');
    expect(note).toHaveStyle({
      left: '1100px',
      top: '0px',
      width: '100px',
      height: '760px',
      zIndex: '2',
    });
  });

  it('resizes the selected note from the form while respecting minimum size and board bounds', async () => {
    render(<App />);

    createNote({ label: 'Planning' });
    const note = getNote('Planning');

    setInputValue('Width', '2000');
    expect(note).toHaveStyle({ width: '1100px' });

    setInputValue('Height', '50');
    expect(note).toHaveStyle({ height: '100px' });
    expect(screen.getByLabelText('Width')).toHaveValue(2000);
    expect(screen.getByLabelText('Height')).toHaveValue(50);
  });

  it('moves notes with pointer gestures, brings them forward, and keeps the form in sync', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: 'note-1',
          x: 100,
          y: 100,
          width: 220,
          height: 180,
          zIndex: 2,
          label: 'First',
          content: 'First body',
          color: 'yellow',
        },
        {
          id: 'note-2',
          x: 300,
          y: 200,
          width: 220,
          height: 180,
          zIndex: 3,
          label: 'Second',
          content: 'Second body',
          color: 'blue',
        },
      ]),
    );
    render(<App />);

    const firstNote = getNote('First');
    const secondNote = getNote('Second');

    fireEvent.pointerDown(firstNote, { pointerId: 1, clientX: 110, clientY: 110 });
    await waitFor(() => expect(firstNote).toHaveClass('note--selected'));

    fireEvent.pointerMove(window, { clientX: 500, clientY: 400 });

    expect(firstNote).toHaveStyle({ left: '490px', top: '390px', zIndex: '4' });
    fireEvent.pointerUp(window, { clientX: 500, clientY: 400 });
    expect(screen.getByLabelText('X')).toHaveValue(490);
    expect(screen.getByLabelText('Y')).toHaveValue(390);
    expect(secondNote).toHaveStyle({ zIndex: '3' });

    fireEvent.pointerDown(firstNote, { pointerId: 3, clientX: 500, clientY: 400 });
    await waitFor(() => expect(firstNote).toHaveClass('note--selected'));
    fireEvent.pointerMove(window, { clientX: 5000, clientY: 5000 });
    expect(firstNote).toHaveStyle({ left: '980px', top: '580px' });

    fireEvent.pointerUp(window, { clientX: 5000, clientY: 5000 });
  });

  it('resizes a note with the corner handle and removes it only when released over the trash target', async () => {
    render(<App />);

    createNote({ label: 'Disposable' });
    const note = getNote('Disposable');
    const handle = note.querySelector('.resize-handle');

    if (!handle) {
      throw new Error('Expected note resize handle to be rendered');
    }

    fireEvent.pointerDown(handle, { pointerId: 1, clientX: 320, clientY: 280 });
    await waitFor(() => expect(note).toHaveClass('note--selected'));

    fireEvent.pointerMove(window, { clientX: 440, clientY: 360 });

    expect(note).toHaveStyle({ width: '340px', height: '260px' });
    fireEvent.pointerUp(window, { clientX: 440, clientY: 360 });
    expect(screen.getByLabelText('Width')).toHaveValue(340);
    expect(screen.getByLabelText('Height')).toHaveValue(260);

    expect(getNote('Disposable')).toBeInTheDocument();

    fireEvent.pointerDown(note, { pointerId: 2, clientX: 110, clientY: 110 });
    await waitFor(() => expect(note).toHaveClass('note--selected'));

    fireEvent.pointerMove(window, { clientX: 930, clientY: 560 });

    const trashZone = screen.getByLabelText(/trash zone/i);
    expect(trashZone).toHaveClass('trash-zone--active');

    fireEvent.pointerUp(window, { clientX: 930, clientY: 560 });
    expect(screen.queryByLabelText('Note Disposable')).not.toBeInTheDocument();
    expect(trashZone).not.toHaveClass('trash-zone--active');
  });

  it('edits title from the form, content inline and color, then persists notes to local storage', async () => {
    const { unmount } = render(<App />);

    setInputValue('Label', 'Editable');
    setInputValue('Content', 'Initial body');
    fireEvent.click(screen.getByLabelText('Blue'));
    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    const note = getNote('Editable');
    expect(note).toHaveClass('note--blue');

    setInputValue('Label', 'Updated title');
    fireEvent.change(screen.getByLabelText('Content for Updated title'), { target: { value: 'Updated body' } });

    expect(getNote('Updated title')).toBeInTheDocument();
    expect(screen.getAllByDisplayValue('Updated body').length).toBeGreaterThan(0);
    await waitFor(() => expect(window.localStorage.getItem(STORAGE_KEY)).toContain('Updated body'));

    unmount();
    render(<App />);

    expect(getNote('Updated title')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Updated body')).toBeInTheDocument();
    expect(getNote('Updated title')).toHaveClass('note--blue');
  });

  it('creates a selected note at the double-clicked board position', () => {
    render(<App />);

    const board = document.querySelector('.board');
    if (!board) {
      throw new Error('Expected board to be rendered');
    }

    fireEvent.doubleClick(board, { clientX: 420, clientY: 260 });

    const note = getNote('New note');
    expect(note).toHaveClass('note--selected');
    expect(note).toHaveStyle({ left: '420px', top: '260px' });
  });
});
