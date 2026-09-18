// frontend/components/pages/Reports.tsx
"use client";
import { useEffect, useState } from "react";
import { FileText, Download } from "lucide-react";
import { listAnalyses, type SavedAnalysis } from "@/lib/storage";
import { exportPDF } from "@/lib/pdf";

export function Reports() {
  const [items, setItems] = useState<SavedAnalysis[]>([]);

  useEffect(() => {
    listAnalyses().then(setItems);
  }, []);

  return (
    <div className="glass glass-lg mx-auto max-w-4xl p-6">
      <div className="flex items-center gap-2">
        <FileText size={20} style={{ color: "var(--accent-cyan)" }} />
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
      </div>
      <p className="mt-1 text-[13px]" style={{ color: "var(--text-2)" }}>
        Download professional PDF reports of any saved analysis — with executive summary, percentages, evidence, and images.
      </p>

      {items.length === 0 ? (
        <div className="glass glass-md mt-8 flex flex-col items-center gap-3 p-10">
          <FileText size={28} style={{ color: "var(--text-3)" }} />
          <div className="text-[13px]" style={{ color: "var(--text-2)" }}>
            No reports yet — save an analysis first.
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((a) => (
            <div key={a.id} className="glass glass-md glass-hover flex items-center gap-4 p-4">
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium truncate">{a.query}</div>
                <div className="mt-1 flex flex-wrap gap-3 text-[11px]" style={{ color: "var(--text-3)" }}>
                  <span>{new Date(a.createdAt).toLocaleString()}</span>
                  <span className="mono">{a.response.intent}</span>
                  {a.location?.name && <span>📍 {a.location.name}</span>}
                </div>
              </div>
              <button
                suppressHydrationWarning
                onClick={() =>
                  exportPDF({
                    query: a.query,
                    response: a.response,
                    location: a.location?.name,
                    beforeImage: a.images?.before,
                    afterImage: a.images?.after,
                    singleImage: a.images?.single,
                  })
                }
                className="clay-btn flex items-center gap-1.5 rounded-md px-3 py-2 text-[12px]"
                style={{
                  background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))",
                  color: "white",
                }}
              >
                <Download size={12} /> PDF
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}