"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listPosts } from "@/lib/client/postsStore.ts";
import { loadPrefs, savePrefs } from "@/lib/client/prefsStore.ts";
import { bestTimeToPost, DEFAULT_PREFS, type Prefs } from "@/lib/shared/prefs.ts";
import { postsThisWeek, proposeTrends } from "@/lib/shared/recommend.ts";
import { IconBack, IconEdit, IconPlus, IconUser } from "./host/icons.tsx";
import PrefsSheet from "./PrefsSheet.tsx";
import type { TrendCard } from "./types.ts";

type PostCard = { id: string; trendName: string; count: number; createdAt: number; cover: string };

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
 * Creator Studio dashboard: the creator's account and preferences, trends proposed
 * for them (ranked by those preferences), and the posts they have made.
 */
export default function StudioHome({ trends }: { trends: TrendCard[] }) {
  const [posts, setPosts] = useState<PostCard[] | null>(null);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [editing, setEditing] = useState(false);

  useEffect(() => setPrefs(loadPrefs()), []);

  useEffect(() => {
    let urls: string[] = [];
    let cancelled = false;
    listPosts().then((all) => {
      if (cancelled) return;
      const cards = all
        .filter((p) => p.items.length > 0)
        .map((p) => ({ id: p.id, trendName: p.trendName, count: p.items.length, createdAt: p.createdAt, cover: URL.createObjectURL(p.items[0].styled) }));
      urls = cards.map((c) => c.cover);
      setPosts(cards);
    });
    return () => {
      cancelled = true;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  const proposals = useMemo(() => proposeTrends(trends, prefs), [trends, prefs]);
  const top = proposals.slice(0, 3);
  const rest = proposals.slice(3);
  const thisWeek = posts ? postsThisWeek(posts.map((p) => p.createdAt)) : 0;
  const goalPct = Math.min(100, (thisWeek / prefs.weeklyGoal) * 100);

  const onSave = (p: Prefs) => {
    setPrefs(p);
    savePrefs(p);
    setEditing(false);
  };

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

      {/* Account + preferences */}
      <section className="account" data-testid="account-card">
        <div className="account-top">
          <div className="account-avatar">
            <span>
              <IconUser size={26} />
            </span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="account-handle">{prefs.handle}</div>
            <div className="account-platforms">
              {prefs.platforms.length ? prefs.platforms.map((p) => <span key={p}>● {p}</span>) : <span>No platform connected</span>}
            </div>
          </div>
          <button className="pill ghost small" onClick={() => setEditing(true)} data-testid="edit-prefs">
            <IconEdit size={15} /> Edit
          </button>
        </div>

        <div className="account-stats">
          <div>
            <div className="v">{posts?.length ?? "–"}</div>
            <div className="k">Posts</div>
          </div>
          <div>
            <div className="v">
              {thisWeek}/{prefs.weeklyGoal}
            </div>
            <div className="k">This week</div>
            <div className="goal-bar">
              <i style={{ width: `${goalPct}%` }} />
            </div>
          </div>
          <div>
            <div className="v small">{bestTimeToPost(prefs.platforms)}</div>
            <div className="k">Best time to post</div>
          </div>
        </div>

        <div className="pref-row">
          <span className="pref-k">Interests</span>
          <div className="pref-chips">
            {prefs.interests.map((i) => (
              <span key={i} className="pref-chip">
                {i}
              </span>
            ))}
          </div>
        </div>
        <div className="pref-row">
          <span className="pref-k">Vibes</span>
          <div className="pref-chips">
            {prefs.vibes.map((v) => (
              <span key={v} className="pref-chip">
                {v}
              </span>
            ))}
          </div>
        </div>
      </section>

      <Link href="/studio/new?from=dashboard" className="new-post" data-testid="new-post">
        <span className="new-post-plus">
          <IconPlus size={24} />
        </span>
        <span style={{ flex: 1 }}>
          <b>Create a post</b>
          <small>Add 3–10 photos, we suggest the look</small>
        </span>
      </Link>

      {/* Trends proposed for this creator */}
      <div className="row-between" style={{ margin: "28px 0 12px" }}>
        <div className="section-title" style={{ margin: 0 }}>
          Proposed for you
        </div>
        <span className="see-all">Based on your preferences</span>
      </div>
      <div className="hscroll" data-testid="proposed">
        {top.map(({ trend: t, reasons }) => (
          <Link key={t.id} href={`/studio/new?trend=${t.id}&from=proposed`} className="proposal">
            <div className="proposal-img">
              <img src={`/mock/trend-${t.id}.jpg`} alt="" />
              {t.status === "rising" && <span className="badge rising">Rising</span>}
            </div>
            <div className="proposal-body">
              <div className="proposal-name">{t.name}</div>
              <div className="trend-stats">
                {t.meta.hashtag} · {t.meta.posts} posts
              </div>
              <div className="trend-why">{reasons.slice(0, 2).join(" · ") || t.meta.bestFor}</div>
              <span className="pill small block" style={{ marginTop: 12 }}>
                Use this look
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="section-title" style={{ margin: "26px 0 12px" }}>
        All trends this week
      </div>
      <div className="hscroll" data-testid="all-trends">
        {rest.map(({ trend: t }) => (
          <Link key={t.id} href={`/studio/new?trend=${t.id}&from=all_trends`} className="trend-tile">
            <img src={`/mock/trend-${t.id}.jpg`} alt="" />
            <span className={`badge trend-tile-badge ${t.meta.growth >= 20 ? "rising" : "steady-dark"}`}>+{t.meta.growth}%</span>
            <span className="trend-tile-name">{t.name}</span>
          </Link>
        ))}
      </div>

      {/* The creator's posts */}
      <div className="row-between" style={{ margin: "28px 0 12px" }}>
        <div className="section-title" style={{ margin: 0 }}>
          Your posts
        </div>
        {posts && posts.length > 0 && <span className="see-all">{posts.length}</span>}
      </div>
      {posts === null ? (
        <div className="grid two">
          {[0, 1].map((i) => (
            <div key={i} className="tile" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="card empty" data-testid="posts-empty">
          <div style={{ fontWeight: 600, fontSize: 16 }}>No posts yet</div>
          <ol className="how">
            <li>Add photos from one trip or weekend</li>
            <li>Pick a look proposed for you</li>
            <li>Get one consistent carousel, ready to post</li>
          </ol>
          <div className="note">Finished posts are saved here, on this device only.</div>
        </div>
      ) : (
        <div className="grid two" data-testid="posts-grid">
          {posts.map((p) => (
            <Link key={p.id} href={`/studio/post/${p.id}`} className="set-card">
              <div className="tile">
                <img src={p.cover} alt="" />
                <span className="tag label">{p.count} photos</span>
              </div>
              <div className="set-card-name">{p.trendName}</div>
              <div className="set-card-meta">{timeAgo(p.createdAt)}</div>
            </Link>
          ))}
        </div>
      )}
      <p className="note" style={{ marginTop: 18 }}>
        Posts and preferences are saved on this device only; photos are never stored on our servers. Trend numbers are illustrative in this prototype.
      </p>

      {editing && <PrefsSheet prefs={prefs} onSave={onSave} onClose={() => setEditing(false)} />}
    </main>
  );
}
