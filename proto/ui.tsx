"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { aesthetic, ENHANCE_ONLY, type Look } from "./data.ts";
import { tweakFilter, type Spec } from "./brain.ts";

export * from "@/components/host/icons.tsx";

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .5 0 0 0 0 .5 0 0 0 0 .5 0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.9'/%3E%3C/svg%3E\")";

/** Look for an aesthetic id, or the free "enhance only" preview. */
export function lookFor(aestheticId: string | null): Look {
  return aestheticId ? aesthetic(aestheticId).look : ENHANCE_ONLY;
}

/**
 * One of the user's photos rendered in a look. This stands in for the AI restyle:
 * same photo, different grade, so previews visibly change when the look changes.
 */
export function Shot({
  src,
  look,
  tweak,
  mark,
  className = "",
  style,
  kenBurns,
  children,
}: {
  src: string;
  look: Look;
  tweak?: Pick<Spec, "warmth" | "mood" | "bright">;
  mark?: boolean;
  className?: string;
  style?: CSSProperties;
  kenBurns?: number; // animation index for Reel previews
  children?: ReactNode;
}) {
  const filter = [look.filter, tweak ? tweakFilter(tweak) : ""].join(" ").trim();
  return (
    <div className={`shot ${className}`} style={style}>
      <img src={src} alt="" draggable={false} style={{ filter }} className={kenBurns !== undefined ? `kb kb${kenBurns % 4}` : undefined} />
      {look.overlay && <div className="shot-layer" style={{ background: look.overlay, mixBlendMode: (look.blend as CSSProperties["mixBlendMode"]) ?? "normal" }} />}
      {tweak && tweak.warmth > 0 && <div className="shot-layer" style={{ background: `rgba(255,150,60,${0.12 * tweak.warmth})`, mixBlendMode: "soft-light" }} />}
      {tweak && tweak.warmth < 0 && <div className="shot-layer" style={{ background: `rgba(80,140,255,${0.1 * -tweak.warmth})`, mixBlendMode: "soft-light" }} />}
      {look.flash && <div className="shot-layer" style={{ background: "radial-gradient(circle at 50% 38%, rgba(255,255,255,.32), transparent 55%)", mixBlendMode: "screen" }} />}
      {!!look.vignette && <div className="shot-layer" style={{ background: `radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,${look.vignette}))` }} />}
      {!!look.grain && <div className="shot-layer grain" style={{ backgroundImage: NOISE, opacity: look.grain * 2.2 }} />}
      {mark && <span className="made-with">Made with Remini</span>}
      {children}
    </div>
  );
}

export function StatusBar({ light }: { light?: boolean }) {
  const [time, setTime] = useState("9:41");
  useEffect(() => setTime("9:41"), []);
  return (
    <div className={`statusbar${light ? " light" : ""}`} aria-hidden>
      <span>{time}</span>
      <span className="sb-icons">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5.5" width="3" height="6.5" rx="1" /><rect x="10" y="3" width="3" height="9" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.2-1.3A10.4 10.4 0 0 0 8 .4 10.4 10.4 0 0 0 .8 3.3L2 4.6a8.6 8.6 0 0 1 6-2.4zm0 3.6c1.3 0 2.5.5 3.4 1.3l1.2-1.3A6.8 6.8 0 0 0 8 4a6.8 6.8 0 0 0-4.6 1.8l1.2 1.3c.9-.8 2.1-1.3 3.4-1.3zM8 9.4l1.9-2a2.8 2.8 0 0 0-3.8 0z" /></svg>
        <svg width="27" height="13" viewBox="0 0 27 13" fill="none"><rect x=".5" y=".5" width="23" height="12" rx="3.5" stroke="currentColor" opacity=".4" /><rect x="2" y="2" width="18" height="9" rx="2" fill="currentColor" /><path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2z" fill="currentColor" opacity=".5" /></svg>
      </span>
    </div>
  );
}

export function SheetFrame({ onClose, children, label, tall }: { onClose: () => void; children: ReactNode; label: string; tall?: boolean }) {
  return (
    <div className="p-backdrop" onClick={onClose}>
      <div className={`p-sheet${tall ? " tall" : ""}`} role="dialog" aria-label={label} onClick={(e) => e.stopPropagation()}>
        <div className="p-grip" />
        {children}
      </div>
    </div>
  );
}

export function Dots({ total, at }: { total: number; at: number }) {
  return (
    <div className="p-dots" aria-label={`Step ${at + 1} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <i key={i} className={i === at ? "on" : i < at ? "done" : ""} />
      ))}
    </div>
  );
}

/** Weekly goal ring: "1 of 3 posted this week". */
export function GoalRing({ done, goal, size = 54 }: { done: number; goal: number; size?: number }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, done / goal);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="goal-ring" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#3A3A3C" strokeWidth="5" fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="#D92D50"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${c * pct} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dasharray .8s ease" }}
      />
      <text x="50%" y="54%" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize={size * 0.3} fontWeight="600">
        {done}/{goal === 7 ? 7 : goal}
      </text>
    </svg>
  );
}

/** Long-press (or right-click) handler props, used to open the hidden debug menu. */
export function longPress(onLong: () => void, ms = 550) {
  let t: ReturnType<typeof setTimeout> | undefined;
  const start = () => {
    t = setTimeout(onLong, ms);
  };
  const stop = () => clearTimeout(t);
  return {
    onPointerDown: start,
    onPointerUp: stop,
    onPointerLeave: stop,
    onContextMenu: (e: { preventDefault: () => void }) => {
      e.preventDefault();
      onLong();
    },
  };
}
