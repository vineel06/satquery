// frontend/lib/cities.ts
export interface City {
  name: string;
  country: string;
  lat: number;
  lng: number;
  zoom: number;
}

export const CITIES: City[] = [
  { name: "Chennai", country: "India", lat: 13.0827, lng: 80.2707, zoom: 10 },
  { name: "Delhi", country: "India", lat: 28.6139, lng: 77.209, zoom: 10 },
  { name: "Mumbai", country: "India", lat: 19.076, lng: 72.8777, zoom: 10 },
  { name: "Bengaluru", country: "India", lat: 12.9716, lng: 77.5946, zoom: 10 },
  { name: "Kolkata", country: "India", lat: 22.5726, lng: 88.3639, zoom: 10 },
  { name: "Hyderabad", country: "India", lat: 17.385, lng: 78.4867, zoom: 10 },
  { name: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503, zoom: 10 },
  { name: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198, zoom: 11 },
  { name: "Dubai", country: "UAE", lat: 25.2048, lng: 55.2708, zoom: 10 },
  { name: "London", country: "UK", lat: 51.5074, lng: -0.1278, zoom: 10 },
  { name: "New York", country: "USA", lat: 40.7128, lng: -74.006, zoom: 10 },
  { name: "São Paulo", country: "Brazil", lat: -23.5505, lng: -46.6333, zoom: 10 },
  { name: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093, zoom: 10 },
  { name: "Cairo", country: "Egypt", lat: 30.0444, lng: 31.2357, zoom: 10 },
  { name: "Nairobi", country: "Kenya", lat: -1.2921, lng: 36.8219, zoom: 10 },
  { name: "Amazon Basin", country: "South America", lat: -3.4653, lng: -62.2159, zoom: 6 },
  { name: "Sahara", country: "Africa", lat: 23.8859, lng: 12.9443, zoom: 5 },
];