"use client";

/**
 * Finished sets, saved in IndexedDB on the user's device only (never on the server).
 * Keeps the newest MAX_SETS sets. Every call fails soft: private browsing or blocked
 * storage just means "no saved sets".
 */

export type SavedSet = {
  id: string;
  createdAt: number;
  trendId: string;
  trendName: string;
  items: { original: Blob; styled: Blob }[];
};

const DB_NAME = "creator-studio";
const STORE = "sets";
export const MAX_SETS = 12;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB unavailable"));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  const db = await openDb();
  try {
    return await new Promise<T | undefined>((resolve, reject) => {
      const t = db.transaction(STORE, mode);
      const req = fn(t.objectStore(STORE));
      t.oncomplete = () => resolve(req ? req.result : undefined);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  } finally {
    db.close();
  }
}

export async function listSets(): Promise<SavedSet[]> {
  try {
    const all = ((await tx<SavedSet[]>("readonly", (s) => s.getAll())) ?? []) as SavedSet[];
    return all.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export async function getSet(id: string): Promise<SavedSet | null> {
  try {
    return ((await tx<SavedSet>("readonly", (s) => s.get(id))) as SavedSet | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function saveSet(set: SavedSet): Promise<boolean> {
  try {
    await tx("readwrite", (s) => s.put(set));
    const all = await listSets();
    for (const old of all.slice(MAX_SETS)) await deleteSet(old.id);
    return true;
  } catch {
    return false;
  }
}

export async function deleteSet(id: string): Promise<void> {
  try {
    await tx("readwrite", (s) => s.delete(id));
  } catch {}
}
