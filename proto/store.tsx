"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { FORMATS, SUGGESTIONS, TRENDS, aesthetic, type Format } from "./data.ts";
import type { Spec } from "./brain.ts";

// ---------------------------------------------------------------- screens
export type ChatEntry =
  | { kind: "suggestion"; id: string }
  | { kind: "trend"; id: string }
  | { kind: "own"; mode: "photo" | "idea" };

export type Screen =
  | { name: "lock" }
  | { name: "home" }
  | { name: "onboarding"; step: number }
  | { name: "dashboard"; highlight?: string }
  | { name: "chat"; entry: ChatEntry }
  | { name: "draft" }
  | { name: "success" }
  | { name: "trendAlert"; id: string }
  // bring your own idea
  | { name: "link"; phase: "paste" | "reading" | "found"; shared?: boolean }
  | { name: "templates" }
  | { name: "template"; id: string }
  | { name: "preview"; spec: Spec; title: string; source: "link" | "template" | "describe" }
  | { name: "shareIn" };

export type Sheet =
  | { kind: "paywall"; reason: string; then?: () => void }
  | { kind: "share" }
  | { kind: "debug" }
  | { kind: "profile" }
  | null;

// ---------------------------------------------------------------- persisted demo state
/** `name` (a trend, template or link) is kept in the title when the draft changes. */
export type Draft = { spec: Spec; title: string; edits: number; version: number; name?: string | null };

export const formatWord = (f: Format) => (f === "carousel" ? "carousel" : f === "reel" ? "Reel" : "Story");
export const draftTitle = (spec: Spec, name: string | null | undefined, lookName: string) =>
  name ? `${name} · ${formatWord(spec.format)}` : `${lookName} ${formatWord(spec.format)}`;

export type DemoState = {
  onboarded: boolean;
  plan: "free" | "pro";
  platforms: string[];
  goal: number; // posts per week: 1, 3 or 7
  aesthetics: string[]; // picked in onboarding
  trendToTry: string | null; // picked in onboarding: the first idea is made in it
  inspirations: number; // uploaded screenshots
  photoAccess: "full" | "limited" | "none";
  posted: number; // posts this week
  freeDraftsUsed: number; // free plan: 1 full draft per week
  draft: Draft | null;
  lastShare: { platform: string; format: Format } | null;
};

export const INITIAL: DemoState = {
  onboarded: false,
  plan: "free",
  platforms: ["Instagram", "TikTok"],
  goal: 3,
  aesthetics: ["film-flash", "golden-hour", "old-money"],
  trendToTry: null,
  inspirations: 0,
  photoAccess: "full",
  posted: 1,
  freeDraftsUsed: 0,
  draft: null,
  lastShare: null,
};

export const FREE_EDITS = 3;
const KEY = "cs-proto-v1";

type Ctx = {
  s: DemoState;
  set: (patch: Partial<DemoState> | ((s: DemoState) => Partial<DemoState>)) => void;
  screen: Screen;
  dir: "push" | "pop" | "fade";
  depth: number;
  push: (sc: Screen) => void;
  replace: (sc: Screen) => void;
  back: () => void;
  /** Replace the whole stack, e.g. reset([{name:"home"},{name:"dashboard"}]) so Back still works. */
  reset: (sc: Screen | Screen[]) => void;
  sheet: Sheet;
  openSheet: (sh: Sheet) => void;
  closeSheet: () => void;
  /** Runs `action` now on Pro, otherwise opens the paywall and runs it after the trial starts. */
  requirePro: (reason: string, action: () => void) => void;
  isPro: boolean;
  formatLocked: (f: Format) => boolean;
  openStudio: (highlight?: string) => void;
  /**
   * Your own idea (link, description or template): Pro gets the full draft,
   * Free gets a watermarked preview of the first frames, then the trial for the full post.
   */
  startOwnIdea: (spec: Spec, name: string, source: "link" | "template" | "describe") => void;
  /** Store a new draft and open it (the Draft screen shows the generating state first). */
  openDraft: (spec: Spec, name: string | null, opts?: { replace?: boolean }) => void;
};

