// frontend/components/pages/NewAnalysis.tsx
"use client";
import { Upload, MapPin, Sparkles } from "lucide-react";

export function NewAnalysis({
  onUpload,
  onPickLocation,
}: {
  onUpload: () => void;
  onPickLocation: () => void;
}) {
  return (
    <div className="glass glass-lg mx-auto max-w-3xl p-6">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{
            background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))",
            boxShadow: "0 4px 20px rgba(34,211,238,0.4)",
          }}
        >
          <Sparkles size={16} color="white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">New Analysis</h1>
          <p className="text-[12px]" style={{ color: "var(--text-2)" }}>
            Upload a satellite image or pick a location.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <button
          suppressHydrationWarning
          onClick={onUpload}
          className="glass glass-md glass-hover clay-btn flex flex-col items-start gap-3 p-5 text-left"
        >
          <Upload size={20} style={{ color: "var(--accent-cyan)" }} />
          <div className="text-[14px] font-semibold">Upload Image</div>
          <div className="text-[12px]" style={{ color: "var(--text-2)" }}>
            New, old, or AI-generated. SatQuery AI analyzes it with vision.
          </div>
        </button>

        <button
          suppressHydrationWarning
          onClick={onPickLocation}
          className="glass glass-md glass-hover clay-btn flex flex-col items-start gap-3 p-5 text-left"
        >
          <MapPin size={20} style={{ color: "var(--accent-green)" }} />
          <div className="text-[14px] font-semibold">Pick Location</div>
          <div className="text-[12px]" style={{ color: "var(--text-2)" }}>
            Type any place worldwide. The map flies there.
          </div>
        </button>
      </div>

      <div className="glass glass-sm mt-6 p-4 text-[12px]" style={{ color: "var(--text-3)" }}>
        <strong style={{ color: "var(--text-2)" }}>Tip:</strong> Just type your question in the chat on the right. SatQuery will auto-detect the location and analysis type.
      </div>
    </div>
  );
}