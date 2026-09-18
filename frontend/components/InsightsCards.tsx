// frontend/components/InsightsCards.tsx
"use client";
import { Layers, Target, Gauge, Database } from "lucide-react";
import type { AnalysisResponse } from "@/lib/api";

export function InsightsCards({ data }: { data: AnalysisResponse | null }) {
  const cards = [
    {
      icon: Target,
      label: "Detected Intent",
      value: data?.intent ?? "—",
      accent: "var(--accent-cyan)",
    },
    {
      icon: Layers,
      label: "Active Layers",
      value: data ? String(data.layers.length) : "0",
      accent: "var(--accent-blue)",
    },
    {
      icon: Gauge,
      label: "Confidence",
      value: data?.evidence.confidence != null ? `${data.evidence.confidence}%` : "—",
      accent: "var(--accent-green)",
    },
    {
      icon: Database,
      label: "Data Source",
      value: data?.evidence.source ?? "—",
      accent: "#a78bfa",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {cards.map((c, i) => (
        <div key={i} className="glass glass-md glass-hover">
          <div className="mb-2 flex items-center gap-2">
            <c.icon size={13} style={{ color: c.accent }} />
            <span
              className="text-[10px] font-medium uppercase tracking-wider"
              style={{ color: "var(--text-3)" }}
            >
              {c.label}
            </span>
          </div>
          <div
            className="truncate text-[15px] font-semibold"
            style={{ color: "var(--text-1)" }}
            title={c.value}
          >
            {c.value}
          </div>
        </div>
      ))}
    </div>
  );
}