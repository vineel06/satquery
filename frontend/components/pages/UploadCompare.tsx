// frontend/components/pages/UploadCompare.tsx
"use client";
import { useState, useRef } from "react";
import {
  Upload, X, Sparkles, ArrowLeft, Loader2, Bookmark, Download, Percent,
  Database, Calendar, Gauge,
} from "lucide-react";
import { analyze, type AnalysisResponse } from "@/lib/api";
import { saveAnalysis } from "@/lib/storage";
import { exportPDF } from "@/lib/pdf";

export function UploadCompare({ onBack }: { onBack: () => void }) {
  const [before, setBefore] = useState<string | null>(null);
  const [after, setAfter] = useState<string | null>(null);
  const [question, setQuestion] = useState(
    "Compare vegetation, water, and built-up area between these two images. What changed?",
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const beforeRef = useRef<HTMLInputElement>(null);
  const afterRef = useRef<HTMLInputElement>(null);

  const readFile = (file: File, set: (s: string | null) => void) => {
    if (file.size > 10 * 1024 * 1024) {
      alert("Max 10 MB");
      return;
    }
    const r = new FileReader();
    r.onload = (e) => set((e.target?.result as string) ?? null);
    r.readAsDataURL(file);
  };

  const PRESETS = [
    "Compare vegetation, water, and built-up area between these two images. What changed?",
    "Did vegetation decrease or increase? By how much percentage?",
    "Is there flood evidence in the AFTER image? Which areas are inundated?",
    "What percentage of each image is water? Did water expand?",
    "Describe the change in built-up / urban area between BEFORE and AFTER.",
  ];

  async function runAnalysis() {
    if (!before || !after) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await analyze({
        query: question,
        imageBeforeBase64: before.split(",")[1],
        imageAfterBase64: after.split(",")[1],
        region: { name: "Uploaded images", type: "custom" },
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
    if (!result) return;
    await saveAnalysis({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
      kind: "compare",
      query: question,
      payload: { query: question },
      response: result,
      images: { before: before ?? undefined, after: after ?? undefined },
    });
    alert("✓ Saved to Saved Analyses");
  }

  function download() {
    if (!result) return;
    exportPDF({
      query: question,
      response: result,
      kind: "compare",
      beforeImage: before ?? undefined,
      afterImage: after ?? undefined,
    });
  }

  return (
    <div className="glass glass-lg mx-auto max-w-5xl p-6">
      <button
        suppressHydrationWarning
        onClick={onBack}
        className="mb-4 flex items-center gap-1.5 text-[12px] transition-colors hover:text-cyan-400"
        style={{ color: "var(--text-3)" }}
      >
        <ArrowLeft size={13} /> Back to map
      </button>

      <h1 className="text-2xl font-semibold tracking-tight">Compare Images</h1>
      <p className="mt-1 text-[13px]" style={{ color: "var(--text-2)" }}>
        Upload a BEFORE and AFTER satellite image. SatQuery AI analyzes both and reports what changed — vegetation, water, floods, urban growth.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {[
          { label: "Before", state: before, set: setBefore, ref: beforeRef, color: "var(--accent-blue)" },
          { label: "After", state: after, set: setAfter, ref: afterRef, color: "var(--accent-cyan)" },
        ].map(({ label, state, set, ref, color }) => (
          <div key={label} className="glass glass-md">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color }}>
                {label}
              </span>
              {state && (
                <button
                  suppressHydrationWarning
                  onClick={() => set(null)}
                  className="rounded-md p-1 hover:bg-white/5"
                  style={{ color: "var(--text-3)" }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <div
              className="relative aspect-video cursor-pointer overflow-hidden rounded-lg border-dashed transition-colors hover:border-cyan-400/50"
              style={{ borderWidth: 2, borderColor: "var(--glass-border)" }}
              onClick={() => ref.current?.click()}
            >
              {state ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={state} alt={label} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2">
                  <Upload size={20} style={{ color: "var(--text-3)" }} />
                  <span className="text-[11px]" style={{ color: "var(--text-3)" }}>
                    Click to upload {label}
                  </span>
                </div>
              )}
            </div>
            <input
              ref={ref}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0], set)}
            />
          </div>
        ))}
      </div>

      <div className="mt-6">
        <label className="text-[11px] uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
          Question for SatQuery AI
        </label>
        <textarea
          suppressHydrationWarning
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          className="mt-2 w-full resize-none rounded-lg bg-black/25 px-3 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-cyan-400/40"
          style={{ border: "1px solid var(--glass-border)", color: "var(--text-1)" }}
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p}
              suppressHydrationWarning
              onClick={() => setQuestion(p)}
              className="rounded-md px-2 py-1 text-[11px] transition-all hover:bg-cyan-500/15"
              style={{
                background: "rgba(34,211,238,0.08)",
                color: "var(--accent-cyan)",
                border: "1px solid rgba(34,211,238,0.2)",
              }}
            >
              {p.length > 60 ? p.slice(0, 58) + "…" : p}
            </button>
          ))}
        </div>
      </div>

      <button
        suppressHydrationWarning
        disabled={!before || !after || loading}
        onClick={runAnalysis}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg py-3 text-[13px] font-medium transition-all disabled:opacity-40 hover:shadow-[0_0_24px_rgba(34,211,238,0.5)]"
        style={{
          background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))",
          color: "white",
        }}
      >
        {loading ? (
          <>
            <Loader2 size={14} className="animate-spin" /> Analyzing both images…
          </>
        ) : (
          <>
            <Sparkles size={14} /> Analyze with SatQuery AI
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

      {result && (
        <div className="mt-6 space-y-4">
          {result.summary && (
            <div className="glass glass-md p-4" style={{ borderLeft: "3px solid var(--accent-cyan)" }}>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--accent-cyan)" }}>
                Executive Summary
              </div>
              <p className="text-[13px]" style={{ color: "var(--text-1)" }}>
                {result.summary}
              </p>
            </div>
          )}

          <div className="glass glass-md p-4">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles size={13} style={{ color: "var(--accent-cyan)" }} />
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-2)" }}>
                Change Analysis
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