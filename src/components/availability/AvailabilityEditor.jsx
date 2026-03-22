import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Save, Loader2, Bell, BellOff } from "lucide-react";
import { toast } from "sonner";

const DAYS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const DAY_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const TIME_BLOCKS = [
  { label: "Mañana", start: "08:00", end: "12:00", color: "bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300" },
  { label: "Tarde", start: "12:00", end: "18:00", color: "bg-primary/10 border-primary/30 text-primary" },
  { label: "Noche", start: "18:00", end: "23:00", color: "bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-300" },
];

const SELECTED_COLOR = "bg-green-100 border-green-500 text-green-800 dark:bg-green-900/40 dark:border-green-500 dark:text-green-300";

function slotKey(day, block) {
  return `${day}__${block.start}`;
}

export default function AvailabilityEditor({ initialSlots = [], notifyEnabled = true, onSave, saving }) {
  // Convert slots array to a Set of keys for quick lookup
  const [selected, setSelected] = useState(() => {
    const s = new Set();
    initialSlots.forEach(slot => {
      const block = TIME_BLOCKS.find(b => b.start === slot.start_time);
      if (block) s.add(slotKey(slot.day, block));
    });
    return s;
  });
  const [notify, setNotify] = useState(notifyEnabled);

  const toggle = (day, block) => {
    const key = slotKey(day, block);
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSave = () => {
    const slots = [];
    selected.forEach(key => {
      const [day, start] = key.split("__");
      const block = TIME_BLOCKS.find(b => b.start === start);
      if (block) slots.push({ day, start_time: block.start, end_time: block.end });
    });
    onSave(slots, notify);
  };

  return (
    <div className="space-y-4">
      {/* Notify toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          {notify ? <Bell className="w-4 h-4 text-primary" /> : <BellOff className="w-4 h-4 text-muted-foreground" />}
          <div>
            <p className="text-sm font-medium">Recibir notificaciones de partidos</p>
            <p className="text-xs text-muted-foreground">Te avisamos cuando hay un partido en tu horario</p>
          </div>
        </div>
        <Switch checked={notify} onCheckedChange={setNotify} />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-xs">
        {TIME_BLOCKS.map(b => (
          <span key={b.label} className={`px-2 py-1 rounded-full border ${b.color}`}>{b.label} ({b.start}–{b.end})</span>
        ))}
        <span className={`px-2 py-1 rounded-full border ${SELECTED_COLOR}`}>✓ Disponible</span>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto -mx-1">
        <div className="min-w-[320px] grid" style={{ gridTemplateColumns: `64px repeat(${DAYS.length}, 1fr)`, gap: "4px" }}>
          {/* Header */}
          <div />
          {DAY_SHORT.map((d, i) => (
            <div key={i} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
          ))}

          {/* Rows per block */}
          {TIME_BLOCKS.map(block => (
            <React.Fragment key={block.label}>
              <div className="flex items-center justify-end pr-2">
                <span className="text-xs text-muted-foreground font-medium">{block.label}</span>
              </div>
              {DAYS.map((day, di) => {
                const key = slotKey(day, block);
                const isOn = selected.has(key);
                return (
                  <button
                    key={di}
                    type="button"
                    onClick={() => toggle(day, block)}
                    className={`h-10 rounded-lg border-2 text-xs font-semibold transition-all ${
                      isOn ? SELECTED_COLOR : "border-border bg-card hover:border-primary/30 text-muted-foreground"
                    }`}
                  >
                    {isOn ? "✓" : ""}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-primary hover:bg-primary/90"
      >
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        Guardar disponibilidad
      </Button>
    </div>
  );
}