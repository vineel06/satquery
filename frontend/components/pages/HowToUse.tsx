// frontend/components/pages/HowToUse.tsx
"use client";
import { Sparkles, MapPin, Upload, MessageCircle, FileText, Layers } from "lucide-react";

const STEPS = [
  { icon: Sparkles, title: "1. New Analysis", desc: "Start a fresh analysis. Choose upload or a location." },
  { icon: MapPin, title: "2. Pick a Location", desc: "Search any place worldwide. The map flies there automatically." },
  { icon: Upload, title: "3. Upload (optional)", desc: "Drop a satellite image — new, old, or AI-generated. SatQuery analyzes it with vision AI." },
  { icon: MessageCircle, title: "4. Ask in Natural Language", desc: "Type: 'What % is water?', 'Show vegetation change', 'Assess flood impact'." },
  { icon: Layers, title: "5. Explore Layers", desc: "Toggle NASA GIBS, roads, ice, water, vegetation, agriculture, flood layers." },
  { icon: FileText, title: "6. Save & Export", desc: "Save any analysis. Download a beautiful PDF report in one click." },
];

export function HowToUse() {
  return (
    <div className="glass glass-lg mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold tracking-tight">How to Use SatQuery</h1>
      <p className="mt-1 text-[13px]" style={{ color: "var(--text-2)" }}>
        SatQuery lets you ask questions directly to Earth observation data. Here&apos;s the workflow.
      </p>

      <div className="mt-8 grid gap-3 md:grid-cols-2">
        {STEPS.map((s, i) => (
          <div key={i} className="glass glass-md glass-hover flex items-start gap-3 p-4">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{
                background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))",
                boxShadow: "0 4px 16px rgba(34,211,238,0.3)",
              }}
            >
              <s.icon size={16} color="white" />
            </div>
            <div>
              <div className="text-[13px] font-semibold">{s.title}</div>
              <div className="mt-1 text-[12px]" style={{ color: "var(--text-2)" }}>
                {s.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass glass-md mt-8 p-5">
        <div className="text-[13px] font-semibold mb-3">Try These Queries</div>
        <ul className="space-y-1.5 text-[12px]" style={{ color: "var(--text-2)" }}>
          <li>• &quot;What percentage of Chennai is water?&quot;</li>
          <li>• &quot;Show vegetation change in Amazon over 2 years&quot;</li>
          <li>• &quot;Assess flood damage in Rajahmundry&quot;</li>
          <li>• &quot;Ice extent in Antarctica this month&quot;</li>
          <li>• &quot;Compare urban growth in Delhi 2018 vs 2024&quot;</li>
        </ul>
      </div>

      <div className="glass glass-md mt-6 p-5">
        <div className="text-[13px] font-semibold mb-3">Honest Data Notes</div>
        <ul className="space-y-1.5 text-[12px]" style={{ color: "var(--text-2)" }}>
          <li>• Satellite imagery is <strong>not real-time</strong>. Each dataset has a revisit lag (MODIS daily, Sentinel-2 ~5 days, Landsat 16 days).</li>
          <li>• Land cover percentages are <strong>estimates</strong> from reference datasets (ESA WorldCover, Copernicus, MODIS). Not pixel-level computed.</li>
          <li>• &quot;Confidence&quot; is the AI&apos;s self-assessed certainty, <strong>not accuracy</strong>.</li>
          <li>• Ice &amp; glacier layers use NASA MODIS Snow Cover — visual extent, not ice mass.</li>
          <li>• Tsunami detection requires hydrodynamic modeling — SatQuery flags the intent and explains why it can&apos;t compute this without bathymetry data.</li>
        </ul>
      </div>
    </div>
  );
}