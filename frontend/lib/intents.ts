// frontend/lib/intents.ts
import type { IntentType } from "./api";

export const INTENT_LAYERS: Record<IntentType, string[]> = {
  WATER: ["water"],
  VEGETATION: ["vegetation"],
  BUILDINGS: ["buildings"],
  AGRICULTURE: ["agriculture"],
  CHANGE_DETECTION: ["change"],
  POLLUTION: ["pollution"],
  ANOMALY: ["anomalies"],
  FLOOD_IMPACT: ["flood"],
  URBAN_EXPANSION: ["builtup"],
  HYDROLOGY: ["rivers", "water"],
  LAND_COVER: ["vegetation", "water", "builtup", "bareland"],
  POPULATION: ["population"],
  ICE: ["ice", "snow"],
  GLACIER: ["glacier", "snow"],
  TSUNAMI: ["tsunami", "water"],
  DISASTER: ["flood", "anomalies"],
  GENERAL: [],
};

const KEYWORDS: [RegExp, IntentType][] = [
  [/\btsunami|tidal\s*wave/i, "TSUNAMI"],
  [/\bglacier|glacial/i, "GLACIER"],
  [/\bice\s*(sheet|caps?|berg|extent|cover)|arctic|antarctic|snow\s*cover/i, "ICE"],
  [/\bflood|inundat|water\s*logg/i, "FLOOD_IMPACT"],
  [/\bwater|river|lake|pond|reservoir|canal|drain/i, "WATER"],
  [/\bhydrolog/i, "HYDROLOGY"],
  [/\bvegetation|forest|tree|ndvi|green/i, "VEGETATION"],
  [/\bbuilding|urban|built.?up|settlement/i, "URBAN_EXPANSION"],
  [/\bagricultur|crop|farm|paddy/i, "AGRICULTURE"],
  [/\bchange|diff|compare|before.?after/i, "CHANGE_DETECTION"],
  [/\bpollut|aqi|pm2\.?5|pm10|no2|so2|co|o3/i, "POLLUTION"],
  [/\banomal|unusual|strange/i, "ANOMALY"],
  [/\bpopulation|density|people/i, "POPULATION"],
  [/\bland\s*cover|bare\s*land|barren/i, "LAND_COVER"],
  [/\bdisaster|wildfire|cyclone|earthquake|landslide/i, "DISASTER"],
];

export function detectIntent(query: string): IntentType {
  for (const [re, intent] of KEYWORDS) if (re.test(query)) return intent;
  return "GENERAL";
}