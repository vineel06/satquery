// frontend/components/pages/Settings.tsx
"use client";
import { useState } from "react";
import { Settings as SettingsIcon, Palette, Database, Moon, Sun, Trash2 } from "lucide-react";
import { useTheme } from "@/lib/theme";

const THEMES = [
  { id: "dark", label: "Space (Dark)" },
  { id: "light", label: "Daylight" },
];

export function Settings() {
  const { theme, setTheme } = useTheme();
  const [cacheCleared, setCacheCleared] = useState(false);

  async function clearLocal() {
    if (!confirm("Clear all saved analyses? This cannot be undone.")) return;
    indexedDB.deleteDatabase("satquery");
    localStorage.removeItem("satquery-theme");
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2000);
  }

  return (
    <div className="glass glass-lg mx-auto max-w-3xl p-6">
      <div className="flex items-center gap-2">
        <SettingsIcon size={20} style={{ color: "var(--accent-cyan)" }} />
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      </div>

      <section className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <Palette size={14} style={{ color: "var(--accent-cyan)" }} />
          <span className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-2)" }}>Theme</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id as "dark" | "light")}
              className="glass glass-md glass-hover clay-btn flex items-center gap-3 p-4 text-left"
              style={{
                borderColor: theme === t.id ? "var(--accent-cyan)" : "var(--glass-border)",
                boxShadow: theme === t.id ? "0 0 24px rgba(34,211,238,0.3)" : undefined,
              }}
            >
              {t.id === "dark" ? <Moon size={18} style={{ color: "var(--accent-cyan)" }} /> : <Sun size={18} style={{ color: "var(--accent-cyan)" }} />}
              <span className="text-[13px] font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center gap-2 mb-3">
          <Database size={14} style={{ color: "var(--accent-cyan)" }} />
          <span className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-2)" }}>Storage & Data</span>
        </div>
        <div className="glass glass-md p-4 space-y-3 text-[12px]" style={{ color: "var(--text-2)" }}>
          <div className="flex justify-between"><span>Saved analyses</span><span className="mono">IndexedDB (local)</span></div>
          <div className="flex justify-between"><span>AI cache</span><span className="mono">24-hour TTL</span></div>
          <div className="flex justify-between"><span>Max upload size</span><span className="mono">10 MB</span></div>
          <div className="flex justify-between"><span>Rate limit</span><span className="mono">15 req/min</span></div>
          <button
            onClick={clearLocal}
            className="clay-btn mt-3 flex items-center gap-2 rounded-md px-3 py-2 text-[12px]"
            style={{ color: "#f87171", borderColor: "rgba(248,113,113,0.3)" }}
          >
            <Trash2 size={12} /> Clear all local data
          </button>
          {cacheCleared && (
            <div className="text-[11px]" style={{ color: "var(--accent-green)" }}>
              ✓ Cleared. Reload to see effect.
            </div>
          )}
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center gap-2 mb-3">
          <SettingsIcon size={14} style={{ color: "var(--accent-cyan)" }} />
          <span className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-2)" }}>About</span>
        </div>
        <div className="glass glass-md p-4 text-[12px] space-y-2" style={{ color: "var(--text-2)" }}>
          <div className="flex justify-between"><span>Version</span><span className="mono">SatQuery 1.0</span></div>
          <div className="flex justify-between"><span>Team</span><span>DELVE</span></div>
          <div className="flex justify-between"><span>Hackathon</span><span>SIH 2026 · ISRO</span></div>
          <div className="flex justify-between"><span>AI Model</span><span className="mono">gemini-3.6-flash</span></div>
          <div className="flex justify-between"><span>Imagery</span><span>Esri · NASA GIBS · OSM</span></div>
        </div>
      </section>
    </div>
  );
}