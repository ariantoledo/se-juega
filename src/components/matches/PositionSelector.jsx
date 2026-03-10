import React from "react";
import { Badge } from "@/components/ui/badge";

const ALL_POSITIONS = [
  "Arquero",
  "Defensor",
  "Mediocampista",
  "Delantero",
];

export default function PositionSelector({ selected = [], onChange, max = 2, label = "Posiciones" }) {
  const togglePosition = (pos) => {
    if (selected.includes(pos)) {
      onChange(selected.filter((p) => p !== pos));
    } else if (selected.length < max) {
      onChange([...selected, pos]);
    }
  };

  return (
    <div>
      {label && <label className="text-sm font-medium text-foreground mb-2 block">{label}</label>}
      <div className="flex flex-wrap gap-2">
        {ALL_POSITIONS.map((pos) => {
          const isSelected = selected.includes(pos);
          return (
            <button
              key={pos}
              type="button"
              onClick={() => togglePosition(pos)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {pos}
            </button>
          );
        })}
      </div>
      {max && <p className="text-xs text-muted-foreground mt-1">Máximo {max}</p>}
    </div>
  );
}