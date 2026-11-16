"use client";

import { useState } from "react";
import { aesthetic, photo } from "../data.ts";
import { trendById, useProto } from "../store.tsx";
import { IconClose, IconTrend, Shot } from "../ui.tsx";

/** Opened from the trend-alert notification: a free preview made from the user's photos. */
export default function TrendAlert({ id }: { id: string }) {
  const { reset, requirePro, push, s } = useProto();
  const t = trendById(id);
  const [i, setI] = useState(0);
  const photos = t.fromPhotos.slice(0, 3);
  const close = () => reset(s.onboarded ? [{ name: "home" }, { name: "dashboard" }] : [{ name: "home" }]);
  const makeFull = () =>
    requirePro("Make the full set with Pro", () => {
      reset([{ name: "home" }, { name: "dashboard" }]);
      setTimeout(() => push({ name: "chat", entry: { kind: "trend", id: t.id } }), 0);
    });
  return (
    <div className="scr alert" data-testid="trend-alert">
      <header className="p-top">
        <span />
        <div className="p-title sm">Trend alert</div>
        <button className="p-icon" aria-label="Close" onClick={close}>
          <IconClose />
        </button>
      </header>
      <div className="alert-head">
        <span className="alert-growth">
          <IconTrend size={16} /> +{t.growth}% this week
        </span>
        <h1>{t.name} is taking off.</h1>
        <p>Here's your version, made from {photo(photos[0]).when.toLowerCase() || "your photos"}.</p>
      </div>
      <div className="alert-pv">
        <div className="car" onScroll={(e) => setI(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}>
          {photos.map((pid) => (
            <Shot key={pid} src={photo(pid).src} look={aesthetic(t.id).look} className="car-slide">
              <span className="preview-wm">PREVIEW</span>
            </Shot>
          ))}
        </div>
        <div className="car-dots">
          {photos.map((pid, k) => (
            <i key={pid} className={k === i ? "on" : ""} />
          ))}
        </div>
      </div>
      <p className="alert-note">
        Free preview · {photos.length} of {t.fromPhotos.length} photos. The full set has every photo, no watermark, in carousel, Reel or Story.
      </p>
      <div className="alert-actions">
        <button className="pill-w block" onClick={makeFull} data-testid="make-full">
          Make the full set
        </button>
        <button className="pill-o block" onClick={close}>
          Not now
        </button>
      </div>
    </div>
  );
}
