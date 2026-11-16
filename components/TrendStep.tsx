"use client";

import type { TrendCard } from "./types.ts";

type Props = { trends: TrendCard[]; selected: string | null; onSelect: (id: string) => void; count: number };

export default function TrendStep({ trends, selected, onSelect, count }: Props) {
  return (
    <section>
      <h1>Trends for you</h1>
      <p className="sub">Pick one look for all {count} photos. Every photo gets the same grade, so the carousel feels like one story.</p>
      <div className="trends" role="radiogroup" aria-label="Trends">
        {trends.map((t) => (
          <button
            key={t.id}
            role="radio"
            aria-checked={selected === t.id}
            className={`trend${selected === t.id ? " sel" : ""}`}
            onClick={() => onSelect(t.id)}
          >
            <div className="sw" style={{ background: `linear-gradient(160deg, ${t.swatch.join(", ")})` }} />
            <div className="body">
              <div className="row">
                <span className="name">{t.name}</span>
                <span className={`badge ${t.status}`}>{t.status}</span>
              </div>
              <div className="desc">{t.description}</div>
            </div>
            <div className="radio" />
          </button>
        ))}
      </div>
    </section>
  );
}
