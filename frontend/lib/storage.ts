// frontend/lib/storage.ts
"use client";
import { openDB, type IDBPDatabase } from "idb";
import type { AnalysisResponse, AnalyzePayload } from "./api";

const DB_NAME = "satquery";
const STORE = "analyses";

export type SaveKind = "chat" | "compare" | "disaster" | "single-upload";

export interface SavedAnalysis {
  id: string;
  createdAt: number;
  kind: SaveKind;
  query: string;
  payload: AnalyzePayload;
  response: AnalysisResponse;
  thumbnail?: string;
  location?: { lat: number; lng: number; name?: string };
  region?: { name: string; type: string };
  images?: { before?: string; after?: string; single?: string };
}

let dbPromise: Promise<IDBPDatabase> | null = null;
function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 2, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id" });
        } else if (oldVersion < 2) {
          // Existing store — no migration needed (kind is optional)
        }
      },
    });
  }
  return dbPromise;
}

export async function saveAnalysis(a: SavedAnalysis) {
  const db = await getDB();
  await db.put(STORE, a);
}

export async function listAnalyses(): Promise<SavedAnalysis[]> {
  const db = await getDB();
  const all = (await db.getAll(STORE)) as SavedAnalysis[];
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getAnalysis(id: string): Promise<SavedAnalysis | undefined> {
  const db = await getDB();
  return db.get(STORE, id) as Promise<SavedAnalysis | undefined>;
}

export async function deleteAnalysis(id: string) {
  const db = await getDB();
  await db.delete(STORE, id);
}