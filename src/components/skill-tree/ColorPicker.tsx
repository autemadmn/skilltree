import { COLOR_SWATCHES } from "../../utils/colors";

type ColorPickerProps = {
  value: string;
  onChange: (value: string) => void;
};

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="color-picker">
      <input type="color" value={value} onChange={(event) => onChange(event.target.value)} aria-label="Orb color" />
      <div className="swatch-row" aria-label="Color swatches">
        {COLOR_SWATCHES.map((color) => (
          <button
            key={color}
            type="button"
            className={`color-swatch ${value.toLowerCase() === color.toLowerCase() ? "selected" : ""}`}
            style={{ background: color }}
            onClick={() => onChange(color)}
            aria-label={`Use ${color}`}
          />
        ))}
      </div>
    </div>
  );
}
