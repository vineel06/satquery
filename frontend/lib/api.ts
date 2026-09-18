// frontend/lib/api.ts
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

export type IntentType =
  | "WATER"
  | "VEGETATION"
  | "BUILDINGS"
  | "AGRICULTURE"
  | "CHANGE_DETECTION"
  | "POLLUTION"
  | "ANOMALY"
  | "FLOOD_IMPACT"
  | "URBAN_EXPANSION"
  | "HYDROLOGY"
  | "LAND_COVER"
  | "POPULATION"
  | "ICE"
  | "GLACIER"
  | "TSUNAMI"
  | "DISASTER"
  | "COMPARE"
  | "GENERAL";

export interface LayerStat {
  layer: string;
  percentage: number;
  area_km2?: number;
  confidence?: number;
}

export interface AnalysisResponse {
  intent: IntentType;
  answer: string;
  stats?: LayerStat[];
  summary?: string;
  evidence: {
    source: string;
    date?: string;
    confidence?: number;
    methodology?: string;
    limitations?: string;
  };
  layers: string[];
  suggestions: string[];
  cached?: boolean;
  model_used?: string;
}

export interface AnalyzePayload {
  query: string;
  imageBase64?: string;
  imageMimeType?: string;
  imageBeforeBase64?: string;
  imageAfterBase64?: string;
  location?: { lat: number; lng: number; name?: string };
  bounds?: [number, number, number, number];
  region?: { name: string; type: string };
  dateRange?: { start: string; end: string };
  conversationHistory?: { role: "user" | "assistant"; content: string }[];
  context?: Record<string, unknown>;
}

export async function analyze(payload: AnalyzePayload): Promise<AnalysisResponse> {
  const res = await fetch(`${BACKEND}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Analyze failed (${res.status}): ${text}`);
  }
  return res.json();
}

export async function health() {
  const res = await fetch(`${BACKEND}/health`);
  return res.json();
}