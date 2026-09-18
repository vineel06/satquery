// frontend/app/page.tsx
"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { MessageCircle, SquareDashedMousePointer, X, Ruler } from "lucide-react";
import { Sidebar, type NavId } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { MapView, type MapLayer, type SelectedRegion } from "@/components/MapView";
import { LayersPanel } from "@/components/LayersPanel";
import { ChatPanel } from "@/components/ChatPanel";
import { InsightsCards } from "@/components/InsightsCards";
import { UploadCompare } from "@/components/pages/UploadCompare";
import { DisasterDetection } from "@/components/pages/DisasterDetection";
import { SavedAnalyses } from "@/components/pages/SavedAnalyses";
import { Reports } from "@/components/pages/Reports";
import { HowToUse } from "@/components/pages/HowToUse";
import { Settings } from "@/components/pages/Settings";
import { INTENT_LAYERS } from "@/lib/intents";
import { geocode } from "@/lib/geocode";
import type { AnalysisResponse } from "@/lib/api";
import type * as maplibregl from "maplibre-gl";

const INITIAL_LAYERS: MapLayer[] = [
  { id: "gibs", label: "NASA GIBS Daily", color: "#22d3ee", visible: false },
  { id: "osm", label: "Roads & Labels", color: "#94a3b8", visible: false },
  { id: "ice", label: "Ice / Snow / Glacier", color: "#e0f2fe", visible: false },
  { id: "water", label: "Water Bodies", color: "#3b82f6", visible: false },
  { id: "vegetation", label: "Vegetation", color: "#4ade80", visible: false },
  { id: "builtup", label: "Built-up", color: "#ef4444", visible: false },
  { id: "agriculture", label: "Agriculture", color: "#eab308", visible: false },
  { id: "bareland", label: "Bare Land", color: "#a16207", visible: false },
  { id: "rivers", label: "Major Rivers", color: "#06b6d4", visible: false },
  { id: "pollution", label: "Pollution", color: "#a855f7", visible: false },
  { id: "flood", label: "Flood Extent", color: "#f97316", visible: false },
  { id: "anomalies", label: "Anomalies", color: "#f43f5e", visible: false },
];

const FALLBACK_CITIES: Record<string, [number, number]> = {
  rajahmundry: [81.8, 17.0],
  chennai: [80.27, 13.08],
  delhi: [77.21, 28.61],
  mumbai: [72.88, 19.08],
  tokyo: [139.69, 35.69],
  amazon: [-62.22, -3.47],
  antarctica: [0, -75],
  arctic: [0, 78],
};

