// frontend/components/LayersPanel.tsx
"use client";
import { useState } from "react";
import { ChevronDown, Layers as LayersIcon } from "lucide-react";
import type { MapLayer } from "./MapView";

export function LayersPanel({
  layers,
  onToggle,
}: {
  layers: MapLayer[];
  onToggle: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div
      className="glass glass-md absolute bottom-3 right-3 z-10 w-64"
      style={{
        maxHeight: "calc(100% - 24px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between px-3 py-2 text-left"
      >
        <span className="flex items-center gap-1.5">
          <LayersIcon size={12} style={{ color: "var(--accent-cyan)" }} />
          <span
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-2)" }}
          >
            Layers
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span className="text-[10px] mono" style={{ color: "var(--text-3)" }}>
            {layers.filter((l) => l.visible).length}/{layers.length}
          </span>
          <ChevronDown
            size={14}
            style={{
              color: "var(--text-3)",
              transform: open ? "rotate(0deg)" : "rotate(-90deg)",
              transition: "transform 200ms",
            }}
          />
        </span>
      </button>

      {open && (
        <div className="overflow-y-auto px-2 pb-2">
          {layers.map((l) => (
            <label
              key={l.id}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[12px] transition-colors hover:bg-white/5"
            >
              <input
                type="checkbox"
                checked={l.visible}
                onChange={() => onToggle(l.id)}
                className="h-3.5 w-3.5 cursor-pointer accent-cyan-400"
              />
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ background: l.color, boxShadow: `0 0 6px ${l.color}66` }}
              />
              <span style={{ color: "var(--text-1)" }}>{l.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}