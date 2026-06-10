
Sticky Notes
============

This project is a Vite-powered React + TypeScript single-page application for desktop sticky notes.

Implemented features:

1. Create a new note with a specified width, height, and position.
2. Move a note by dragging it anywhere inside the board.
3. Resize a note by dragging the bottom-right corner handle.
4. Remove a note by dragging it over the trash zone and releasing it.

Architecture summary:

The application uses a single source of truth in React state for the list of notes. Each note stores position, size, label and z-index. The board is a relative container, and notes are rendered as absolutely positioned elements. Drag operations are handled with pointer events and shared movement logic so note position and resizing remain smooth, responsive, and constrained within the board bounds.

A small form-driven creation UI lets the user define the initial note geometry before creating it. Notes are also brought to the front when interaction begins, which improves usability when notes overlap. The trash zone is a fixed board target; while moving a note, the app checks whether the note center is inside that target, highlights the zone, and removes the note on pointer release.

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

Project files:

- `src/App.tsx` — main application logic, note creation and drag/resize handling.
- `src/main.tsx` — app bootstrap.
- `src/index.css` — global styling and board layout.
- `vite.config.ts` — Vite configuration.
