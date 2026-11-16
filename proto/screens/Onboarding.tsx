"use client";

import { useEffect, useMemo, useState } from "react";
import { AESTHETICS, GOALS, INSPIRATION_UPLOADS, PLATFORMS, SUGGESTIONS, TRENDS, USER, aesthetic, photo, trendSuggestion } from "../data.ts";
import { useProto } from "../store.tsx";
import { Dots, IconBack, IconCheck, IconImage, IconShield, IconTrend, IconUpload, Shot } from "../ui.tsx";
import { SuggestionCard } from "./Dashboard.tsx";

const STEPS = 7;

export default function Onboarding({ step }: { step: number }) {
  const { s, set, replace, back, reset, openSheet, isPro, formatLocked } = useProto();
  const go = (n: number) => replace({ name: "onboarding", step: n });
  const prev = () => (step === 0 ? back() : go(step - 1));
  const finish = () => {
    set({ onboarded: true });
    reset([{ name: "home" }, { name: "dashboard" }]);
  };

  return (
    <div className={`scr onb step${step}`} data-testid={`onb-${step}`}>
      <header className="onb-top">
        <button className="p-icon" aria-label="Back" onClick={prev}>
          <IconBack />
        </button>
        <Dots total={STEPS} at={step} />
        <span style={{ width: 40 }} />
      </header>
      <div className="onb-body" key={step}>
        {step === 0 && <Face onNext={() => go(1)} />}
        {step === 1 && <Platforms onNext={() => go(2)} />}
        {step === 2 && <Aesthetics onNext={() => go(3)} />}
        {step === 3 && <TrendPick onNext={() => go(4)} />}
        {step === 4 && <Inspiration onNext={() => go(5)} />}
        {step === 5 && <PhotoAccess onNext={() => go(6)} />}
        {step === 6 && (
          <Payoff
            onTrial={() => openSheet({ kind: "paywall", reason: "Try Remini Pro free", then: finish })}
            onSkip={finish}
            pro={isPro}
            locked={formatLocked}
            aesthetics={s.aesthetics}
            trendToTry={s.trendToTry}
          />
        )}
      </div>
    </div>
  );
}

function Face({ onNext }: { onNext: () => void }) {
  const [flash, setFlash] = useState(false);
  return (
    <>
      <h1 className="onb-h">Is this you?</h1>
      <p className="onb-p">We use your AI face profile so every post keeps you looking exactly like you.</p>
      <div className={`face${flash ? " flash" : ""}`}>
        <img src={USER.avatar} alt="Person 1" />
        <span className="face-label">Person 1</span>
      </div>
      <div className="onb-actions">
        <button className="pill-w block" onClick={onNext} data-testid="onb-next">
          Use this
        </button>
        <button
          className="pill-o block"
          onClick={() => {
            setFlash(true);
            setTimeout(() => setFlash(false), 700);
          }}
        >
          Retake
        </button>
      </div>
    </>
  );
}

function Platforms({ onNext }: { onNext: () => void }) {
  const { s, set } = useProto();
  const toggle = (p: string) => set((st) => ({ platforms: st.platforms.includes(p) ? st.platforms.filter((x) => x !== p) : [...st.platforms, p] }));
  return (
    <>
      <h1 className="onb-h">Where do you post?</h1>
      <p className="onb-p">We make each idea in the right format: 4:5 carousels, 9:16 Reels and Stories.</p>
      <div className="big-chips">
        {PLATFORMS.map((p) => (
          <button key={p} className={`big-chip${s.platforms.includes(p) ? " on" : ""}`} onClick={() => toggle(p)} aria-pressed={s.platforms.includes(p)}>
            {s.platforms.includes(p) && <IconCheck size={16} />} {p}
          </button>
        ))}
      </div>
      <h2 className="onb-h2">How often do you want to post?</h2>
      <div className="goal-seg">
        {GOALS.map((g) => (
          <button key={g.id} className={s.goal === g.id ? "on" : ""} onClick={() => set({ goal: g.id })}>
            {g.label}
          </button>
        ))}
      </div>
      <p className="onb-fine">Just a weekly goal. No calendars, no schedules.</p>
      <div className="onb-actions">
        <button className="pill-w block" onClick={onNext} disabled={s.platforms.length === 0} data-testid="onb-next">
          Continue
        </button>
      </div>
    </>
  );
}

