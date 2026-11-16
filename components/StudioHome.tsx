"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listSets } from "@/lib/client/setsStore.ts";
import { IconBack, IconPlus } from "./host/icons.tsx";
import type { TrendCard } from "./types.ts";

type SetCard = { id: string; trendName: string; count: number; createdAt: number; cover: string };

export function timeAgo(ts: number, now = Date.now()): string {
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const s = Math.round((ts - now) / 1000);
  const abs = Math.abs(s);
  if (abs < 60) return "just now";
  if (abs < 3600) return rtf.format(Math.round(s / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(s / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(s / 86400), "day");
  return new Date(ts).toLocaleDateString("en", { day: "numeric", month: "short" });
}

/**
 * Creator Studio home: start a set, pick a trending look, or reopen a finished set.
 * First-time users get a big "Make a new set" hero; returning users see their sets first.
 */
export default function StudioHome({ trends }: { trends: TrendCard[] }) {
  const [sets, setSets] = useState<SetCard[] | null>(null);

  useEffect(() => {
    let urls: string[] = [];
    let cancelled = false;
    listSets().then((all) => {
      if (cancelled) return;
      const cards = all
        .filter((s) => s.items.length > 0)
        .map((s) => ({ id: s.id, trendName: s.trendName, count: s.items.length, createdAt: s.createdAt, cover: URL.createObjectURL(s.items[0].styled) }));
      urls = cards.map((c) => c.cover);
      setSets(cards);
    });
    return () => {
      cancelled = true;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  const hasSets = !!sets && sets.length > 0;

  const newSetHero = (
    <Link href="/studio/new?from=studio_home" className="new-set" data-testid="new-set">
      <div className="new-set-stack" aria-hidden>
        <img src="/mock/set-1.jpg" alt="" />
        <img src="/mock/set-2.jpg" alt="" />
        <img src="/mock/set-3.jpg" alt="" />
      </div>
      <div className="new-set-title">Make a new set</div>
      <div className="new-set-sub">Pick 3–10 photos from one trip. We keep every moment real and give the whole set one look.</div>
      <span className="pill block">
        <IconPlus size={18} /> Start a new set
      </span>
    </Link>
  );

  const newSetRow = (
    <Link href="/studio/new?from=studio_home" className="new-set-row" data-testid="new-set">
      <span className="new-set-plus">
        <IconPlus size={22} />
      </span>
      <span style={{ flex: 1 }}>
        <b>New set</b>
        <small>3–10 photos, one look</small>
      </span>
      <span className="pill small">Start</span>
    </Link>
  );

  const trendsSection = (
    <section>
      <div className="section-title" style={{ margin: "28px 0 12px" }}>
        Trends this week
      </div>
      <div className="hscroll" data-testid="studio-trends">
        {trends.map((t) => (
          <Link key={t.id} href={`/studio/new?trend=${t.id}&from=studio_trends`} className="trend-tile">
            <img src={`/mock/trend-${t.id}.jpg`} alt="" />
            {t.status === "rising" && <span className="badge rising trend-tile-badge">Rising</span>}
            <span className="trend-tile-name">{t.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );

  const setsSection = (
    <section>
      <div className="row-between" style={{ margin: "28px 0 12px" }}>
        <div className="section-title" style={{ margin: 0 }}>
          Your sets
        </div>
        {hasSets && <span className="see-all">{sets!.length}</span>}
      </div>
      {sets === null ? (
        <div className="grid two">
          {[0, 1].map((i) => (
            <div key={i} className="tile" />
          ))}
        </div>
      ) : sets.length === 0 ? (
        <div className="card empty" data-testid="sets-empty">
          <div style={{ fontWeight: 600, fontSize: 16 }}>No sets yet</div>
          <ol className="how">
            <li>Add photos from one trip or weekend</li>
            <li>Pick a trending look</li>
            <li>Get one consistent carousel, ready to post</li>
          </ol>
          <div className="note">Finished sets are saved here, on this device only.</div>
        </div>
      ) : (
        <>
          <div className="grid two" data-testid="sets-grid">
            {sets.map((s) => (
              <Link key={s.id} href={`/studio/set/${s.id}`} className="set-card">
                <div className="tile">
                  <img src={s.cover} alt="" />
                  <span className="tag label">{s.count} photos</span>
                </div>
                <div className="set-card-name">{s.trendName}</div>
                <div className="set-card-meta">{timeAgo(s.createdAt)}</div>
              </Link>
            ))}
          </div>
          <p className="note" style={{ marginTop: 14 }}>
            Saved on this device only. Your photos are never stored on our servers.
          </p>
        </>
      )}
    </section>
  );

  return (
    <main className="shell">
      <header className="topbar">
        <div className="left">
          <Link href="/" className="back" aria-label="Back to home">
            <IconBack />
          </Link>
          <div className="brand">Creator Studio</div>
        </div>
      </header>

      {hasSets ? (
        <>
          {newSetRow}
          {setsSection}
          {trendsSection}
        </>
      ) : (
        <>
          {newSetHero}
          {trendsSection}
          {setsSection}
        </>
      )}
    </main>
  );
}
