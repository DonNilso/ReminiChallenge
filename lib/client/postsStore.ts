"use client";

/**
 * Finished posts, saved in IndexedDB on the user's device only (never on the server).
 * Keeps the newest MAX_POSTS posts. Every call fails soft: private browsing or blocked
 * storage just means "no saved posts".
 */

export type SavedPost = {
  id: string;
  createdAt: number;
  trendId: string;
  trendName: string;
  items: { original: Blob; styled: Blob }[];
};

const DB_NAME = "creator-studio";
const STORE = "sets"; // object-store name kept from the first version so saved posts survive
export const MAX_POSTS = 12;

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

export async function listPosts(): Promise<SavedPost[]> {
  try {
    const all = ((await tx<SavedPost[]>("readonly", (s) => s.getAll())) ?? []) as SavedPost[];
    return all.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export async function getPost(id: string): Promise<SavedPost | null> {
  try {
    return ((await tx<SavedPost>("readonly", (s) => s.get(id))) as SavedPost | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function savePost(post: SavedPost): Promise<boolean> {
  try {
    await tx("readwrite", (s) => s.put(post));
    const all = await listPosts();
    for (const old of all.slice(MAX_POSTS)) await deletePost(old.id);
    return true;
  } catch {
    return false;
  }
}

export async function deletePost(id: string): Promise<void> {
  try {
    await tx("readwrite", (s) => s.delete(id));
  } catch {}
}
