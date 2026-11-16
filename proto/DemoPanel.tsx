"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { INITIAL, useProto } from "./store.tsx";

/**
 * Presenter controls shown on the web to the left of the phone frame (wide screens only,
 * never inside the phone). Switch between a first-time user (goes through onboarding)
 * and a returning user (already set up, straight to the dashboard).
 */
export default function DemoPanel() {
  const { s, set, reset, closeSheet } = useProto();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const newUser = () => {
    closeSheet();
    set({ ...INITIAL });
    reset({ name: "home" });
  };
  const returning = () => {
    closeSheet();
    set({ ...INITIAL, onboarded: true, trendToTry: "film-flash", plan: s.plan });
    reset([{ name: "home" }, { name: "dashboard" }]);
  };

  return createPortal(
    <aside className="demo-panel" aria-label="Demo controls" data-testid="demo-panel">
      <div className="dp-kicker">Demo controls</div>
      <div className="dp-title">Creator Studio</div>

      <div className="dp-label">User</div>
      <div className="dp-switch" role="radiogroup" aria-label="User">
        <button role="radio" aria-checked={!s.onboarded} className={!s.onboarded ? "on" : ""} onClick={newUser} data-testid="dp-new">
          <b>New user</b>
          <small>Starts with onboarding</small>
        </button>
        <button role="radio" aria-checked={s.onboarded} className={s.onboarded ? "on" : ""} onClick={returning} data-testid="dp-returning">
          <b>Returning user</b>
          <small>Logged in as Mia, opens the dashboard</small>
        </button>
      </div>

      <div className="dp-label">Plan</div>
      <div className="dp-seg" role="radiogroup" aria-label="Plan">
        {(["free", "pro"] as const).map((p) => (
          <button key={p} role="radio" aria-checked={s.plan === p} className={s.plan === p ? "on" : ""} onClick={() => set({ plan: p })}>
            {p === "free" ? "Free" : "Pro"}
          </button>
        ))}
      </div>

      <div className="dp-label">Jump to</div>
      <div className="dp-links">
        <button onClick={() => (closeSheet(), reset({ name: "lock" }))}>Lock screen (notifications)</button>
        <button onClick={() => (closeSheet(), set({ onboarded: true }), reset({ name: "trendAlert", id: "film-flash" }))}>Trend alert</button>
        <button onClick={() => (closeSheet(), reset({ name: "shareIn" }))} data-testid="dp-share">
          Shared from TikTok
        </button>
        <button onClick={() => (closeSheet(), set({ onboarded: true }), reset([{ name: "home" }, { name: "dashboard" }, { name: "templates" }]))}>Templates</button>
        <button onClick={() => (closeSheet(), reset({ name: "home" }))}>Remini home</button>
      </div>

      <p className="dp-hint">More screens: press ` or long-press the title in the app.</p>
    </aside>,
    document.body,
  );
}
