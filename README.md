
Sticky Notes
============

This project is a Vite-powered React + TypeScript single-page application for desktop sticky notes.

Implemented features:

1. Create a new note with a specified width, height, and position.
2. Move a note by dragging it anywhere inside the board.
3. Resize a note by dragging the bottom-right corner handle.
4. Remove a note by dragging it over the trash zone and releasing it.
5. Create notes directly on the board by double-clicking an empty area.
6. Rename the selected note from the form and edit note content inline.
7. Persist notes in Local Storage and restore them on page load.
8. Choose a note colour when creating a note.

Architecture summary:

The application keeps the durable notes collection in `App`, while `Board`, `StickyNote` and `NoteForm` handle focused UI responsibilities. Shared geometry helpers centralize clamping, resizing and trash-zone hit detection, which keeps drag rules testable outside of rendering concerns. Notes are serialized to Local Storage whenever the collection changes and normalized on load to tolerate older or malformed saved data.

Drag and resize interactions are intentionally local to each `StickyNote`: pointer movement updates only that note's draft rectangle, and the parent state is committed once the pointer is released. This avoids re-rendering the whole board on every drag frame. `StickyNote` is memoized, so unchanged notes do not re-render when a sibling is being edited, dragged or resized.

The form defines the next note and can resize or rename the selected note, while each sticky note keeps content editing inline. The note title is a non-editable drag surface, which keeps moving notes from the top edge predictable. The board supports double-click creation for faster workflows, notes move to the front when selected, and the trash target remains a fixed board-level drop zone.

Build and run instructions:

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Build the production bundle:
   ```bash
   npm run build
   ```
4. Run unit tests:
   ```bash
   npm test
   ```

Project files:

- `src/App.tsx` — main application state, persistence and note orchestration.
- `src/components/Board.tsx` — board layout, double-click creation and trash-zone state.
- `src/components/StickyNote.tsx` — memoized note rendering, inline editing and local drag/resize state.
- `src/components/NoteForm.tsx` — note creation form and selected-note size controls.
- `src/geometry.ts` — pure geometry helpers for clamping, resizing and trash-zone detection.
- `src/types.ts` — shared note types and constants.
- `src/App.test.tsx` — unit tests for creation, editing, persistence, drag, resize and deletion.
- `src/main.tsx` — app bootstrap.
- `src/index.css` — global styling and board layout.
- `vite.config.ts` — Vite configuration.
