"use client";

import Link from "next/link";
import { IconChevron, IconGear, IconLayers } from "./icons.tsx";
import { MOCK_MSG, useToast } from "./Toast.tsx";

export function AiPhotosScreen() {
  const toast = useToast();
  const styles = ["Studio portrait", "Old money", "90s yearbook", "Travel", "Business", "Golden hour"];
  return (
    <div className="host">
      <header className="host-top">
        <div className="host-h1">AI Photos</div>
      </header>
      <p className="sub">Mock tab of the host app. Generated photos of you, a separate product from Creator Studio, which keeps your real photos.</p>
      <div className="grid two">
        {styles.map((s, i) => (
          <button key={s} className="tile mock-tile" onClick={() => toast.show(MOCK_MSG)}>
            <img src={`/mock/photo-${(i % 4) + 1}.jpg`} alt="" />
            <span className="tag label">{s}</span>
          </button>
        ))}
      </div>
      {toast.node}
    </div>
  );
}

export function ProfileScreen() {
  const toast = useToast();
  const rows = ["My creations", "Restore purchases", "Help", "Privacy"];
  return (
    <div className="host">
      <header className="host-top">
        <div className="host-h1">Profile</div>
        <button className="icon-btn" aria-label="Settings" onClick={() => toast.show(MOCK_MSG)}>
          <IconGear />
        </button>
      </header>
      <div className="card pro-card">
        <div>
          <div className="label" style={{ color: "var(--accent)" }}>Free plan</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>Unlock PRO</div>
          <div className="note">Full-resolution exports, unlimited enhances, Creator Studio sets.</div>
        </div>
        <button className="pill small" onClick={() => toast.show(MOCK_MSG)}>
          Try free
        </button>
      </div>
      <Link href="/studio?from=profile" className="list-row">
        <span className="sheet-ic"><IconLayers /></span>
        <span style={{ flex: 1 }}>Creator Studio</span>
        <IconChevron size={18} />
      </Link>
      {rows.map((r) => (
        <button key={r} className="list-row" onClick={() => toast.show(MOCK_MSG)}>
          <span style={{ flex: 1 }}>{r}</span>
          <IconChevron size={18} />
        </button>
      ))}
      {toast.node}
    </div>
  );
}
