"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { IconHome, IconPlus, IconSparkle, IconUser, IconWand, IconLayers, IconVideo, IconChevron } from "./icons.tsx";
import { MOCK_MSG, useToast } from "./Toast.tsx";

const TABS = [
  { href: "/", label: "Home", icon: IconHome },
  { href: "/ai-photos", label: "AI Photos", icon: IconSparkle },
  { href: "/profile", label: "Profile", icon: IconUser },
];

export default function TabBar() {
  const path = usePathname();
  const router = useRouter();
  const [sheet, setSheet] = useState(false);
  const toast = useToast();

  const tab = (t: (typeof TABS)[number]) => (
    <Link key={t.href} href={t.href} className={`tab${path === t.href ? " on" : ""}`}>
      <t.icon />
      <span>{t.label}</span>
    </Link>
  );

  return (
    <>
      <nav className="tabbar" aria-label="Main">
        {tab(TABS[0])}
        {tab(TABS[1])}
        <button className="tab-create" aria-label="Create" onClick={() => setSheet(true)}>
          <IconPlus size={26} />
        </button>
        {tab(TABS[2])}
        <button className="tab" onClick={() => toast.show(MOCK_MSG)}>
          <IconVideo />
          <span>Video</span>
        </button>
      </nav>

      {sheet && (
        <div className="sheet-backdrop" onClick={() => setSheet(false)}>
          <div className="sheet" role="dialog" aria-label="Create" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-grip" />
            <div className="sheet-title">Create</div>
            <button className="sheet-row" onClick={() => toast.show(MOCK_MSG)}>
              <span className="sheet-ic"><IconWand /></span>
              <span className="sheet-txt"><b>Enhance a photo</b><small>Sharpen, denoise, restore</small></span>
              <IconChevron size={18} />
            </button>
            <button className="sheet-row hl" onClick={() => router.push("/studio?from=create_sheet")}>
              <span className="sheet-ic"><IconLayers /></span>
              <span className="sheet-txt"><b>Creator Studio <em className="badge rising">New</em></b><small>One look for your whole carousel</small></span>
              <IconChevron size={18} />
            </button>
            <button className="sheet-row" onClick={() => toast.show(MOCK_MSG)}>
              <span className="sheet-ic"><IconSparkle /></span>
              <span className="sheet-txt"><b>AI Photos</b><small>Generate new photos of you</small></span>
              <IconChevron size={18} />
            </button>
          </div>
        </div>
      )}
      {toast.node}
    </>
  );
}
