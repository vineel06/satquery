// frontend/components/pages/SavedAnalyses.tsx
"use client";
import { useEffect, useState } from "react";
import { Bookmark, Trash2, Download, ChevronDown, ChevronUp } from "lucide-react";
import { listAnalyses, deleteAnalysis, type SavedAnalysis } from "@/lib/storage";
import { exportPDF } from "@/lib/pdf";

const KIND_LABEL: Record<string, string> = {
  chat: "Chat",
  compare: "Compare",
  disaster: "Disaster",
  "single-upload": "Upload",
};

const KIND_COLOR: Record<string, string> = {
  chat: "var(--accent-cyan)",
  compare: "var(--accent-blue)",
  disaster: "var(--accent-orange)",
  "single-upload": "var(--accent-green)",
};

export function SavedAnalyses() {
  const [items, setItems] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    const list = await listAnalyses();
    setItems(list);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function remove(id: string) {
    await deleteAnalysis(id);
    refresh();
  }

  return (
    <div className="glass glass-lg mx-auto max-w-4xl p-6">
      <div className="flex items-center gap-2">
        <Bookmark size={20} style={{ color: "var(--accent-cyan)" }} />
        <h1 className="text-2xl font-semibold tracking-tight">Saved Analyses</h1>
      </div>
      <p className="mt-1 text-[13px]" style={{ color: "var(--text-2)" }}>
        Every analysis you saved — from chat, compare, disaster, upload. Stored locally in your browser.
      </p>

      {loading ? (
        <div className="mt-8 text-center text-[13px]" style={{ color: "var(--text-3)" }}>
          Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="glass glass-md mt-8 flex flex-col items-center gap-3 p-10">
          <Bookmark size={28} style={{ color: "var(--text-3)" }} />
          <div className="text-[13px]" style={{ color: "var(--text-2)" }}>
            No saved analyses yet.
          </div>
          <div className="text-[11px]" style={{ color: "var(--text-3)" }}>
            Save any analysis from chat, compare, or disaster detection.
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((a) => {
            const isOpen = expanded === a.id;
            const kind = a.kind ?? "chat";
            return (
              <div key={a.id} className="glass glass-md">
                <div
                  className="flex cursor-pointer items-start gap-4 p-4"
                  onClick={() => setExpanded(isOpen ? null : a.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
                        style={{
                          background: `${KIND_COLOR[kind]}22`,
                          color: KIND_COLOR[kind],
                          border: `1px solid ${KIND_COLOR[kind]}44`,
                        }}
                      >
                        {KIND_LABEL[kind]}
                      </span>
                      <span className="text-[11px] mono" style={{ color: "var(--text-3)" }}>
                        {a.response.intent}
                      </span>
                    </div>
                    <div className="mt-2 text-[13px] font-medium truncate">{a.query}</div>
                    <div className="mt-1 flex flex-wrap gap-3 text-[11px]" style={{ color: "var(--text-3)" }}>
                      <span>{new Date(a.createdAt).toLocaleString()}</span>
                      {a.location?.name && <span>📍 {a.location.name}</span>}
                    </div>
                    {!isOpen && (
                      <div className="mt-2 line-clamp-2 text-[12px]" style={{ color: "var(--text-2)" }}>
                        {a.response.answer}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t p-4" style={{ borderColor: "var(--glass-border)" }}>
                    {(a.images?.before || a.images?.after || a.images?.single) && (
                      <div className="mb-4 flex gap-3">
                        {a.images.single && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={a.images.single} alt="uploaded" className="h-24 rounded-md object-cover" />
                        )}
                        {a.images.before && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={a.images.before} alt="before" className="h-24 rounded-md object-cover" />
                        )}
                        {a.images.after && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={a.images.after} alt="after" className="h-24 rounded-md object-cover" />
                        )}
                      </div>
                    )}

                    {a.response.summary && (
                      <div className="mb-3 glass glass-sm p-3" style={{ borderLeft: "3px solid var(--accent-cyan)" }}>
                        <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--accent-cyan)" }}>
                          Summary
                        </div>
                        <div className="mt-1 text-[12px]" style={{ color: "var(--text-1)" }}>
                          {a.response.summary}
                        </div>
                      </div>
                    )}

                    <div className="text-[12px] leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-1)" }}>
                      {a.response.answer}
                    </div>

                    {a.response.stats && a.response.stats.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                        {a.response.stats.map((s, i) => (
                          <div key={i} className="glass glass-sm p-2">
                            <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                              {s.layer}
                            </div>
                            <div className="text-[15px] font-semibold" style={{ color: "var(--accent-cyan)" }}>
                              {s.percentage.toFixed(1)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap gap-3 text-[11px]" style={{ color: "var(--text-3)" }}>
                      {a.response.evidence.source && <span>Source: {a.response.evidence.source}</span>}
                      {a.response.evidence.date && <span>Date: {a.response.evidence.date}</span>}
                      {a.response.evidence.confidence != null && (
                        <span>Confidence: {a.response.evidence.confidence}%</span>
                      )}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        suppressHydrationWarning
                        onClick={(e) => {
                          e.stopPropagation();
                          exportPDF({
                            query: a.query,
                            response: a.response,
                            location: a.location?.name,
                            beforeImage: a.images?.before,
                            afterImage: a.images?.after,
                            singleImage: a.images?.single,
                          });
                        }}
                        className="glass glass-sm clay-btn flex items-center gap-1.5 px-3 py-1.5 text-[11px]"
                        style={{ color: "var(--accent-cyan)" }}
                      >
                        <Download size={11} /> PDF
                      </button>
                      <button
                        suppressHydrationWarning
                        onClick={(e) => {
                          e.stopPropagation();
                          remove(a.id);
                        }}
                        className="glass glass-sm clay-btn flex items-center gap-1.5 px-3 py-1.5 text-[11px]"
                        style={{ color: "#f87171" }}
                      >
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}