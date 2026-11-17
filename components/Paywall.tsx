"use client";

import type { Slot } from "./types.ts";

/**
 * Mock PRO paywall shown before export/share. In production this is where cost is
 * controlled: previews are cheap low-resolution renders, and the full-resolution post
 * is only rendered once a trial or subscription has started.
 */
export default function Paywall({ slots, onStart, onClose }: { slots: Slot[]; onStart: () => void; onClose: () => void }) {
  const previews = slots.filter((s) => s.styledUrl).slice(0, 3);
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label="Unlock PRO" onClick={(e) => e.stopPropagation()} data-testid="paywall">
        <div className="sheet-grip" />
        <div className="paywall-hero">
          {previews.map((s) => (
            <img key={s.photo.id} src={s.styledUrl} alt="" />
          ))}
        </div>
        <div className="label" style={{ color: "var(--accent)" }}>PRO</div>
        <div style={{ fontSize: 24, fontWeight: 600, margin: "4px 0 12px" }}>Post it in full quality</div>
        <ul className="paywall-list">
          <li>Full-resolution photos, no watermark</li>
          <li>Instagram-ready 1080×1350 carousel</li>
          <li>15-second slideshow video</li>
          <li>Unlimited Creator Studio posts</li>
        </ul>
        <button className="pill block" onClick={onStart} data-testid="start-trial">
          Start 7-day free trial
        </button>
        <p className="note" style={{ textAlign: "center", marginTop: 10 }}>
          Mock paywall, nothing is charged. Then $4.99/week, cancel anytime.
        </p>
        <button className="link" style={{ display: "block", margin: "0 auto" }} onClick={onClose}>
          Not now
        </button>
      </div>
    </div>
  );
}
