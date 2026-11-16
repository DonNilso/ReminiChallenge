"use client";

import { useState } from "react";
import { FORMATS, PRICING, SUGGESTIONS, TRENDS, aesthetic, photo } from "../data.ts";
import { INITIAL, useProto, type Screen } from "../store.tsx";
import { IconCheck, IconLock, SheetFrame, Shot } from "../ui.tsx";

/** Remini Pro trial offer. Free vs Pro shown side by side. */
export function Paywall({ reason, then }: { reason: string; then?: () => void }) {
  const { set, closeSheet, s } = useProto();
  const sample = s.draft?.spec.photos ?? SUGGESTIONS[0].photos;
  const look = aesthetic(s.draft?.spec.aesthetic ?? s.aesthetics[0] ?? "golden-hour").look;
  const start = () => {
    set({ plan: "pro" });
    closeSheet();
    // Let the plan change land before continuing what the user was doing.
    setTimeout(() => then?.(), 50);
  };
  const rows: [string, string, string][] = [
    ["Weekly ideas from your photos", "Enhance-only preview", "Full trend look"],
    ["Full drafts", "1 a week", "Unlimited"],
    ["Formats", "Carousel", "Carousel, Reel, Story"],
    ["Edits by asking", `${3} per draft`, "Unlimited"],
    ["“Made with Remini” mark", "Yes", "No"],
  ];
  return (
    <SheetFrame onClose={closeSheet} label="Remini Pro" tall>
      <div className="pw" data-testid="paywall">
        <div className="pw-hero">
          {sample.slice(0, 3).map((id, i) => (
            <Shot key={id} src={photo(id).src} look={look} className={`pw-img p${i}`} />
          ))}
        </div>
        <div className="pw-reason">
          <IconLock size={14} /> {reason}
        </div>
        <h2 className="pw-title">Your week of posts, done for you</h2>
        <table className="pw-table">
          <thead>
            <tr>
              <th />
              <th>Free</th>
              <th className="pro">Pro</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([k, f, p]) => (
              <tr key={k}>
                <td>{k}</td>
                <td>{f}</td>
                <td className="pro">{p}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="pill-w block" onClick={start} data-testid="start-trial">
          Start free trial
        </button>
        <p className="pw-fine">
          {PRICING.trialDays} days free, then {PRICING.weekly}/week. Cancel anytime. (Prototype: nothing is charged.)
        </p>
        <button className="link" onClick={closeSheet}>
          Not now
        </button>
      </div>
    </SheetFrame>
  );
}

/** Share sheet: the user posts it themselves; nothing is posted automatically. */
export function ShareSheet() {
  const { s, set, closeSheet, reset } = useProto();
  const [opening, setOpening] = useState<string | null>(null);
  const format = s.draft?.spec.format ?? "carousel";
  const targets: Record<string, { name: string; sub: string; color: string }[]> = {
    carousel: [
      { name: "Instagram", sub: "Feed post · carousel 4:5", color: "linear-gradient(135deg,#f9a03f,#d92d50,#8a3ab9)" },
      { name: "Save to Photos", sub: "All slides in full quality", color: "#3A3A3C" },
    ],
    reel: [
      { name: "Instagram", sub: "Reel 9:16 · add a trending sound", color: "linear-gradient(135deg,#f9a03f,#d92d50,#8a3ab9)" },
      { name: "TikTok", sub: "Video 9:16 · add a trending sound", color: "#111" },
      { name: "Save to Photos", sub: "Video, no sound", color: "#3A3A3C" },
    ],
    story: [
      { name: "Instagram", sub: "Story 9:16", color: "linear-gradient(135deg,#f9a03f,#d92d50,#8a3ab9)" },
      { name: "WhatsApp Status", sub: "Status 9:16", color: "#1f8a4c" },
      { name: "Save to Photos", sub: "All frames", color: "#3A3A3C" },
    ],
  };
  const pick = (name: string) => {
    setOpening(name);
    setTimeout(() => {
      set((st) => ({ posted: st.posted + 1, lastShare: { platform: name, format } }));
      closeSheet();
      reset({ name: "success" });
    }, 1100);
  };
  return (
    <SheetFrame onClose={() => !opening && closeSheet()} label="Share">
      <div className="share" data-testid="share-sheet">
        <div className="share-title">Share your {FORMATS[format].label}</div>
        <div className="share-sub">You post it yourself. Nothing is posted automatically.</div>
        {targets[format].map((t) => (
          <button key={t.name} className="share-row" onClick={() => pick(t.name)} disabled={!!opening}>
            <span className="share-ic" style={{ background: t.color }}>
              {t.name[0]}
            </span>
            <span className="share-txt">
              <b>{t.name}</b>
              <small>{opening === t.name ? `Opening ${t.name}…` : t.sub}</small>
            </span>
            {opening === t.name && <span className="spin" />}
          </button>
        ))}
      </div>
    </SheetFrame>
  );
}

/** Hidden demo menu: long-press the "Remini" or "Creator Studio" title, or press the ` key. */
export function DebugMenu() {
  const { s, set, closeSheet, reset } = useProto();
  const go = (stack: Screen) => {
    closeSheet();
    reset(stack);
  };
  const withDraft = (format: "carousel" | "reel" | "story") => {
    const sg = SUGGESTIONS.find((x) => x.format === format) ?? SUGGESTIONS[0];
    set({ onboarded: true, draft: { spec: { aesthetic: sg.aesthetic, format, photos: sg.photos, warmth: 0, mood: 0, bright: 0 }, title: sg.title, edits: 0, version: 1 } });
    go({ name: "draft" });
  };
  const jumps: [string, () => void][] = [
    ["Lock screen (notifications)", () => go({ name: "lock" })],
    ["Remini home", () => go({ name: "home" })],
    ...["a Face", "b Platforms", "c Aesthetics", "d Trend to try", "e Inspiration", "f Photo access", "g Payoff"].map(
      (l, i) => [`Onboarding ${l}`, () => go({ name: "onboarding", step: i })] as [string, () => void],
    ),
    ["Dashboard", () => (set((st) => ({ onboarded: true, trendToTry: st.trendToTry ?? "film-flash" })), go({ name: "dashboard" }))],
    ["Chat: Saturday carousel", () => (set({ onboarded: true }), go({ name: "chat", entry: { kind: "suggestion", id: "sat-carousel" } }))],
    ["Chat: create your own", () => (set({ onboarded: true }), go({ name: "chat", entry: { kind: "own", mode: "photo" } }))],
    ["Draft: carousel", () => withDraft("carousel")],
    ["Draft: Reel", () => withDraft("reel")],
    ["Draft: Story", () => withDraft("story")],
    ["Success", () => go({ name: "success" })],
    ["Trend alert: Film flash", () => go({ name: "trendAlert", id: TRENDS[0].id })],
  ];
  return (
    <SheetFrame onClose={closeSheet} label="Demo menu" tall>
      <div className="dbg" data-testid="debug">
        <div className="share-title">Demo menu</div>
        <div className="dbg-row">
          <span>Plan</span>
          <div className="seg2">
            {(["free", "pro"] as const).map((p) => (
              <button key={p} className={s.plan === p ? "on" : ""} onClick={() => set({ plan: p })}>
                {p === "free" ? "Free" : "Pro"}
              </button>
            ))}
          </div>
        </div>
        <div className="dbg-row">
          <span>Posted this week</span>
          <div className="seg2">
            {[0, 1, 2, 3].map((n) => (
              <button key={n} className={s.posted === n ? "on" : ""} onClick={() => set({ posted: n })}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className="dbg-row">
          <span>Onboarded</span>
          <div className="seg2">
            {[false, true].map((v) => (
              <button key={String(v)} className={s.onboarded === v ? "on" : ""} onClick={() => set({ onboarded: v })}>
                {v ? "Yes" : "No"}
              </button>
            ))}
          </div>
        </div>
        <div className="dbg-list">
          {jumps.map(([label, fn]) => (
            <button key={label} onClick={fn}>
              {label}
            </button>
          ))}
          <button onClick={() => (window.location.href = "/studio")}>Tech demo: real styling pipeline ↗</button>
          <button
            className="danger"
            onClick={() => {
              set({ ...INITIAL });
              go({ name: "home" });
            }}
          >
            <IconCheck size={14} /> Reset demo
          </button>
        </div>
      </div>
    </SheetFrame>
  );
}
