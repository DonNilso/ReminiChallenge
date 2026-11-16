"use client";

import { useState } from "react";
import { GOALS, INTERESTS, PLATFORMS, VIBES, type Prefs } from "@/lib/shared/prefs.ts";

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

/** Edit the creator account and preferences that drive "Proposed for you". */
export default function PrefsSheet({ prefs, onSave, onClose }: { prefs: Prefs; onSave: (p: Prefs) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<Prefs>(prefs);

  const chips = (options: readonly string[], key: "interests" | "vibes" | "platforms") => (
    <div className="pref-chips">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          className={`pref-chip toggle${draft[key].includes(o) ? " on" : ""}`}
          aria-pressed={draft[key].includes(o)}
          onClick={() => setDraft((d) => ({ ...d, [key]: toggle(d[key], o) }))}
        >
          {o}
        </button>
      ))}
    </div>
  );

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <form
        className="sheet prefs-sheet"
        role="dialog"
        aria-label="Account and preferences"
        data-testid="prefs-sheet"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          const handle = draft.handle.trim();
          onSave({ ...draft, handle: handle ? (handle.startsWith("@") ? handle : `@${handle}`) : prefs.handle });
        }}
      >
        <div className="sheet-grip" />
        <div className="sheet-title">Account & preferences</div>

        <label className="pref-label" htmlFor="handle">
          Handle
        </label>
        <input id="handle" className="text-input" value={draft.handle} onChange={(e) => setDraft((d) => ({ ...d, handle: e.target.value }))} maxLength={30} />

        <div className="pref-label">Where you post</div>
        {chips(PLATFORMS, "platforms")}

        <div className="pref-label">What you post</div>
        {chips(INTERESTS, "interests")}

        <div className="pref-label">Looks you like</div>
        {chips(VIBES, "vibes")}

        <div className="pref-label">Posting goal</div>
        <div className="seg" role="group" aria-label="Posts per week">
          {GOALS.map((g) => (
            <button key={g} type="button" className={draft.weeklyGoal === g ? "on" : ""} onClick={() => setDraft((d) => ({ ...d, weeklyGoal: g }))}>
              {g}/week
            </button>
          ))}
        </div>

        <button type="submit" className="pill block" style={{ marginTop: 22 }} data-testid="save-prefs">
          Save
        </button>
        <p className="note" style={{ textAlign: "center", marginTop: 8 }}>
          Connecting a real Instagram/TikTok account is mocked in this prototype.
        </p>
      </form>
    </div>
  );
}
