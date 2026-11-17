"use client";

import { HUB, SUGGESTIONS, aesthetic, photo } from "../data.ts";
import { useProto } from "../store.tsx";
import { Dots, IconSparkle, Shot } from "../ui.tsx";

/**
 * Creator Studio slide inside Remini's own onboarding (where most trials start).
 * "Set it up" goes into Creator Studio onboarding; "Maybe later" goes to Remini home.
 */
export default function Intro() {
  const { reset } = useProto();
  const sg = SUGGESTIONS[0];
  return (
    <div className="scr intro" data-testid="intro">
      <div className="intro-top">
        <span className="intro-k">Welcome to Remini</span>
        <Dots total={4} at={2} />
      </div>
      <div className="intro-stack">
        {sg.photos.slice(0, 3).map((id, i) => (
          <Shot key={id} src={photo(id).src} look={aesthetic(sg.aesthetic).look} className={`intro-ph i${i}`} />
        ))}
      </div>
      <span className="badge-new">NEW</span>
      <h1 className="intro-h">Creator Studio</h1>
      <p className="intro-p">{HUB.homeSub}</p>
      <ul className="intro-list">
        <li>
          <IconSparkle size={16} /> Bring any post or idea, or get ideas every week
        </li>
        <li>
          <IconSparkle size={16} /> Made from your own photos, in your style
        </li>
        <li>
          <IconSparkle size={16} /> Ready for Instagram, TikTok and Stories
        </li>
      </ul>
      <div className="intro-actions">
        <button className="pill-w block" onClick={() => reset([{ name: "home" }, { name: "onboarding", step: 0 }])} data-testid="intro-setup">
          Set up Creator Studio
        </button>
        <button className="link" onClick={() => reset({ name: "home" })}>
          Maybe later
        </button>
      </div>
    </div>
  );
}
