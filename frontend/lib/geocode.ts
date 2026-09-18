// frontend/lib/geocode.ts
export interface GeoResult {
  name: string;
  country: string;
  admin1?: string;
  lat: number;
  lng: number;
  type: "city" | "region" | "country";
}

export interface Suggestion {
  name: string;
  country: string;
  admin1?: string;
  lat: number;
  lng: number;
  population?: number;
}

/** Dedupe suggestions by name+country+rounded coordinates. */
function dedupe(items: Suggestion[]): Suggestion[] {
  const seen = new Set<string>();
  const out: Suggestion[] = [];
  for (const s of items) {
    const key = `${s.name.toLowerCase()}|${(s.admin1 ?? "").toLowerCase()}|${s.country.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

export async function geocode(query: string): Promise<GeoResult | null> {
  if (!query.trim()) return null;
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      query,
    )}&count=5&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const list: Suggestion[] = (data.results ?? []).map(
      (r: Record<string, unknown>) => ({
        name: r.name as string,
        country: r.country as string,
        admin1: r.admin1 as string | undefined,
        lat: r.latitude as number,
        lng: r.longitude as number,
        population: r.population as number | undefined,
      }),
    );
    // Pick the most-populated hit (usually the one user wants)
    list.sort((a, b) => (b.population ?? 0) - (a.population ?? 0));
    const hit = list[0];
    if (!hit) return null;
    return {
      name: hit.name,
      country: hit.country,
      admin1: hit.admin1,
      lat: hit.lat,
      lng: hit.lng,
      type: "city",
    };
  } catch {
    return null;
  }
}

export async function autocomplete(query: string): Promise<Suggestion[]> {
  if (!query.trim() || query.length < 2) return [];
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      query,
    )}&count=8&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const list: Suggestion[] = (data.results ?? []).map(
      (r: Record<string, unknown>) => ({
        name: r.name as string,
        country: r.country as string,
        admin1: r.admin1 as string | undefined,
        lat: r.latitude as number,
        lng: r.longitude as number,
        population: r.population as number | undefined,
      }),
    );
    // Sort by population descending, then dedupe
    list.sort((a, b) => (b.population ?? 0) - (a.population ?? 0));
    return dedupe(list).slice(0, 6);
  } catch {
    return [];
  }
}