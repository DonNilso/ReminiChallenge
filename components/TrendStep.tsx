"use client";

import { useMemo } from "react";
import type { Prefs } from "@/lib/shared/prefs.ts";
import { proposeTrends } from "@/lib/shared/recommend.ts";
import type { TrendCard } from "./types.ts";

type Props = { trends: TrendCard[]; prefs: Prefs; selected: string | null; onSelect: (id: string) => void; count: number };

/** Pick the look, ranked for this creator (same ranking as the dashboard's "Proposed for you"). */
export default function TrendStep({ trends, prefs, selected, onSelect, count }: Props) {
  const ranked = useMemo(() => proposeTrends(trends, prefs), [trends, prefs]);
  return (
    <section>
      <h1>Trends for you</h1>
      <p className="sub">Pick one look for all {count} photos. Every photo gets the same grade, so the carousel feels like one story.</p>
      <div className="trends" role="radiogroup" aria-label="Trends">
        {ranked.map(({ trend: t, reasons }, i) => (
          <button
            key={t.id}
            role="radio"
            aria-checked={selected === t.id}
            className={`trend${selected === t.id ? " sel" : ""}`}
            onClick={() => onSelect(t.id)}
          >
            <img className="sw" src={`/mock/trend-${t.id}.jpg`} alt="" />
            <div className="body">
              <div className="row">
                <span className="name">{t.name}</span>
                <span className={`badge ${t.status}`}>{t.status}</span>
                {i < 3 && <span className="badge for-you">For you</span>}
              </div>
              <div className="desc">{t.description}</div>
              <div className="trend-stats">
                {t.meta.hashtag} · {t.meta.posts} posts · {t.meta.growth > 0 ? "+" : ""}
                {t.meta.growth}% this week
              </div>
              {i < 3 && reasons.length > 0 && <div className="trend-why">{reasons.slice(0, 2).join(" · ")}</div>}
            </div>
            <div className="radio" />
          </button>
        ))}
      </div>
    </section>
  );
}
