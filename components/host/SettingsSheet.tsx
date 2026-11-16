"use client";

import Link from "next/link";
import { IconChevron, IconClose, IconDoc, IconEdit, IconExternal, IconHelp, IconLayers, IconPlus, IconShareNodes, IconSupport, IconUser } from "./icons.tsx";

type Row = { label: string; icon: React.ReactNode; external?: boolean };

export default function SettingsSheet({ onClose, onMock }: { onClose: () => void; onMock: () => void }) {
  const social: Row[] = [
    { label: "Share app", icon: <IconShareNodes /> },
    { label: "Instagram", icon: <span className="soc">IG</span>, external: true },
    { label: "Facebook", icon: <span className="soc">f</span>, external: true },
    { label: "TikTok", icon: <span className="soc">TT</span>, external: true },
  ];
  const help: Row[] = [
    { label: "Help center", icon: <IconHelp />, external: true },
    { label: "Contact support", icon: <IconSupport />, external: true },
    { label: "Subscription info", icon: <IconDoc /> },
  ];
  const rows = (items: Row[]) =>
    items.map((r) => (
      <button key={r.label} className="set-row" onClick={onMock}>
        <span className="set-row-ic">{r.icon}</span>
        <span style={{ flex: 1 }}>{r.label}</span>
        {r.external ? <IconExternal size={20} /> : <IconChevron size={18} />}
      </button>
    ));

  return (
    <div className="settings" role="dialog" aria-label="Settings" data-testid="settings">
      <div className="settings-head">
        <button className="icon-btn" aria-label="Close" onClick={onClose}>
          <IconClose />
        </button>
        <div className="settings-title">Settings</div>
        <span style={{ width: 36 }} />
      </div>

      <div className="set-card-box">
        <div className="set-card-head">
          <h3>AI profile</h3>
          <button className="pill ghost small" onClick={onMock}>
            Manage profiles <IconEdit size={16} />
          </button>
        </div>
        <div style={{ display: "flex", gap: 18 }}>
          <button className="profile-add" onClick={onMock}>
            <span className="profile-box dashed">
              <IconPlus />
            </span>
            <span>Add profile</span>
          </button>
          <button className="profile-add on" onClick={onMock}>
            <span className="profile-box">
              <IconUser size={34} />
            </span>
            <span>Person 1</span>
          </button>
        </div>
      </div>

      {/* Integration point: settings */}
      <div className="set-card-box">
        <div className="set-card-head">
          <h3>
            Creator Studio <span className="badge rising">New</span>
          </h3>
        </div>
        <Link href="/studio?from=settings" className="set-row" data-testid="settings-studio">
          <span className="set-row-ic">
            <IconLayers />
          </span>
          <span style={{ flex: 1 }}>Your posts & preferences</span>
          <IconChevron size={18} />
        </Link>
        <button className="set-row" onClick={onMock}>
          <span className="set-row-ic">
            <IconShareNodes />
          </span>
          <span style={{ flex: 1 }}>Default export: Instagram 4:5</span>
          <IconChevron size={18} />
        </button>
      </div>

      <div className="set-card-box">
        <div className="set-card-head">
          <h3>Social media</h3>
        </div>
        {rows(social)}
      </div>
      <div className="set-card-box">
        <div className="set-card-head">
          <h3>Help</h3>
        </div>
        {rows(help)}
      </div>
    </div>
  );
}
