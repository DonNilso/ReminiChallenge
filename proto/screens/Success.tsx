"use client";

import { useEffect, useState } from "react";
import { FORMATS, SUGGESTIONS } from "../data.ts";
import { useProto } from "../store.tsx";
import { GoalRing, IconCheck } from "../ui.tsx";
import { SuggestionCard } from "./Dashboard.tsx";

export default function Success() {
  const { s, reset, push, isPro, formatLocked } = useProto();
  const [shown, setShown] = useState(Math.max(0, s.posted - 1));
  useEffect(() => {
    const t = setTimeout(() => setShown(s.posted), 450);
    return () => clearTimeout(t);
  }, [s.posted]);
  const share = s.lastShare ?? { platform: "Instagram", format: "carousel" as const };
  const goal = s.goal === 7 ? 7 : s.goal;
  const next = SUGGESTIONS.find((x) => x.format !== share.format) ?? SUGGESTIONS[1];
  const toStudio = () => reset([{ name: "home" }, { name: "dashboard" }]);
  return (
    <div className="scr success" data-testid="success">
      <div className="ok-burst">
        <span className="ok-check">
          <IconCheck size={40} />
        </span>
      </div>
      <h1 className="ok-title">{share.platform === "Save to Photos" ? "Saved to Photos" : `Opened in ${share.platform}`}</h1>
      <p className="ok-sub">
        Your {FORMATS[share.format].label} is ready to post.
        {share.format !== "carousel" && " Add a trending sound before you share."}
      </p>
      <div className="ok-goal">
        <GoalRing done={shown} goal={goal} size={64} />
        <div>
          <div className="goal-t" data-testid="success-goal">
            {s.posted} of {goal} posted this week
          </div>
          <div className="goal-s">{s.posted >= goal ? "Weekly goal reached 🎉" : `${goal - s.posted} more to hit your goal`}</div>
        </div>
      </div>
      <div className="sec" style={{ marginTop: 26 }}>
        <h2>Next up for you</h2>
      </div>
      <SuggestionCard sg={next} pro={isPro} locked={formatLocked(next.format)} onOpen={() => (toStudio(), setTimeout(() => push({ name: "chat", entry: { kind: "suggestion", id: next.id } }), 0))} />
      <div className="ok-actions">
        <button className="pill-w block" onClick={toStudio} data-testid="back-to-studio">
          Back to Creator Studio
        </button>
      </div>
    </div>
  );
}
