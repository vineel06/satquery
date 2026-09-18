// frontend/components/Sidebar.tsx
"use client";
import { useState } from "react";
import {
  Sparkles, Upload, Bookmark, AlertTriangle, FileText, HelpCircle, Settings,
  ChevronLeft, ChevronRight,
} from "lucide-react";

const ITEMS = [
  { id: "new", label: "New Analysis", icon: Sparkles },
  { id: "upload", label: "Upload & Compare", icon: Upload },
  { id: "saved", label: "Saved Analyses", icon: Bookmark },
  { id: "disaster", label: "Disaster Detection", icon: AlertTriangle },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "how", label: "How to Use", icon: HelpCircle },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

export type NavId = typeof ITEMS[number]["id"];

export function Sidebar({
  active,
  onSelect,
}: {
  active: NavId;
  onSelect: (id: NavId) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <aside
      className={`glass relative z-20 flex h-full flex-col transition-all duration-300 ${
        collapsed ? "w-[68px]" : "w-[240px]"
      }`}
      style={{ borderRadius: 0, borderRight: "1px solid var(--glass-border)" }}
    >
      <div className="flex items-center gap-3 px-4 py-5">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))",
            boxShadow: "0 4px 20px rgba(34,211,238,0.4)",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="white"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="3" />
            <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-30 12 12)" />
            <circle cx="19" cy="8" r="1.5" fill="white" />
          </svg>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-[16px] font-semibold tracking-tight">SatQuery</div>
            <div className="truncate text-[10px] mono" style={{ color: "var(--text-3)" }}>
              Team DELVE
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          const isHovered = hovered === id;
          return (
            <button
              key={id}
              suppressHydrationWarning
              onClick={() => onSelect(id)}
              onMouseEnter={() => setHovered(id)}
              onMouseLeave={() => setHovered(null)}
              className="group relative mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] transition-all duration-200"
              style={{
                background: isActive
                  ? "rgba(34,211,238,0.12)"
                  : isHovered
                  ? "rgba(34,211,238,0.06)"
                  : "transparent",
                color: isActive
                  ? "var(--accent-cyan)"
                  : isHovered
                  ? "var(--text-1)"
                  : "var(--text-2)",
                borderLeft: isActive
                  ? "2px solid var(--accent-cyan)"
                  : "2px solid transparent",
                boxShadow: isActive
                  ? "inset 0 0 20px rgba(34,211,238,0.1), 0 0 12px rgba(34,211,238,0.15)"
                  : isHovered
                  ? "inset 0 0 12px rgba(34,211,238,0.06), 0 0 8px rgba(34,211,238,0.1)"
                  : "none",
              }}
              title={collapsed ? label : undefined}
            >
              <Icon size={16} className="shrink-0" />
              {!collapsed && <span className="truncate font-medium">{label}</span>}
            </button>
          );
        })}
      </nav>

      <button
        suppressHydrationWarning
        onClick={() => setCollapsed((c) => !c)}
        className="m-2 flex items-center justify-center rounded-lg py-2 transition-all hover:bg-white/5 hover:shadow-[0_0_12px_rgba(34,211,238,0.2)]"
        style={{ color: "var(--text-3)" }}
        aria-label="Collapse sidebar"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}