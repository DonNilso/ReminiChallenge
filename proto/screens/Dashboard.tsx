"use client";

import { AESTHETICS, FORMATS, SUGGESTIONS, TRENDS, USER, aesthetic, photo, trendSuggestion, type Suggestion } from "../data.ts";
import { useProto } from "../store.tsx";
import { GoalRing, IconBack, IconIdea, IconImage, IconLock, IconPlay, IconTrend, Shot, longPress, lookFor } from "../ui.tsx";

export default function Dashboard({ highlight }: { highlight?: string }) {
  const { s, push, back, isPro, openSheet, requirePro, formatLocked } = useProto();
  const goalLabel = s.goal === 7 ? "daily" : `${s.goal}×`;
  const left = Math.max(0, s.goal - s.posted);
  // Suggestions in the user's chosen platforms first.
  const suggestions = SUGGESTIONS.filter((x) => FORMATS[x.format].platforms.some((p) => s.platforms.includes(p)) || x.format === "carousel");
  const rising = [...TRENDS].sort((a, b) => Number(b.id === s.trendToTry) - Number(a.id === s.trendToTry) || b.growth - a.growth);

  return (
    <div className="scr dash">
      <header className="p-top">
        <button className="p-icon" aria-label="Back to Remini" onClick={back}>
          <IconBack />
        </button>
        <div className="p-title" {...longPress(() => openSheet({ kind: "debug" }))}>
          Creator Studio
        </div>
        {isPro ? (
          <span className="pro-badge">PRO</span>
        ) : (
          <button className="get-pro" onClick={() => requirePro("Unlock every format", () => undefined)} data-testid="get-pro">
            Get Pro
          </button>
        )}
      </header>

      {/* profile + goal */}
      <section className="prof" data-testid="profile">
        <div className="prof-row">
          <img className="prof-avatar" src={USER.avatar} alt="" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="prof-name">{USER.name}</div>
            <div className="prof-sub">
              {USER.handle} · {s.platforms.join(", ")}
            </div>
          </div>
          <button className="pill-o sm" onClick={() => openSheet({ kind: "profile" })} data-testid="edit-profile">
            Edit
          </button>
        </div>
        <div className="chips">
          {s.aesthetics.map((id) => (
            <span key={id} className="chip">
              {aesthetic(id).name}
            </span>
          ))}
        </div>
        <div className="goal">
          <GoalRing done={s.posted} goal={s.goal} />
          <div>
            <div className="goal-t" data-testid="goal-text">
              {s.posted} of {s.goal === 7 ? 7 : s.goal} posted this week
            </div>
            <div className="goal-s">
              {left === 0 ? "Goal reached. Nice!" : `Your goal: ${goalLabel} a week · ${left} to go`}
            </div>
          </div>
        </div>
      </section>

      {/* weekly suggestions */}
      <div className="sec">
        <h2>This week for you</h2>
        <span className="sec-note">{suggestions.length + (s.trendToTry ? 1 : 0)} ready to make</span>
      </div>
      <div className="hs" data-testid="suggestions">
        {s.trendToTry && (
          <SuggestionCard
            sg={trendSuggestion(s.trendToTry)}
            tag="Your pick"
            pro={isPro}
            locked={formatLocked(trendSuggestion(s.trendToTry).format)}
            onOpen={() => push({ name: "chat", entry: { kind: "trend", id: s.trendToTry! } })}
          />
        )}
        {suggestions.map((sg) => (
          <SuggestionCard
            key={sg.id}
            sg={sg}
            highlight={highlight === sg.id}
            pro={isPro}
            locked={formatLocked(sg.format)}
            onOpen={() => push({ name: "chat", entry: { kind: "suggestion", id: sg.id } })}
          />
        ))}
      </div>
      {!isPro && <p className="free-note">Free previews show your photos enhanced. Pro previews the trend look.</p>}

      {/* rising trends */}
      <div className="sec">
        <h2>Rising for you</h2>
      </div>
      <div className="rising">
        {rising.map((t) => (
          <div key={t.id} className="rise" data-testid="rising">
            <div className="rise-head">
              <div>
                <div className="rise-name">
                  {t.name}{" "}
                  {s.trendToTry === t.id ? <span className="tag-you pick">Your pick</span> : s.aesthetics.includes(t.aesthetic) && <span className="tag-you">Your style</span>}
                </div>
                <div className="rise-growth">
                  <IconTrend size={15} /> +{t.growth}% this week
                </div>
              </div>
              <button className="pill-o sm" onClick={() => push({ name: "chat", entry: { kind: "trend", id: t.id } })}>
                Try it
              </button>
            </div>
            <div className="rise-ex">
              {t.examples.map((e) => (
                <Shot key={e} src={`/p/${e}.jpg`} look={aesthetic(t.aesthetic).look} className="rise-img" />
              ))}
              <Shot src={photo(t.fromPhotos[0]).src} look={isPro ? aesthetic(t.aesthetic).look : lookFor(null)} className="rise-img mine">
                <span className="rise-mine">You</span>
              </Shot>
            </div>
            <div className="rise-blurb">{t.blurb}</div>
          </div>
        ))}
      </div>

      {/* create your own */}
      <div className="sec">
        <h2>Create your own</h2>
      </div>
      <div className="own">
        <button className="own-btn" onClick={() => push({ name: "chat", entry: { kind: "own", mode: "photo" } })} data-testid="own-photo">
          <IconImage size={26} />
          <b>From a photo</b>
          <small>Pick photos, we style them</small>
        </button>
        <button className="own-btn" onClick={() => push({ name: "chat", entry: { kind: "own", mode: "idea" } })} data-testid="own-idea">
          <IconIdea size={26} />
          <b>From an idea</b>
          <small>Describe it in a few words</small>
        </button>
      </div>
      <div style={{ height: 40 }} />
    </div>
  );
}

