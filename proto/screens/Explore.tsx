"use client";

import { useState } from "react";
import { EXPLORE, EXPLORE_FILTERS, aesthetic, exploreItems, photo, type ExploreItem } from "../data.ts";
import { formatWord, useProto } from "../store.tsx";
import { IconBack, IconPlay, Shot } from "../ui.tsx";

/** Opens an Explore item: trends go to the chat, templates to the template, styles to a chat in that look. */
export function useOpenExplore() {
  const { push } = useProto();
  return (x: ExploreItem) => {
    if (x.kind === "trend") push({ name: "chat", entry: { kind: "trend", id: x.ref } });
    else if (x.kind === "template") push({ name: "template", id: x.ref });
    else push({ name: "chat", entry: { kind: "style", id: x.ref } });
  };
}

function Filters({ value, onChange }: { value: string; onChange: (f: string) => void }) {
  return (
    <div className="x-filters" role="tablist" aria-label="Explore filters">
      {EXPLORE_FILTERS.map((f) => (
        <button key={f} role="tab" aria-selected={value === f} className={value === f ? "on" : ""} onClick={() => onChange(f)}>
          {f}
        </button>
      ))}
    </div>
  );
}

function Card({ x, onOpen }: { x: ExploreItem; onOpen: () => void }) {
  const kindLabel = x.kind === "trend" ? "Trend" : x.kind === "template" ? "Template" : "Style";
  return (
    <button className="x-card" onClick={onOpen} data-testid={`x-${x.id}`}>
      <Shot src={photo(x.cover).src} look={aesthetic(x.aesthetic).look} className="x-img">
        {x.badge && <span className={`x-badge${x.kind === "trend" ? " hot" : ""}`}>{x.badge}</span>}
        <span className="fmt">
          {x.format !== "carousel" && <IconPlay size={10} />} {formatWord(x.format).replace(/^./, (c) => c.toUpperCase())}
        </span>
      </Shot>
      <span className="x-name">{x.name}</span>
      <span className="x-kind">{kindLabel}</span>
    </button>
  );
}

/** Dashboard section: a filtered preview of Explore with "See all". */
export function ExploreSection() {
  const { s, push } = useProto();
  const open = useOpenExplore();
  const [filter, setFilter] = useState<string>("For you");
  const items = exploreItems(filter, s).slice(0, 6);
  return (
    <section data-testid="explore-section">
      <div className="sec" style={{ marginBottom: 10 }}>
        <h2>Explore styles</h2>
        <button className="see-all-btn" onClick={() => push({ name: "explore", filter })} data-testid="explore-all">
          See all {EXPLORE.length}
        </button>
      </div>
      <Filters value={filter} onChange={setFilter} />
      <div className="x-grid three">
        {items.map((x) => (
          <Card key={x.id} x={x} onOpen={() => open(x)} />
        ))}
      </div>
    </section>
  );
}

/** Full Explore screen: every trend, template and style. */
export default function Explore({ filter: initialFilter }: { filter?: string }) {
  const { s, back } = useProto();
  const open = useOpenExplore();
  const [filter, setFilter] = useState<string>(initialFilter ?? "For you");
  const items = exploreItems(filter, s);
  return (
    <div className="scr" data-testid="explore">
      <header className="p-top">
        <button className="p-icon" aria-label="Back" onClick={back}>
          <IconBack />
        </button>
        <div className="p-title sm">Explore styles</div>
        <span style={{ width: 40 }} />
      </header>
      <p className="own-p" style={{ marginBottom: 12 }}>
        Trends, templates and looks, all made with your photos.
      </p>
      <Filters value={filter} onChange={setFilter} />
      <div className="x-grid three" data-testid="explore-grid">
        {items.map((x) => (
          <Card key={x.id} x={x} onOpen={() => open(x)} />
        ))}
      </div>
    </div>
  );
}