const C = createContext<Ctx | null>(null);

export function useProto() {
  const c = useContext(C);
  if (!c) throw new Error("useProto outside provider");
  return c;
}

export function ProtoProvider({ children, initialScreen }: { children: ReactNode; initialScreen?: Screen | Screen[] }) {
  const [s, setS] = useState<DemoState>(INITIAL);
  const [stack, setStack] = useState<Screen[]>(Array.isArray(initialScreen) ? initialScreen : [initialScreen ?? { name: "home" }]);
  const [dir, setDir] = useState<"push" | "pop" | "fade">("fade");
  const [sheet, setSheet] = useState<Sheet>(null);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setS({ ...INITIAL, ...(JSON.parse(raw) as Partial<DemoState>) });
    } catch {}
    loaded.current = true;
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {}
  }, [s]);

  const set = useCallback((patch: Partial<DemoState> | ((s: DemoState) => Partial<DemoState>)) => {
    setS((prev) => ({ ...prev, ...(typeof patch === "function" ? patch(prev) : patch) }));
  }, []);

  const push = useCallback((sc: Screen) => {
    setDir("push");
    setStack((st) => [...st, sc]);
  }, []);
  const replace = useCallback((sc: Screen) => {
    setDir("fade");
    setStack((st) => [...st.slice(0, -1), sc]);
  }, []);
  const back = useCallback(() => {
    setDir("pop");
    setStack((st) => (st.length > 1 ? st.slice(0, -1) : st));
  }, []);
  const reset = useCallback((sc: Screen | Screen[]) => {
    setDir("fade");
    setStack(Array.isArray(sc) ? sc : [sc]);
  }, []);

  const isPro = s.plan === "pro";
  const requirePro = useCallback(
    (reason: string, action: () => void) => {
      if (isPro) action();
      else setSheet({ kind: "paywall", reason, then: action });
    },
    [isPro],
  );

  const openStudio = useCallback(
    (highlight?: string) => {
      if (s.onboarded) {
        setDir("push");
        setStack((st) => [...st, { name: "dashboard", highlight }]);
      } else {
        setDir("push");
        setStack((st) => [...st, { name: "onboarding", step: 0 }]);
      }
    },
    [s.onboarded],
  );

  const openDraft = useCallback(
    (spec: Spec, name: string | null, opts?: { replace?: boolean }) => {
      const lookName = aesthetic(spec.aesthetic).name;
      setS((prev) => ({ ...prev, draft: { spec, title: draftTitle(spec, name, lookName), name, edits: 0, version: 1 } }));
      setDir(opts?.replace ? "fade" : "push");
      setStack((st) => (opts?.replace ? [...st.slice(0, -1), { name: "draft" }] : [...st, { name: "draft" }]));
    },
    [],
  );

  const startOwnIdea = useCallback(
    (spec: Spec, name: string, source: "link" | "template" | "describe") => {
      if (isPro) openDraft(spec, name);
      else {
        setDir("push");
        setStack((st) => [...st, { name: "preview", spec, title: name, source }]);
      }
    },
    [isPro, openDraft],
  );

  const value = useMemo<Ctx>(
    () => ({
      s,
      set,
      screen: stack[stack.length - 1],
      dir,
      depth: stack.length,
      push,
      replace,
      back,
      reset,
      sheet,
      openSheet: setSheet,
      closeSheet: () => setSheet(null),
      requirePro,
      isPro,
      formatLocked: (f: Format) => FORMATS[f].pro && !isPro,
      openStudio,
      startOwnIdea,
      openDraft,
    }),
    [s, set, stack, dir, push, replace, back, reset, sheet, requirePro, isPro, openStudio, startOwnIdea, openDraft],
  );

  return <C.Provider value={value}>{children}</C.Provider>;
}

export const suggestionById = (id: string) => SUGGESTIONS.find((x) => x.id === id) ?? SUGGESTIONS[0];
export const trendById = (id: string) => TRENDS.find((x) => x.id === id) ?? TRENDS[0];
