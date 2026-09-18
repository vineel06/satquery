export default function Loading() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "var(--bg-0)" }}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="relative h-24 w-24">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              border: "2px dashed rgba(34,211,238,0.5)",
              animation: "spin 6s linear infinite",
            }}
          />
          <div
            className="absolute inset-3 rounded-full"
            style={{
              border: "1px dashed rgba(59,130,246,0.4)",
              animation: "spin 9s linear infinite reverse",
            }}
          />
          <div
            className="absolute inset-6 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, #22d3ee 0%, #3b82f6 40%, #0a1020 100%)",
              boxShadow:
                "0 0 60px rgba(34,211,238,0.6), inset -10px -10px 30px rgba(0,0,0,0.7)",
            }}
          />
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold tracking-tight">SatQuery</div>
          <div className="mt-1 text-xs mono" style={{ color: "var(--text-3)" }}>
            Scanning Earth...
          </div>
        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}