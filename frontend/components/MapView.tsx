// frontend/components/MapView.tsx
"use client";
import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import * as turf from "@turf/turf";

export interface MapLayer {
  id: string;
  label: string;
  color: string;
  visible: boolean;
}

export interface SelectedRegion {
  bounds: [number, number, number, number];
  center: [number, number];
  areaKm2: number;
}

export function MapView({
  initialCenter = [81.8, 17.0] as [number, number],
  initialZoom = 10,
  layers,
  gibsDate = "2024-06-01",
  onMapReady,
  onRegionSelected,
  drawMode,
  setDrawMode,
}: {
  initialCenter?: [number, number];
  initialZoom?: number;
  layers: MapLayer[];
  gibsDate?: string;
  onMapReady?: (map: maplibregl.Map) => void;
  onRegionSelected?: (r: SelectedRegion) => void;
  drawMode: boolean;
  setDrawMode: (v: boolean) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const readyRef = useRef(false);

  useEffect(() => {
    if (!container.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: container.current,
      style: {
        version: 8,
        sources: {
          esri: {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            maxzoom: 19,
            attribution: "© Esri, Maxar, Earthstar Geographics",
          },
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            maxzoom: 17,
            attribution: "© OpenStreetMap",
          },
          gibs: {
            type: "raster",
            tiles: [
              `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${gibsDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
            ],
            tileSize: 256,
            maxzoom: 9,
            attribution: "NASA GIBS / MODIS",
          },
          gibsSnow: {
            type: "raster",
            tiles: [
              `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Snow_Cover/default/${gibsDate}/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png`,
            ],
            tileSize: 256,
            maxzoom: 8,
            attribution: "NASA GIBS / MODIS Snow",
          },
        },
        layers: [
          {
            id: "esri-layer",
            type: "raster",
            source: "esri",
            minzoom: 0,
            maxzoom: 19,
          },
          {
            id: "osm-layer",
            type: "raster",
            source: "osm",
            minzoom: 0,
            maxzoom: 17,
            layout: { visibility: "none" },
            paint: { "raster-opacity": 0.7 },
          },
          {
            id: "gibs-layer",
            type: "raster",
            source: "gibs",
            minzoom: 0,
            maxzoom: 9,
            layout: { visibility: "none" },
            paint: { "raster-opacity": 0.9 },
          },
          {
            id: "gibs-snow-layer",
            type: "raster",
            source: "gibsSnow",
            minzoom: 0,
            maxzoom: 8,
            layout: { visibility: "none" },
            paint: { "raster-opacity": 0.85 },
          },
        ],
      },
      center: initialCenter,
      zoom: initialZoom,
      attributionControl: false,
      maxCanvasSize: [8192, 8192],
    });

    map.addControl(
      new maplibregl.NavigationControl({
        showCompass: true,
        visualizePitch: true,
      }),
      "top-right"
    );
    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right"
    );

    map.on("load", () => {
      mapRef.current = map;
      readyRef.current = true;
      onMapReady?.(map);
    });

    setTimeout(() => map.resize(), 300);

    return () => {
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current || !map.isStyleLoaded()) return;
    const toggle = (id: string, visible: boolean) => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
      }
    };
    const vis = (id: string) => layers.find((l) => l.id === id)?.visible ?? false;
    toggle("gibs-layer", vis("gibs"));
    toggle("gibs-snow-layer", vis("ice") || vis("snow") || vis("glacier"));
    toggle("osm-layer", vis("osm"));
  }, [layers]);

  // Draw rectangle with clear visual
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;

    if (!drawMode) {
      map.getCanvas().style.cursor = "";
      map.dragPan.enable();
      if (map.getSource("satquery-draw-preview")) {
        if (map.getLayer("satquery-draw-fill"))
          map.removeLayer("satquery-draw-fill");
        if (map.getLayer("satquery-draw-line"))
          map.removeLayer("satquery-draw-line");
        map.removeSource("satquery-draw-preview");
      }
      return;
    }

    map.getCanvas().style.cursor = "crosshair";
    map.dragPan.disable();

    let start: maplibregl.LngLat | null = null;

    const updatePreview = (a: maplibregl.LngLat, b: maplibregl.LngLat) => {
      const ring: [number, number][] = [
        [a.lng, a.lat],
        [b.lng, a.lat],
        [b.lng, b.lat],
        [a.lng, b.lat],
        [a.lng, a.lat],
      ];
      const feat: GeoJSON.Feature<GeoJSON.Polygon> = {
        type: "Feature",
        properties: {},
        geometry: { type: "Polygon", coordinates: [ring] },
      };
      if (map.getSource("satquery-draw-preview")) {
        (map.getSource("satquery-draw-preview") as maplibregl.GeoJSONSource).setData(
          feat
        );
      } else {
        map.addSource("satquery-draw-preview", { type: "geojson", data: feat });
        map.addLayer({
          id: "satquery-draw-fill",
          type: "fill",
          source: "satquery-draw-preview",
          paint: { "fill-color": "#22d3ee", "fill-opacity": 0.25 },
        });
        map.addLayer({
          id: "satquery-draw-line",
          type: "line",
          source: "satquery-draw-preview",
          paint: {
            "line-color": "#22d3ee",
            "line-width": 3,
            "line-dasharray": [3, 2],
          },
        });
      }
    };

    const onDown = (e: maplibregl.MapMouseEvent) => {
      if (e.originalEvent.button !== 0) return;
      start = e.lngLat;
      updatePreview(start, start);
    };

    const onMove = (e: maplibregl.MapMouseEvent) => {
      if (!start) return;
      updatePreview(start, e.lngLat);
    };

    const onUp = (e: maplibregl.MapMouseEvent) => {
      if (!start) return;
      const a = start;
      const b = e.lngLat;
      start = null;

      const bounds: [number, number, number, number] = [
        Math.min(a.lng, b.lng),
        Math.min(a.lat, b.lat),
        Math.max(a.lng, b.lng),
        Math.max(a.lat, b.lat),
      ];

      const dLng = bounds[2] - bounds[0];
      const dLat = bounds[3] - bounds[1];
      if (dLng < 0.005 || dLat < 0.005) {
        if (map.getSource("satquery-draw-preview")) {
          if (map.getLayer("satquery-draw-fill"))
            map.removeLayer("satquery-draw-fill");
          if (map.getLayer("satquery-draw-line"))
            map.removeLayer("satquery-draw-line");
          map.removeSource("satquery-draw-preview");
        }
        return;
      }

      const cx = (bounds[0] + bounds[2]) / 2;
      const cy = (bounds[1] + bounds[3]) / 2;

      const poly = turf.polygon([
        [
          [bounds[0], bounds[1]],
          [bounds[2], bounds[1]],
          [bounds[2], bounds[3]],
          [bounds[0], bounds[3]],
          [bounds[0], bounds[1]],
        ],
      ]);
      const areaKm2 = turf.area(poly) / 1_000_000;

      // Remove old committed selection
      if (map.getSource("satquery-selection")) {
        if (map.getLayer("satquery-selection-fill"))
          map.removeLayer("satquery-selection-fill");
        if (map.getLayer("satquery-selection-line"))
          map.removeLayer("satquery-selection-line");
        if (map.getLayer("satquery-selection-glow"))
          map.removeLayer("satquery-selection-glow");
        if (map.getLayer("satquery-selection-vertices"))
          map.removeLayer("satquery-selection-vertices");
        map.removeSource("satquery-selection");
      }

      // Add committed selection — 4 layers for high visibility
      map.addSource("satquery-selection", { type: "geojson", data: poly });

      // Outer glow (thick translucent)
      map.addLayer({
        id: "satquery-selection-glow",
        type: "line",
        source: "satquery-selection",
        paint: {
          "line-color": "#22d3ee",
          "line-width": 8,
          "line-opacity": 0.35,
          "line-blur": 4,
        },
      });

      // Fill (subtle)
      map.addLayer({
        id: "satquery-selection-fill",
        type: "fill",
        source: "satquery-selection",
        paint: { "fill-color": "#22d3ee", "fill-opacity": 0.12 },
      });

      // Crisp border
      map.addLayer({
        id: "satquery-selection-line",
        type: "line",
        source: "satquery-selection",
        paint: {
          "line-color": "#22d3ee",
          "line-width": 2.5,
          "line-dasharray": [6, 3],
        },
      });

      // Vertex markers at the 4 corners
      const vertices: GeoJSON.FeatureCollection<GeoJSON.Point> = {
        type: "FeatureCollection",
        features: [
          [bounds[0], bounds[1]],
          [bounds[2], bounds[1]],
          [bounds[2], bounds[3]],
          [bounds[0], bounds[3]],
        ].map(([lng, lat]) => ({
          type: "Feature",
          properties: {},
          geometry: { type: "Point", coordinates: [lng, lat] },
        })),
      };
      if (!map.getSource("satquery-selection-vertices")) {
        map.addSource("satquery-selection-vertices", {
          type: "geojson",
          data: vertices,
        });
      } else {
        (
          map.getSource("satquery-selection-vertices") as maplibregl.GeoJSONSource
        ).setData(vertices);
      }
      map.addLayer({
        id: "satquery-selection-vertices",
        type: "circle",
        source: "satquery-selection-vertices",
        paint: {
          "circle-radius": 5,
          "circle-color": "#22d3ee",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      });

      onRegionSelected?.({ bounds, center: [cx, cy], areaKm2 });

      map.getCanvas().style.cursor = "";
      map.dragPan.enable();
      setDrawMode(false);
    };

    map.on("mousedown", onDown);
    map.on("mousemove", onMove);
    map.on("mouseup", onUp);

    return () => {
      map.off("mousedown", onDown);
      map.off("mousemove", onMove);
      map.off("mouseup", onUp);
    };
  }, [drawMode, onRegionSelected, setDrawMode]);

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-xl"
      style={{ minHeight: 400 }}
    >
      <div
        ref={container}
        className="absolute inset-0"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}