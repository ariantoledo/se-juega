import React from "react";

const PADEL_POSITIONS = {
  dobles: ["Falta pareja completa", "Falta un jugador", "Falta drive", "Falta revés"],
  dobles_mixto: ["Falta pareja completa", "Falta jugador masculino", "Falta jugadora femenina", "Falta un jugador"],
  singles: ["Falta rival"],
};

export default function PadelPositionSelector({ selected = [], onChange, matchType, playersNeeded }) {
  const options = PADEL_POSITIONS[matchType] || PADEL_POSITIONS.dobles;
  const maxSelectable = playersNeeded - 1;

  const toggle = (pos) => {
    if (selected.includes(pos)) {
      onChange(selected.filter(p => p !== pos));
    } else if (selected.length < maxSelectable) {
      onChange([...selected, pos]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">¿Qué falta? (opcional)</label>
      <div className="flex flex-wrap gap-2">
        {options.map(pos => (
          <button
            key={pos}
            type="button"
            onClick={() => toggle(pos)}
            className={`px-3 py-1.5 rounded-full border-2 text-xs font-medium transition-all ${
              selected.includes(pos)
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            {pos}
          </button>
        ))}
      </div>
      {selected.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Seleccionado: {selected.join(", ")}
        </p>
      )}
    </div>
  );
}