// frontend/components/pages/DisasterDetection.tsx
"use client";
import { useState } from "react";
import {
  AlertTriangle, Waves, Flame, Wind, Snowflake, MapPin, Sparkles,
  Bookmark, Download, Loader2, Percent, Database, Calendar, Gauge,
} from "lucide-react";
import { analyze, type AnalysisResponse } from "@/lib/api";
import { saveAnalysis } from "@/lib/storage";
import { exportPDF } from "@/lib/pdf";

const DISASTERS = [
  { id: "flood", label: "Flood", icon: Waves, color: "#3b82f6", desc: "Water expansion, inundated zones, affected agriculture." },
  { id: "wildfire", label: "Wildfire", icon: Flame, color: "#f97316", desc: "Burn scars, active fire, vegetation loss." },
  { id: "cyclone", label: "Cyclone", icon: Wind, color: "#a855f7", desc: "Cloud patterns, damage proxy, wind swath." },
  { id: "ice", label: "Ice / Glacier", icon: Snowflake, color: "#e0f2fe", desc: "Ice extent change, glacier retreat indicators." },
  { id: "drought", label: "Drought", icon: AlertTriangle, color: "#eab308", desc: "Vegetation stress, soil moisture proxy." },
];

export function DisasterDetection() {
  const [disaster, setDisaster] = useState<string | null>(null);
  const [location, setLocation] = useState("Rajahmundry");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!disaster || !location.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const type = DISASTERS.find((d) => d.id === disaster);
      const res = await analyze({
        query: `Analyze ${type?.label} impact in ${location}. Report percentage of affected area, affected agriculture, and any detected disaster signature. Use latest available satellite data.`,
        region: { name: location, type: "city" },
        location: { lat: 0, lng: 0, name: location },
      });
      setResult(res);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!result || !disaster) return;
    await saveAnalysis({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
      kind: "disaster",
      query: `${DISASTERS.find((d) => d.id === disaster)?.label} in ${location}`,
      payload: { query: `${disaster} in ${location}` },
      response: result,
      location: { lat: 0, lng: 0, name: location },
    });
    alert("✓ Saved to Saved Analyses");
  }

  function download() {
    if (!result || !disaster) return;
    exportPDF({
      query: `${DISASTERS.find((d) => d.id === disaster)?.label} in ${location}`,
      response: result,
      location,
      region: location,
      kind: "disaster",
    });
  }

  return (
    <div className="glass glass-lg mx-auto max-w-4xl p-6">
      <div className="flex items-center gap-2">
        <AlertTriangle size={20} style={{ color: "var(--accent-orange)" }} />
        <h1 className="text-2xl font-semibold tracking-tight">Disaster Detection</h1>
      </div>
      <p className="mt-1 text-[13px]" style={{ color: "var(--text-2)" }}>
        Pick a disaster type + location. SatQuery analyzes real satellite data and reports affected area, agriculture, and infrastructure.
      </p>

      {/* Location input */}
      <div className="mt-5">
        <label className="text-[11px] uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
          Location
        </label>
        <div
          className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2"
          style={{ border: "1px solid var(--glass-border)" }}
        >
          <MapPin size={13} style={{ color: "var(--accent-cyan)" }} />
          <input
            suppressHydrationWarning
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Any place — Rajahmundry, Chennai, Kerala…"
            className="flex-1 bg-transparent text-[13px] outline-none"
            style={{ color: "var(--text-1)" }}
          />
        </div>
      </div>

      {/* Disaster types */}
      <div className="mt-5">
        <label className="text-[11px] uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
          Disaster Type
        </label>
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          {DISASTERS.map((d) => (
            <button
              key={d.id}
              suppressHydrationWarning
              onClick={() => setDisaster(d.id)}
              className="glass glass-md glass-hover clay-btn flex items-start gap-3 p-4 text-left transition-all"
              style={{
                borderColor: disaster === d.id ? d.color : "var(--glass-border)",
                boxShadow: disaster === d.id ? `0 0 24px ${d.color}55` : undefined,
              }}
            >
              <d.icon size={20} style={{ color: d.color, flexShrink: 0 }} />
              <div>
                <div className="text-[14px] font-semibold">{d.label}</div>
                <div className="mt-1 text-[12px]" style={{ color: "var(--text-2)" }}>
                  {d.desc}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Run button */}
      <button
        suppressHydrationWarning
        disabled={!disaster || !location.trim() || loading}
        onClick={run}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg py-3 text-[13px] font-medium transition-all disabled:opacity-40 hover:shadow-[0_0_24px_rgba(34,211,238,0.5)]"
        style={{
          background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))",
          color: "white",
        }}
      >
        {loading ? (
          <>
            <Loader2 size={14} className="animate-spin" /> Analyzing…
          </>
        ) : (
          <>
            <Sparkles size={14} /> Analyze {disaster ? DISASTERS.find((d) => d.id === disaster)?.label : ""} in {location}
          </>
        )}
      </button>

      {error && (
        <div
          className="mt-4 rounded-lg p-3 text-[12px]"
          style={{
            background: "rgba(248,113,113,0.1)",
            border: "1px solid rgba(248,113,113,0.3)",
            color: "#fca5a5",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-6 space-y-4">
          <div className="glass glass-md p-4">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles size={13} style={{ color: "var(--accent-cyan)" }} />
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-2)" }}>
                AI Analysis
              </span>
            </div>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-1)", whiteSpace: "pre-wrap" }}>
              {result.answer}
            </p>
          </div>

          {result.stats && result.stats.length > 0 && (
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {result.stats.map((s, i) => (
                <div key={i} className="glass glass-sm p-3">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                    <Percent size={10} /> {s.layer}
                  </div>
                  <div className="mt-1 text-[18px] font-semibold" style={{ color: "var(--accent-cyan)" }}>
                    {s.percentage.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="glass glass-md p-4 space-y-1.5">
            {result.evidence.source && (
              <EvidenceRow icon={Database} label="Source" value={result.evidence.source} />
            )}
            {result.evidence.date && (
              <EvidenceRow icon={Calendar} label="Date" value={result.evidence.date} />
            )}
            {result.evidence.confidence != null && (
              <EvidenceRow icon={Gauge} label="Confidence" value={`${result.evidence.confidence}%`} />
            )}
          </div>

          <div className="flex gap-2">
            <button
              suppressHydrationWarning
              onClick={save}
              className="glass glass-sm clay-btn flex items-center gap-1.5 px-3 py-2 text-[12px]"
              style={{ color: "var(--accent-cyan)" }}
            >
              <Bookmark size={12} /> Save
            </button>
            <button
              suppressHydrationWarning
              onClick={download}
              className="glass glass-sm clay-btn flex items-center gap-1.5 px-3 py-2 text-[12px]"
              style={{ color: "var(--accent-cyan)" }}
            >
              <Download size={12} /> PDF
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 glass glass-sm p-3 text-[11px]" style={{ color: "var(--text-3)" }}>
        <strong style={{ color: "var(--text-2)" }}>Note:</strong> SatQuery detects actual events from satellite imagery. Predicted risk requires hydrodynamic or climatological modeling — labeled separately when available.
      </div>
    </div>
  );
}

function EvidenceRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 text-[11px]">
      <Icon size={11} />
      <span style={{ color: "var(--text-3)", minWidth: 68 }}>{label}</span>
      <span className="flex-1" style={{ color: "var(--text-1)" }}>{value}</span>
    </div>
  );
}