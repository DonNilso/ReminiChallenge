"use client";

import { useState } from "react";
import { HOME, HUB, SUGGESTIONS, USER, aesthetic, photo } from "../data.ts";
import { useProto } from "../store.tsx";
import { IconCamera, IconChat, IconFaceScan, IconGallery, IconGear, IconLayers, IconSearch, IconSparkle, IconVideoSpark, Shot, longPress } from "../ui.tsx";

/** Remini home (host app), with Creator Studio as the prominent new card and the dock's NEW slot. */
export default function Home() {
  const { openStudio, openSheet, s } = useProto();
  const [toast, setToast] = useState<string | null>(null);
  const mock = () => {
    setToast("Only Creator Studio is clickable in this prototype");
    setTimeout(() => setToast(null), 1800);
  };
  const sg = SUGGESTIONS[0];
  const look = aesthetic(sg.aesthetic).look; // the entry card sells the look
  return (
    <div className="scr home">
      <header className="h-top">
        <div className="wordmark" {...longPress(() => openSheet({ kind: "debug" }))} data-testid="wordmark">
          Remini
        </div>
        <div className="h-right">
          <button className="p-icon" aria-label="Settings" onClick={mock}>
            <IconGear size={26} />
          </button>
          <img className="h-avatar" src={USER.avatar} alt="Profile" />
        </div>
      </header>
      <label className="h-search">
        <IconSearch size={22} />
        <span>Search “Creator Studio”</span>
      </label>

      {/* Entry point: Creator Studio card */}
      <button className="cs-card" onClick={() => openStudio()} data-testid="cs-card">
        <div className="cs-collage">
          {sg.photos.slice(0, 3).map((id, i) => (
            <Shot key={id} src={photo(id).src} look={look} className={`cs-ph c${i}`} />
          ))}
        </div>
        <div className="cs-text">
          <span className="badge-new">NEW</span>
          <div className="cs-title">Creator Studio</div>
          <div className="cs-sub">{HUB.homeSub}</div>
          <span className="cs-cta">{s.onboarded ? `Open your hub · ${SUGGESTIONS.length} ideas ready` : "Get started"} →</span>
        </div>
      </button>

      <div className="h-sec">
        <h2>Retouch photos ⭐</h2>
        <button className="pill-o sm" onClick={mock}>
          See all
        </button>
      </div>
      <div className="hs">
        {HOME.retouch.map((r) => (
          <button key={r.label} className="pack" onClick={mock}>
            <img src={r.src} alt="" />
            <span className="pack-ic">
              <IconFaceScan size={16} />
            </span>
            <span className="pack-l">{r.label}</span>
          </button>
        ))}
      </div>

      <div className="h-sec">
        <h2>Enhance ✨</h2>
      </div>
      <div className="h-enh">
        <div className="h-seg">
          <span className="on">Photos</span>
          <span>Videos</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="round" aria-label="Camera" onClick={mock}>
            <IconCamera />
          </button>
          <button className="round" aria-label="Gallery" onClick={mock}>
            <IconGallery />
          </button>
        </div>
      </div>
      <div className="hs">
        {HOME.recent.map((id) => (
          <button key={id} className="recent" onClick={mock}>
            <img src={photo(id).src} alt="" />
          </button>
        ))}
      </div>

      <div className="h-sec">
        <h2>Latest viral trends 💫</h2>
      </div>
      <div className="hs">
        {HOME.viral.map((src) => (
          <button key={src} className="wide" onClick={mock}>
            <img src={src} alt="" />
          </button>
        ))}
      </div>

      <div className="h-sec">
        <h2>Modeling packs</h2>
        <button className="pill-o sm" onClick={mock}>
          See all
        </button>
      </div>
      <div className="hs">
        {HOME.packs.map((r) => (
          <button key={r.label} className="pack" onClick={mock}>
            <img src={r.src} alt="" />
            <span className="pack-l">{r.label}</span>
          </button>
        ))}
      </div>
      <div style={{ height: 150 }} />

      <button className="fab" aria-label="Assistant" onClick={mock}>
        <IconChat size={28} />
      </button>
      <nav className="dock">
        {[
          { l: "Enhance", i: <IconSparkle size={26} /> },
          { l: "AI Photos", i: <img src="/p/ex-portrait.jpg" alt="" />, badge: "READY!", photo: true },
          { l: "AI Filter", i: <IconFaceScan size={26} /> },
          { l: "AI Videos", i: <IconVideoSpark size={26} /> },
        ].map((d) => (
          <button key={d.l} className="dk" onClick={mock}>
            <span className={`dk-ic${d.photo ? " photo" : ""}`}>
              {d.i}
              {d.badge && <span className="dk-badge">{d.badge}</span>}
            </span>
            <span>{d.l}</span>
          </button>
        ))}
        <button className="dk" onClick={() => openStudio()} data-testid="dock-studio">
          <span className="dk-ic promo">
            <IconLayers size={26} />
            <span className="dk-badge light">NEW</span>
          </span>
          <span>Studio</span>
        </button>
      </nav>
      {toast && <div className="p-toast">{toast}</div>}
    </div>
  );
}
