"use client";

import Link from "next/link";
import { useState } from "react";
import type { TrendCard } from "../types.ts";
import { IconDrop, IconFocus, IconGear, IconSparkle, IconUser, IconVideo, IconWand } from "./icons.tsx";
import { MOCK_MSG, useToast } from "./Toast.tsx";

const TOOLS = [
  { label: "Enhance", icon: IconWand },
  { label: "Unblur", icon: IconFocus },
  { label: "Colorize", icon: IconDrop },
  { label: "Video", icon: IconVideo },
  { label: "AI Photos", icon: IconSparkle },
];

export default function HomeScreen({ trends }: { trends: TrendCard[] }) {
  const toast = useToast();
  const [split, setSplit] = useState(50);
  const mock = () => toast.show(MOCK_MSG);

  return (
    <div className="host">
      <header className="host-top">
        <Link className="avatar" aria-label="Profile" href="/profile">
          <IconUser size={18} />
        </Link>
        <div className="host-top-right">
          <button className="pro-pill" onClick={mock}>
            PRO
          </button>
          <button className="icon-btn" aria-label="Settings" onClick={mock}>
            <IconGear />
          </button>
        </div>
      </header>

      {/* Existing core feature (mock) */}
      <section className="hero">
        <div className="hero-img">
          <img src="/mock/hero-after.jpg" alt="" />
          <img src="/mock/hero-before.jpg" alt="" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }} />
          <div className="hero-split" style={{ left: `${split}%` }} />
          <input
            className="hero-range"
            type="range"
            min={5}
            max={95}
            value={split}
            onChange={(e) => setSplit(Number(e.target.value))}
            aria-label="Compare before and after"
          />
          <span className="tag label" style={{ left: 12, right: "auto" }}>
            Before
          </span>
          <span className="tag label after" style={{ left: "auto", right: 12 }}>
            After
          </span>
        </div>
        <div className="hero-foot">
          <div>
            <div className="hero-title">Enhance</div>
            <div className="hero-sub">Make any photo HD in one tap</div>
          </div>
          <button className="pill small" onClick={mock}>
            Try now
          </button>
        </div>
      </section>

      {/* Integration point 1: launch banner */}
      <Link href="/studio?from=home_banner" className="studio-banner" data-testid="studio-banner">
        <div className="studio-banner-text">
          <span className="badge rising">New</span>
          <div className="studio-banner-title">Creator Studio</div>
          <div className="studio-banner-sub">Turn your weekend into one on-trend carousel. Real photos, one look.</div>
          <span className="pill small">Make a set</span>
        </div>
        <div className="studio-banner-stack" aria-hidden>
          <img src="/mock/set-1.jpg" alt="" />
          <img src="/mock/set-2.jpg" alt="" />
          <img src="/mock/set-3.jpg" alt="" />
        </div>
      </Link>

      <div className="host-section-title">Tools</div>
      <div className="tools">
        {TOOLS.map((t) => (
          <button key={t.label} className="tool" onClick={mock}>
            <span className="tool-ic">
              <t.icon />
            </span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Integration point 2: trends deep-link into Creator Studio with the look preselected */}
      <div className="row-between" style={{ margin: "26px 0 12px" }}>
        <div className="host-section-title" style={{ margin: 0 }}>
          Trends for you
        </div>
        <Link href="/studio?from=home_trends_all" className="see-all">
          See all
        </Link>
      </div>
      <div className="hscroll" data-testid="home-trends">
        {trends.map((t) => (
          <Link key={t.id} href={`/studio/new?trend=${t.id}&from=home_trends`} className="trend-tile">
            <img src={`/mock/trend-${t.id}.jpg`} alt="" />
            {t.status === "rising" && <span className="badge rising trend-tile-badge">Rising</span>}
            <span className="trend-tile-name">{t.name}</span>
          </Link>
        ))}
      </div>

      <div className="host-section-title">AI Photos</div>
      <button className="promo" onClick={mock}>
        <img src="/mock/photo-2.jpg" alt="" />
        <div>
          <b>Your AI photoshoot</b>
          <small>Upload selfies, get 50 new photos</small>
        </div>
      </button>
      {toast.node}
    </div>
  );
}
