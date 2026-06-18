import type { Note, NoteFormState } from '../types';
import { MAX_HEIGHT, MAX_WIDTH, MIN_SIZE, NOTE_COLORS } from '../types';

type NoteFormProps = {
  form: NoteFormState;
  selectedNote: Note | null;
  onChange: (updates: Partial<NoteFormState>) => void;
  onCreate: () => void;
};

export function NoteForm({ form, selectedNote, onChange, onCreate }: NoteFormProps) {
  return (
    <div className="note-form">
      <label>
        X
        <input
          type="number"
          value={form.x}
          min={0}
          max={MAX_WIDTH}
          onChange={(event) => onChange({ x: Number(event.target.value) })}
        />
      </label>
      <label>
        Y
        <input
          type="number"
          value={form.y}
          min={0}
          max={MAX_HEIGHT}
          onChange={(event) => onChange({ y: Number(event.target.value) })}
        />
      </label>
      <label>
        Width
        <input
          type="number"
          value={form.width}
          min={MIN_SIZE}
          max={MAX_WIDTH}
          onChange={(event) => onChange({ width: Number(event.target.value) })}
        />
      </label>
      <label>
        Height
        <input
          type="number"
          value={form.height}
          min={MIN_SIZE}
          max={MAX_HEIGHT}
          onChange={(event) => onChange({ height: Number(event.target.value) })}
        />
      </label>
      <label className="label-input">
        Label
        <input
          type="text"
          value={form.label}
          onChange={(event) => onChange({ label: event.target.value })}
        />
      </label>
      <label className="content-input">
        Content
        <textarea
          value={form.content}
          rows={3}
          onChange={(event) => onChange({ content: event.target.value })}
        />
      </label>
      <fieldset className="color-picker" aria-label="Note color">
        {NOTE_COLORS.map((color) => (
          <label key={color.id} className="color-option">
            <input
              type="radio"
              name="note-color"
              checked={form.color === color.id}
              onChange={() => onChange({ color: color.id })}
            />
            <span className={`color-swatch color-swatch--${color.id}`} />
            {color.label}
          </label>
        ))}
      </fieldset>
      <button type="button" onClick={onCreate} className="create-button">
        {selectedNote ? 'Create another note' : 'Create note'}
      </button>
    </div>
  );
}
