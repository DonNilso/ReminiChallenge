"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { TrendCard } from "../types.ts";
import Dock from "./Dock.tsx";
import { IconCamera, IconChat, IconFaceScan, IconGallery, IconGear, IconSearch, IconUser } from "./icons.tsx";
import SettingsSheet from "./SettingsSheet.tsx";
import { MOCK_MSG, useToast } from "./Toast.tsx";

/** Placeholder wordmark: the real app's name and logo are deliberately not used. */
export const HOST_APP_NAME = "Photo AI";

const SEARCH_ITEMS = [
  { label: "Creator Studio", hint: "One look for your whole carousel", keywords: "creator studio carousel set trend look instagram post weekend trip filter preset", href: "/studio?from=search" },
  { label: "Enhance", hint: "Make any photo HD", keywords: "enhance hd sharpen quality blur", href: null },
  { label: "AI Photos", hint: "Generate new photos of you", keywords: "ai photos avatar headshot model", href: null },
  { label: "AI Filter", hint: "Restyle a single photo", keywords: "ai filter style cartoon", href: null },
  { label: "Retouch", hint: "Face, hair, body", keywords: "retouch face hair body muscles", href: null },
];

export default function HomeScreen({ trends }: { trends: TrendCard[] }) {
  const toast = useToast();
  const router = useRouter();
  const mock = () => toast.show(MOCK_MSG);
  const [settings, setSettings] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [enhanceTab, setEnhanceTab] = useState<"photos" | "videos">("photos");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SEARCH_ITEMS;
    return SEARCH_ITEMS.filter((i) => i.label.toLowerCase().includes(q) || i.keywords.includes(q));
  }, [query]);

  return (
    <div className="host">
      <header className="host-top">
        <div className="wordmark">{HOST_APP_NAME}</div>
        <div className="host-top-right">
          <button className="icon-btn" aria-label="Settings" onClick={() => setSettings(true)} data-testid="open-settings">
            <IconGear size={26} />
          </button>
          <button className="avatar" aria-label="Profile" onClick={() => setSettings(true)}>
            <IconUser size={20} />
          </button>
        </div>
      </header>

      {/* Integration point: search */}
      <div className="search-wrap">
        <label className="search">
          <IconSearch size={22} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setSearching(true)}
            onBlur={() => setTimeout(() => setSearching(false), 150)}
            placeholder={`Search "carousel"`}
            aria-label="Search"
            data-testid="search"
          />
        </label>
        {searching && (
          <div className="search-results" role="listbox">
            {results.length === 0 && <div className="note" style={{ padding: 12 }}>No results</div>}
            {results.map((r) => (
              <button
                key={r.label}
                className="search-row"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => (r.href ? router.push(r.href) : mock())}
              >
                <b>
                  {r.label} {r.href && <span className="badge rising">New</span>}
                </b>
                <small>{r.hint}</small>
              </button>
            ))}
          </div>
        )}
      </div>

      <SectionHead title="Retouch photos" emoji="⭐" action="See all" onAction={mock} />
      <div className="hscroll">
        {[
          ["Face contour", "/mock/hero-after.jpg"],
          ["Change hair", "/mock/photo-2.jpg"],
          ["Sky swap", "/mock/photo-4.jpg"],
          ["Relight", "/mock/photo-3.jpg"],
        ].map(([label, src]) => (
          <button key={label} className="pack-tile" onClick={mock}>
            <img src={src} alt="" />
            <span className="pack-ic">
              <IconFaceScan size={18} />
            </span>
            <span className="pack-label">{label}</span>
          </button>
        ))}
      </div>

      {/* Integration point: launch section, same pattern as the trend / pack rows */}
      <SectionHead
        title="Creator Studio"
        emoji="🎞️"
        badge="New"
        action="Make a set"
        onAction={() => router.push("/studio?from=home_section")}
        testId="studio-section"
      />
      <p className="section-sub">Real photos from your trip, one trending look for the whole carousel.</p>
      <div className="hscroll" data-testid="home-trends">
        <Link href="/studio/new?from=home_weekend" className="pack-tile weekend-tile">
          <div className="weekend-stack" aria-hidden>
            <img src="/mock/set-1.jpg" alt="" />
            <img src="/mock/set-2.jpg" alt="" />
            <img src="/mock/set-3.jpg" alt="" />
          </div>
          <span className="weekend-text">
            <b>Your weekend</b>
            <small>Turn it into a set</small>
          </span>
        </Link>
        {trends.map((t) => (
          <Link key={t.id} href={`/studio/new?trend=${t.id}&from=home_trends`} className="pack-tile">
            <img src={`/mock/trend-${t.id}.jpg`} alt="" />
            {t.status === "rising" && <span className="badge rising pack-badge">Rising</span>}
            <span className="pack-label">{t.name}</span>
          </Link>
        ))}
      </div>

      <SectionHead title="Enhance" emoji="✨" />
      <div className="enhance-bar">
        <div className="seg-pills">
          <button className={enhanceTab === "photos" ? "on" : ""} onClick={() => setEnhanceTab("photos")}>
            Photos
          </button>
          <button className={enhanceTab === "videos" ? "on" : ""} onClick={() => setEnhanceTab("videos")}>
            Videos
          </button>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="round-btn" aria-label="Camera" onClick={mock}>
            <IconCamera />
          </button>
          <button className="round-btn" aria-label="Gallery" onClick={mock}>
            <IconGallery />
          </button>
        </div>
      </div>
      <div className="hscroll">
        {["/mock/photo-1.jpg", "/mock/photo-3.jpg", "/mock/photo-2.jpg", "/mock/photo-4.jpg", "/mock/hero-after.jpg"].map((src) => (
          <button key={src} className="recent-tile" onClick={mock}>
            <img src={src} alt="" />
          </button>
        ))}
      </div>

      <SectionHead title="Latest viral trends" emoji="💫" />
      <div className="hscroll">
        {["/mock/trend-y2k-flash.jpg", "/mock/trend-old-money.jpg", "/mock/trend-film-grain.jpg"].map((src) => (
          <button key={src} className="wide-tile" onClick={mock}>
            <img src={src} alt="" />
          </button>
        ))}
      </div>

      <SectionHead title="Other modeling packs" action="See all" onAction={mock} />
      <div className="hscroll">
        {[
          ["Iconic", "/mock/trend-y2k-flash.jpg"],
          ["Golden hour", "/mock/trend-golden-hour.jpg"],
          ["Cozy", "/mock/trend-candid.jpg"],
        ].map(([label, src]) => (
          <button key={label} className="pack-tile" onClick={mock}>
            <img src={src} alt="" />
            <span className="pack-label">{label}</span>
          </button>
        ))}
      </div>

      <button className="chat-fab" aria-label="Assistant" onClick={mock}>
        <IconChat size={30} />
      </button>
      <Dock onMock={mock} />
      {settings && <SettingsSheet onClose={() => setSettings(false)} onMock={mock} />}
      {toast.node}
    </div>
  );
}

function SectionHead(props: { title: string; emoji?: string; badge?: string; action?: string; onAction?: () => void; testId?: string }) {
  return (
    <div className="sec-head" data-testid={props.testId}>
      <h2>
        {props.title} {props.emoji && <span aria-hidden>{props.emoji}</span>}
        {props.badge && <span className="badge rising">{props.badge}</span>}
      </h2>
      {props.action && (
        <button className="pill ghost small" onClick={props.onAction}>
          {props.action}
        </button>
      )}
    </div>
  );
}