function Aesthetics({ onNext }: { onNext: () => void }) {
  const { s, set } = useProto();
  const toggle = (id: string) => set((st) => ({ aesthetics: st.aesthetics.includes(id) ? st.aesthetics.filter((x) => x !== id) : [...st.aesthetics, id] }));
  return (
    <>
      <h1 className="onb-h">Choose your favourite aesthetics</h1>
      <p className="onb-p">Pick as many as you like. Your weekly ideas are made in these looks, and you can change them anytime.</p>
      <div className="ae-grid">
        {AESTHETICS.map((a) => {
          const on = s.aesthetics.includes(a.id);
          return (
            <button key={a.id} className={`ae${on ? " on" : ""}`} onClick={() => toggle(a.id)} aria-pressed={on} data-testid={`ae-${a.id}`}>
              <Shot src={a.cover} look={a.look} />
              <span className="ae-name">{a.name}</span>
              {on && (
                <span className="ae-check">
                  <IconCheck size={16} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="onb-actions sticky">
        <button className="pill-w block" onClick={onNext} disabled={s.aesthetics.length === 0} data-testid="onb-next">
          Continue · {s.aesthetics.length} selected
        </button>
      </div>
    </>
  );
}

function TrendPick({ onNext }: { onNext: () => void }) {
  const { s, set } = useProto();
  // Trends that match the chosen aesthetics first, then by momentum.
  const ordered = useMemo(
    () => [...TRENDS].sort((a, b) => Number(s.aesthetics.includes(b.id)) - Number(s.aesthetics.includes(a.id)) || b.growth - a.growth),
    [s.aesthetics],
  );
  const picked = TRENDS.find((t) => t.id === s.trendToTry);
  return (
    <>
      <h1 className="onb-h">Pick a trend to try</h1>
      <p className="onb-p">Rising right now. We'll make your first post in it, from your own photos.</p>
      <div className="tp-list" role="radiogroup" aria-label="Trends">
        {ordered.map((t) => {
          const on = s.trendToTry === t.id;
          return (
            <button key={t.id} role="radio" aria-checked={on} className={`tp${on ? " on" : ""}`} onClick={() => set({ trendToTry: t.id })} data-testid={`tp-${t.id}`}>
              <Shot src={`/p/${t.examples[0]}.jpg`} look={aesthetic(t.id).look} className="tp-ex" />
              <span className="tp-body">
                <span className="tp-name">
                  {t.name} {s.aesthetics.includes(t.id) && <span className="tag-you">Your style</span>}
                </span>
                <span className="tp-growth">
                  <IconTrend size={14} /> +{t.growth}% this week
                </span>
                <span className="tp-blurb">{t.blurb}</span>
              </span>
              <Shot src={photo(t.fromPhotos[0]).src} look={aesthetic(t.id).look} className="tp-you">
                <span className="tp-you-l">You</span>
              </Shot>
            </button>
          );
        })}
      </div>
      <div className="onb-actions sticky">
        <button className="pill-w block" onClick={onNext} disabled={!picked} data-testid="onb-next">
          {picked ? `Try ${picked.name}` : "Pick a trend"}
        </button>
        {!picked && (
          <button className="link" onClick={() => (set({ trendToTry: ordered[0].id }), onNext())}>
            Surprise me
          </button>
        )}
      </div>
    </>
  );
}

function Inspiration({ onNext }: { onNext: () => void }) {
  const { s, set } = useProto();
  const [uploading, setUploading] = useState(false);
  const upload = () => {
    setUploading(true);
    INSPIRATION_UPLOADS.forEach((_, i) => setTimeout(() => set({ inspirations: i + 1 }), 450 * (i + 1)));
    setTimeout(() => setUploading(false), 450 * INSPIRATION_UPLOADS.length + 100);
  };
  return (
    <>
      <span className="opt">Optional</span>
      <h1 className="onb-h">Add posts you love</h1>
      <p className="onb-p">Upload screenshots from Instagram, TikTok or Pinterest. We'll learn the look, not the content.</p>
      <div className="insp">
        {INSPIRATION_UPLOADS.slice(0, s.inspirations).map((u) => (
          <div key={u.src} className="insp-shot">
            <img src={u.src} alt="" />
            <span className="insp-src">{u.source}</span>
          </div>
        ))}
        {s.inspirations < INSPIRATION_UPLOADS.length && (
          <button className="insp-add" onClick={upload} disabled={uploading} data-testid="upload">
            {uploading ? <span className="spin" /> : <IconUpload size={26} />}
            <span>{uploading ? "Uploading…" : "Add screenshots"}</span>
          </button>
        )}
      </div>
      <div className="privacy-note">
        <IconShield size={18} /> You choose what to share. We never read your account.
      </div>
      <div className="onb-actions">
        <button className="pill-w block" onClick={onNext} data-testid="onb-next">
          {s.inspirations ? "Continue" : "Skip for now"}
        </button>
      </div>
    </>
  );
}

function PhotoAccess({ onNext }: { onNext: () => void }) {
  const { set } = useProto();
  const [prompt, setPrompt] = useState(false);
  const answer = (v: "full" | "limited" | "none") => {
    set({ photoAccess: v });
    setPrompt(false);
    setTimeout(onNext, 200);
  };
  return (
    <>
      <div className="access-ic">
        <IconImage size={40} />
      </div>
      <h1 className="onb-h center">Ideas from your own photos</h1>
      <ul className="access-list">
        <li>
          <IconCheck size={16} /> Only shown to you
        </li>
        <li>
          <IconCheck size={16} /> Processed privately, never used to train models
        </li>
        <li>
          <IconCheck size={16} /> Nothing is ever posted without you
        </li>
      </ul>
      <div className="onb-actions">
        <button className="pill-w block" onClick={() => setPrompt(true)} data-testid="onb-next">
          Allow photo access
        </button>
      </div>
      {prompt && (
        <div className="ios-alert-bg">
          <div className="ios-alert" role="alertdialog" data-testid="ios-alert">
            <div className="ios-t">“Remini” Would Like to Access Your Photos</div>
            <div className="ios-m">Remini suggests posts from your recent photos. They stay private to you.</div>
            <button onClick={() => answer("limited")}>Limit Access…</button>
            <button className="b" onClick={() => answer("full")} data-testid="allow-full">
              Allow Full Access
            </button>
            <button onClick={() => answer("none")}>Don't Allow</button>
          </div>
        </div>
      )}
    </>
  );
}

function Payoff({
  onTrial,
  onSkip,
  pro,
  locked,
  aesthetics,
  trendToTry,
}: {
  onTrial: () => void;
  onSkip: () => void;
  pro: boolean;
  locked: (f: "carousel" | "reel" | "story") => boolean;
  aesthetics: string[];
  trendToTry: string | null;
}) {
  // The picked trend becomes the first idea.
  const ideas = [...(trendToTry ? [trendSuggestion(trendToTry)] : []), ...SUGGESTIONS].slice(0, 3);
  // One main word per picked aesthetic first ("film", "warm", …), then their second words.
  const words = [...new Set([...aesthetics.map((id) => aesthetic(id).words[0]), ...aesthetics.flatMap((id) => aesthetic(id).words.slice(1))])].slice(0, 3);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 900);
    return () => clearTimeout(t);
  }, []);
  return (
    <>
      <div className="style-sum">
        <span className="sum-k">Your style</span>
        <h1 className="onb-h">{words.join(", ")}</h1>
      </div>
      <p className="onb-p">From your recent photos, here are your first 3 ideas:</p>
      {!ready ? (
        <div className="finding">
          <span className="spin" /> Finding ideas in {photo(SUGGESTIONS[0].photos[0]).when.toLowerCase()}'s photos…
        </div>
      ) : (
        <div className="hs payoff-hs">
          {ideas.map((sg) => (
            <SuggestionCard key={sg.id} sg={sg} pro locked={!pro && locked(sg.format)} onOpen={onTrial} />
          ))}
        </div>
      )}
      <div className="onb-actions">
        <button className="pill-w block" onClick={onTrial} disabled={!ready} data-testid="see-week">
          See my week
        </button>
        <button className="link" onClick={onSkip}>
          Continue with Free
        </button>
      </div>
    </>
  );
}
