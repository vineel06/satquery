// frontend/components/ChatPanel.tsx
"use client";
import { useState, useRef, useEffect } from "react";
import {
  Send, Sparkles, AlertCircle, Database, Calendar, Gauge, X, Percent,
  Bookmark, Download, ImagePlus,
} from "lucide-react";
import { analyze, type AnalysisResponse } from "@/lib/api";
import { saveAnalysis } from "@/lib/storage";
import { exportPDF } from "@/lib/pdf";

interface Msg {
  role: "user" | "assistant";
  content: string;
  meta?: AnalysisResponse;
  image?: string;
}

export function ChatPanel({
  imageBase64,
  imageBeforeBase64,
  imageAfterBase64,
  location,
  bounds,
  region,
  onResponse,
  externalQuery,
  onLocationDetected,
  onCollapse,
  onImageUpload,
}: {
  imageBase64?: string;
  imageBeforeBase64?: string;
  imageAfterBase64?: string;
  location?: { lat: number; lng: number; name?: string };
  bounds?: [number, number, number, number];
  region?: { name: string; type: string };
  onResponse?: (r: AnalysisResponse) => void;
  externalQuery?: string;
  onLocationDetected?: (place: string) => void;
  onCollapse?: () => void;
  onImageUpload?: (b64: string, mime: string) => void;
}) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi, I'm SatQuery. Upload a satellite image or ask about any location. I'll analyze water, vegetation, ice, floods, urban growth — with real percentages.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [stagedImage, setStagedImage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastExternal = useRef<string | undefined>(undefined);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (externalQuery && externalQuery !== lastExternal.current) {
      lastExternal.current = externalQuery;
      send(externalQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalQuery]);

  function handleFile(f: File) {
    if (f.size > 10 * 1024 * 1024) {
      alert("Max 10 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setStagedImage(dataUrl);
      onImageUpload?.(dataUrl.split(",")[1], f.type);
    };
    reader.readAsDataURL(f);
  }

  async function send(q: string) {
    if (!q.trim() || loading) return;
    setMessages((m) => [
      ...m,
      { role: "user", content: q, image: stagedImage ?? undefined },
    ]);
    setInput("");
    setLoading(true);

    try {
      const res = await analyze({
        query: q,
        imageBase64: imageBase64 ?? stagedImage?.split(",")[1],
        imageMimeType: "image/png",
        imageBeforeBase64,
        imageAfterBase64,
        location,
        bounds,
        region,
        conversationHistory: messages.slice(-6).map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });
      setMessages((m) => [...m, { role: "assistant", content: res.answer, meta: res }]);
      onResponse?.(res);

      const placeMatch = q.match(
        /\b(?:in|near|at|around|of|about)\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)/,
      );
      if (placeMatch && onLocationDetected) {
        onLocationDetected(placeMatch[1]);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      const friendly =
        msg.includes("503") || msg.includes("overloaded") || msg.includes("UNAVAILABLE")
          ? "⚠️ SatQuery AI servers are momentarily busy. Try again in 10 seconds."
          : msg.includes("429")
          ? "⚠️ Rate limit hit. Wait 30 seconds."
          : `⚠️ ${msg}`;
      setMessages((m) => [...m, { role: "assistant", content: friendly }]);
    } finally {
      setLoading(false);
      setStagedImage(null);
    }
  }

  async function saveMsg(query: string, res: AnalysisResponse, image?: string) {
    await saveAnalysis({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
      kind: "chat",
      query,
      payload: { query },
      response: res,
      location,
      region,
      images: { single: image },
    });
    setMessages((m) => [
      ...m,
      { role: "assistant", content: "✓ Saved to Saved Analyses." },
    ]);
  }

  return (
    <div className="glass flex h-full flex-col" style={{ borderRadius: 0 }}>
      <div
        className="flex items-center gap-2 border-b px-4 py-3"
        style={{ borderColor: "var(--glass-border)" }}
      >
        <div
          className="flex h-7 w-7 items-center justify-center rounded-md"
          style={{
            background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))",
            boxShadow: "0 0 12px rgba(34,211,238,0.5)",
          }}
        >
          <Sparkles size={13} color="white" />
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-medium">SatQuery AI</div>
          <div className="text-[10px] mono" style={{ color: "var(--text-3)" }}>
            gemini-3.6-flash
          </div>
        </div>
        <span
          className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px]"
          style={{ background: "rgba(74,222,128,0.12)", color: "var(--accent-green)" }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
          online
        </span>
        {onCollapse && (
          <button
            suppressHydrationWarning
            onClick={onCollapse}
            className="rounded-md p-1 transition-colors hover:bg-white/5"
            style={{ color: "var(--text-3)" }}
            title="Collapse chat"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`mb-4 ${m.role === "user" ? "ml-auto max-w-[85%]" : "max-w-full"}`}
          >
            {m.image && (
              <div className="mb-2 ml-auto max-w-[260px] overflow-hidden rounded-lg border border-cyan-400/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.image} alt="uploaded" className="w-full" />
              </div>
            )}
            <div
              className={`rounded-xl px-3 py-2 text-[13px] leading-relaxed ${
                m.role === "user" ? "ml-auto" : ""
              }`}
              style={{
                background:
                  m.role === "user"
                    ? "rgba(34,211,238,0.12)"
                    : "rgba(255,255,255,0.03)",
                border: `1px solid ${
                  m.role === "user" ? "rgba(34,211,238,0.25)" : "var(--glass-border)"
                }`,
                color: "var(--text-1)",
                whiteSpace: "pre-wrap",
              }}
            >
              {m.content}
            </div>

            {m.meta?.stats && m.meta.stats.length > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {m.meta.stats.map((s, j) => (
                  <div
                    key={j}
                    className="glass glass-sm flex items-center gap-2 p-2"
                    style={{ borderRadius: 10 }}
                  >
                    <Percent size={11} style={{ color: "var(--accent-cyan)" }} />
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-[10px] uppercase tracking-wider"
                        style={{ color: "var(--text-3)" }}
                      >
                        {s.layer}
                      </div>
                      <div className="text-[15px] font-semibold">
                        {s.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {m.meta && (
              <div className="mt-2 space-y-1.5">
                {m.meta.evidence.source && (
                  <Evidence icon={Database} label="Source" value={m.meta.evidence.source} />
                )}
                {m.meta.evidence.date && (
                  <Evidence icon={Calendar} label="Date" value={m.meta.evidence.date} />
                )}
                {m.meta.evidence.confidence != null && (
                  <Evidence
                    icon={Gauge}
                    label="Confidence"
                    value={`${m.meta.evidence.confidence}%`}
                  />
                )}
                {m.meta.evidence.limitations && (
                  <Evidence
                    icon={AlertCircle}
                    label="Limitations"
                    value={m.meta.evidence.limitations}
                  />
                )}
              </div>
            )}

            {m.meta && m.role === "assistant" && (
              <div className="mt-2 flex gap-1.5">
                <button
                  suppressHydrationWarning
                  onClick={() => {
                    const q = messages[i - 1]?.content ?? "Analysis";
                    const img = messages[i - 1]?.image;
                    saveMsg(q, m.meta!, img);
                  }}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] transition-all hover:bg-cyan-500/15"
                  style={{
                    background: "rgba(34,211,238,0.08)",
                    color: "var(--accent-cyan)",
                    border: "1px solid rgba(34,211,238,0.2)",
                  }}
                >
                  <Bookmark size={11} /> Save
                </button>
                <button
                  suppressHydrationWarning
                  onClick={() => {
                    const q = messages[i - 1]?.content ?? "Analysis";
                    exportPDF({
                      query: q,
                      response: m.meta!,
                      location: location?.name,
                      region: region?.name,
                      singleImage: messages[i - 1]?.image,
                    });
                  }}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] transition-all hover:bg-cyan-500/15"
                  style={{
                    background: "rgba(34,211,238,0.08)",
                    color: "var(--accent-cyan)",
                    border: "1px solid rgba(34,211,238,0.2)",
                  }}
                >
                  <Download size={11} /> PDF
                </button>
              </div>
            )}

            {m.meta?.suggestions && m.meta.suggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {m.meta.suggestions.map((s, j) => (
                  <button
                    key={j}
                    suppressHydrationWarning
                    onClick={() => send(s)}
                    className="rounded-md px-2 py-1 text-[11px] transition-all hover:bg-cyan-500/15"
                    style={{
                      background: "rgba(34,211,238,0.08)",
                      color: "var(--accent-cyan)",
                      border: "1px solid rgba(34,211,238,0.2)",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div
            className="flex items-center gap-2 py-2 text-[12px]"
            style={{ color: "var(--text-3)" }}
          >
            <div className="flex gap-1">
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400"
                style={{ animationDelay: "300ms" }}
              />
            </div>
            Analyzing...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {stagedImage && (
        <div className="border-t px-3 pt-2" style={{ borderColor: "var(--glass-border)" }}>
          <div className="flex items-center gap-2 rounded-lg bg-cyan-500/10 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={stagedImage} alt="staged" className="h-10 w-10 rounded object-cover" />
            <span className="flex-1 text-[11px]" style={{ color: "var(--accent-cyan)" }}>
              Image attached — ask a question
            </span>
            <button
              suppressHydrationWarning
              onClick={() => setStagedImage(null)}
              className="rounded p-1 hover:bg-white/10"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      <div className="border-t p-3" style={{ borderColor: "var(--glass-border)" }}>
        <div className="flex items-end gap-2">
          <button
            suppressHydrationWarning
            onClick={() => fileRef.current?.click()}
            className="rounded-lg p-2 transition-all hover:bg-white/10"
            style={{ border: "1px solid var(--glass-border)", color: "var(--text-2)" }}
            title="Upload image"
          >
            <ImagePlus size={15} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <textarea
            suppressHydrationWarning
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Ask about any region — water %, vegetation %, flood risk..."
            rows={1}
            className="flex-1 resize-none rounded-lg bg-black/25 px-3 py-2 text-[13px] outline-none placeholder:text-[var(--text-3)] transition-all focus:ring-2 focus:ring-cyan-400/40"
            style={{
              border: "1px solid var(--glass-border)",
              color: "var(--text-1)",
              maxHeight: 120,
            }}
          />
          <button
            suppressHydrationWarning
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="rounded-lg p-2 transition-all disabled:opacity-40 hover:shadow-[0_0_20px_rgba(34,211,238,0.5)]"
            style={{
              background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))",
            }}
          >
            <Send size={15} color="white" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Evidence({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  value: string;
}) {
  return (
    <div
      className="flex items-start gap-2 rounded-md px-2 py-1 text-[11px]"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid var(--glass-border)",
      }}
    >
      <Icon size={11} />
      <span style={{ color: "var(--text-3)", minWidth: 68 }}>{label}</span>
      <span className="flex-1" style={{ color: "var(--text-1)" }}>
        {value}
      </span>
    </div>
  );
}