export default function Home() {
  const [nav, setNav] = useState<NavId>("new");
  const [layers, setLayers] = useState<MapLayer[]>(INITIAL_LAYERS);
  const [locationLabel, setLocationLabel] = useState("Rajahmundry, India");
  const [date, setDate] = useState("2024-06-01");
  const [latest, setLatest] = useState<AnalysisResponse | null>(null);
  const [coordText, setCoordText] = useState("17.0000° N, 81.8000° E · zoom 10.0");
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [drawMode, setDrawMode] = useState(false);
  const [selection, setSelection] = useState<SelectedRegion | null>(null);
  const [singleImage, setSingleImage] = useState<{ b64: string; mime: string } | null>(null);

  const mapInstance = useRef<maplibregl.Map | null>(null);
  const pendingCenter = useRef<[number, number] | null>(null);

  const toggleLayer = (id: string) =>
    setLayers((ls) => ls.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)));

  const handleResponse = (r: AnalysisResponse) => {
    setLatest(r);
    const toEnable = new Set([...r.layers, ...(INTENT_LAYERS[r.intent] ?? [])]);
    setLayers((ls) => ls.map((l) => (toEnable.has(l.id) ? { ...l, visible: true } : l)));
  };

  const flyTo = useCallback((lng: number, lat: number, zoom = 10) => {
    const map = mapInstance.current;
    if (!map) {
      pendingCenter.current = [lng, lat];
      return;
    }
    map.flyTo({
      center: [lng, lat],
      zoom,
      duration: 2000,
      essential: true,
      curve: 1.42,
      speed: 1.2,
    });
  }, []);

  const handlePreviewLocation = useCallback((lng: number, lat: number) => {
    const map = mapInstance.current;
    if (!map) return;
    map.flyTo({
      center: [lng, lat],
      duration: 2500,
      essential: true,
      curve: 1.4,
      speed: 0.8,
    });
  }, []);

  const handleLocationChange = useCallback(
    async (loc: string) => {
      if (!loc.trim()) return;
      const key = loc.toLowerCase().trim();
      if (FALLBACK_CITIES[key]) {
        const [lng, lat] = FALLBACK_CITIES[key];
        flyTo(lng, lat, key === "antarctica" || key === "arctic" ? 5 : 10);
      }
      const r = await geocode(loc);
      if (r) {
        setLocationLabel(`${r.name}${r.admin1 ? ", " + r.admin1 : ""}, ${r.country}`);
        flyTo(r.lng, r.lat, 10);
      } else if (FALLBACK_CITIES[key]) {
        setLocationLabel(loc);
      }
    },
    [flyTo]
  );

  const handleRegionSelected = (r: SelectedRegion) => {
    setSelection(r);
    const map = mapInstance.current;
    if (!map) return;
    const [w, s, e, n] = r.bounds;
    map.fitBounds(
      [
        [w, s],
        [e, n],
      ],
      { padding: 60, duration: 1200 }
    );
  };

  const clearSelection = () => {
    setSelection(null);
    const map = mapInstance.current;
    if (!map) return;
    ["satquery-selection-fill", "satquery-selection-line", "satquery-selection-glow", "satquery-selection-vertices"].forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
    });
    ["satquery-selection", "satquery-selection-vertices"].forEach((id) => {
      if (map.getSource(id)) map.removeSource(id);
    });
  };

  const handleMapReady = useCallback((m: maplibregl.Map) => {
    mapInstance.current = m;
    m.on("move", () => {
      const c = m.getCenter();
      setCoordText(
        `${c.lat.toFixed(4)}° N, ${c.lng.toFixed(4)}° E · zoom ${m.getZoom().toFixed(1)}`
      );
    });
    if (pendingCenter.current) {
      const [lng, lat] = pendingCenter.current;
      pendingCenter.current = null;
      m.flyTo({ center: [lng, lat], zoom: 10, duration: 1800 });
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawMode(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isMapView = nav === "new";

  function renderPage() {
    switch (nav) {
      case "upload":
        return <UploadCompare onBack={() => setNav("new")} />;
      case "saved":
        return <SavedAnalyses />;
      case "disaster":
        return <DisasterDetection />;
      case "reports":
        return <Reports />;
      case "how":
        return <HowToUse />;
      case "settings":
        return <Settings />;
      default:
        return null;
    }
  }

  return (
    <div className="relative z-10 flex h-screen w-screen overflow-hidden">
      <Sidebar active={nav} onSelect={setNav} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          location={locationLabel}
          date={date}
          onLocationChange={handleLocationChange}
          onPreviewLocation={handlePreviewLocation}
          onDateChange={setDate}
        />

        {!isMapView && (
          <div className="min-h-0 flex-1 overflow-y-auto p-6">{renderPage()}</div>
        )}

        {isMapView && (
          <>
            <div
              className={`grid min-h-0 flex-1 grid-cols-1 gap-3 p-3 ${
                chatCollapsed ? "lg:grid-cols-[1fr_80px]" : "lg:grid-cols-[1fr_400px]"
              }`}
            >
              <div className="relative overflow-hidden" style={{ minHeight: 400 }}>
                <MapView
                  initialCenter={[81.8, 17.0]}
                  initialZoom={10}
                  layers={layers}
                  gibsDate={date}
                  drawMode={drawMode}
                  setDrawMode={setDrawMode}
                  onMapReady={handleMapReady}
                  onRegionSelected={handleRegionSelected}
                />

                <LayersPanel layers={layers} onToggle={toggleLayer} />

                <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
                  <button
                    suppressHydrationWarning
                    onClick={() => setDrawMode(!drawMode)}
                    className="glass glass-sm clay-btn flex items-center gap-2 px-3 py-2 text-[11px] font-medium transition-all"
                    style={{
                      color: drawMode ? "var(--accent-cyan)" : "var(--text-2)",
                      borderColor: drawMode ? "var(--accent-cyan)" : "var(--glass-border)",
                      boxShadow: drawMode ? "0 0 20px rgba(34,211,238,0.4)" : undefined,
                    }}
                  >
                    <SquareDashedMousePointer size={13} />
                    {drawMode ? "Drag on map…" : "Select Region"}
                  </button>

                  {selection && (
                    <>
                      <div
                        className="glass glass-sm flex items-center gap-1.5 px-3 py-2 text-[11px]"
                        style={{ color: "var(--accent-cyan)" }}
                      >
                        <Ruler size={12} />
                        {selection.areaKm2 > 1000
                          ? `${(selection.areaKm2 / 1000).toFixed(2)}k km²`
                          : `${selection.areaKm2.toFixed(1)} km²`}
                      </div>
                      <button
                        suppressHydrationWarning
                        onClick={clearSelection}
                        className="glass glass-sm clay-btn flex items-center gap-1.5 px-3 py-2 text-[11px]"
                        style={{ color: "var(--text-2)" }}
                      >
                        <X size={12} /> Clear
                      </button>
                    </>
                  )}
                </div>

                <div
                  className="glass glass-sm absolute bottom-3 left-3 z-10 px-3 py-1.5 text-[10px] mono"
                  style={{ color: "var(--text-2)" }}
                >
                  {coordText} · Esri
                </div>
              </div>

              {!chatCollapsed ? (
                <div className="glass min-h-[400px] overflow-hidden">
                  <ChatPanel
                    imageBase64={singleImage?.b64}
                    location={{ lat: 17.0, lng: 81.8, name: locationLabel }}
                    bounds={selection?.bounds}
                    region={{ name: locationLabel, type: "city" }}
                    onResponse={handleResponse}
                    onLocationDetected={handleLocationChange}
                    onCollapse={() => setChatCollapsed(true)}
                    onImageUpload={(b64, mime) => setSingleImage({ b64, mime })}
                  />
                </div>
              ) : (
                <button
                  suppressHydrationWarning
                  onClick={() => setChatCollapsed(false)}
                  className="glass glass-hover flex h-full min-h-[400px] flex-col items-center justify-center gap-3"
                  style={{ padding: 16 }}
                >
                  <MessageCircle size={28} style={{ color: "var(--accent-cyan)" }} />
                  <div
                    className="text-[11px] font-medium"
                    style={{ writingMode: "vertical-rl", color: "var(--text-2)" }}
                  >
                    SatQuery AI
                  </div>
                </button>
              )}
            </div>

            <div className="px-3 pb-3">
              <InsightsCards data={latest} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}