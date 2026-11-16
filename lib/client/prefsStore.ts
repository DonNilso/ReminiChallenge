"use client";

import { DEFAULT_PREFS, type Prefs } from "@/lib/shared/prefs.ts";

const KEY = "cs-prefs";

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Prefs>) };
  } catch {}
  return DEFAULT_PREFS;
}

export function savePrefs(p: Prefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {}
}