export function SuggestionCard({
  sg,
  highlight,
  tag,
  pro,
  locked,
  onOpen,
}: {
  sg: Suggestion;
  highlight?: boolean;
  tag?: string;
  pro: boolean;
  locked: boolean;
  onOpen: () => void;
}) {
  const look = pro ? aesthetic(sg.aesthetic).look : lookFor(null);
  const a = aesthetic(sg.aesthetic);
  const ph = sg.photos.map((id) => photo(id).src);
  return (
    <button className={`sg${highlight ? " hl" : ""}`} onClick={onOpen} data-testid={`sg-${sg.id}`}>
      <div className={`sg-prev ${sg.format}`}>
        {sg.format === "carousel" ? (
          <div className="collage">
            <Shot src={ph[0]} look={look} className="c-big" />
            <Shot src={ph[1]} look={look} className="c-s1" />
            <Shot src={ph[2]} look={look} className="c-s2" />
          </div>
        ) : (
          <Shot src={ph[0]} look={look} className="tall">
            {sg.format === "reel" ? (
              <span className="play">
                <IconPlay size={22} />
              </span>
            ) : (
              <span className="story-bars">
                {ph.slice(0, 3).map((_, i) => (
                  <i key={i} className={i === 0 ? "on" : ""} />
                ))}
              </span>
            )}
          </Shot>
        )}
        <span className="fmt">
          {locked && <IconLock size={12} />} {FORMATS[sg.format].label}
        </span>
        {highlight && <span className="ready">Ready</span>}
        {tag && !highlight && <span className="ready pick">{tag}</span>}
      </div>
      <div className="sg-body">
        <div className="sg-title">{sg.title}</div>
        <div className="sg-meta">
          <span className="trend-dot" /> {a.name} · {sg.photos.length} photos
        </div>
      </div>
    </button>
  );
}

export const allAesthetics = AESTHETICS;
