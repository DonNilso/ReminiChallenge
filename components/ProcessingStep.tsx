"use client";

import type { Slot } from "./types.ts";

export default function ProcessingStep({ slots, trendName, provider }: { slots: Slot[]; trendName: string; provider: string }) {
  const done = slots.filter((s) => s.status === "done" || s.status === "error").length;
  const anchorDone = slots.some((s) => s.role === "anchor" && s.status === "done");
  const pct = slots.length ? (done / slots.length) * 100 : 0;

  return (
    <section>
      <h1>Creating your post</h1>
      <p className="sub">{trendName} look</p>
      <div className="big" data-testid="progress-count">
        {done} of {slots.length} done
      </div>
      <div className="bar">
        <i style={{ width: `${pct}%` }} />
      </div>
      <p className="note">
        {!anchorDone
          ? "Styling the first photo. It sets the look that the rest of your photos will match."
          : "Matching the rest of your photos to the first photo’s look."}
        {provider === "modal" && !anchorDone && " The first run after a break can take a minute or two while the GPU starts."}
      </p>
      <div className="grid">
        {slots.map((s, i) => (
          <div className="tile" key={s.photo.id} data-status={s.status}>
            <img src={s.styledUrl ?? s.photo.url} alt={`Photo ${i + 1}`} style={{ opacity: s.styledUrl ? 1 : 0.45 }} />
            {(s.status === "processing" || s.status === "retrying") && (
              <div className="overlay">
                <div className="spinner" />
              </div>
            )}
            {s.status === "error" && <div className="overlay err">Couldn’t style this one</div>}
            {s.status === "retrying" && <span className="tag label">Retrying</span>}
            {s.status === "queued" && <span className="tag label">Queued</span>}
          </div>
        ))}
      </div>
    </section>
  );
}
