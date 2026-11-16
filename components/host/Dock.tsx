"use client";

import Link from "next/link";
import { IconFaceScan, IconLayers, IconSparkle, IconVideoSpark } from "./icons.tsx";

/**
 * Bottom tool dock. The last slot (gradient tile + "NEW" badge) is where the app
 * promotes a new feature; Creator Studio takes that slot.
 */
export default function Dock({ onMock }: { onMock: () => void }) {
  return (
    <nav className="dock" aria-label="Tools">
      <button className="dock-item" onClick={onMock}>
        <span className="dock-ic">
          <IconSparkle size={28} />
        </span>
        <span>Enhance</span>
      </button>
      <button className="dock-item" onClick={onMock}>
        <span className="dock-ic photo">
          <img src="/mock/photo-1.jpg" alt="" />
          <span className="dock-badge">Ready!</span>
        </span>
        <span>AI Photos</span>
      </button>
      <button className="dock-item" onClick={onMock}>
        <span className="dock-ic">
          <IconFaceScan size={28} />
        </span>
        <span>AI Filter</span>
      </button>
      <button className="dock-item" onClick={onMock}>
        <span className="dock-ic">
          <IconVideoSpark size={28} />
        </span>
        <span>AI Videos</span>
      </button>
      <Link href="/studio?from=dock" className="dock-item" data-testid="dock-studio">
        <span className="dock-ic promo-ic">
          <IconLayers size={28} />
          <span className="dock-badge">New</span>
        </span>
        <span>Studio</span>
      </Link>
    </nav>
  );
}
