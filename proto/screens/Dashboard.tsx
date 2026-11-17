"use client";

import { AESTHETICS, FORMATS, HUB, PAST_POSTS, SUGGESTIONS, TRENDS, USER, aesthetic, photo, trendSuggestion, type Suggestion } from "../data.ts";
import { useState } from "react";
import { CHAT } from "../data.ts";
import { useProto } from "../store.tsx";
import { GoalRing, IconBack, IconIdea, IconLayers, IconLock, IconPlay, IconTrend, Shot, longPress, lookFor } from "../ui.tsx";
import { LinkField } from "./OwnIdea.tsx";
import { ExploreSection } from "./Explore.tsx";

export default function Dashboard({ highlight }: { highlight?: string }) {
  const { s, set, push, back, isPro, openSheet, requirePro, formatLocked } = useProto();
  const goalLabel = s.goal === 7 ? "daily" : `${s.goal}×`;
  const left = Math.max(0, s.goal - s.posted);
  // Suggestions in the user's chosen platforms first.
  const suggestions = SUGGESTIONS.filter((x) => FORMATS[x.format].platforms.some((p) => s.platforms.includes(p)) || x.format === "carousel");
  const allPosts = [...s.madePosts, ...PAST_POSTS];
  const rising = [...TRENDS]
    .filter((t) => !s.dismissedTrends.includes(t.id))
    .sort((a, b) => Number(b.id === s.trendToTry) - Number(a.id === s.trendToTry) || b.growth - a.growth);
  const [toast, setToast] = useState<string | null>(null);
  const hideTrend = (id: string) => {
    set((st) => ({ dismissedTrends: [...st.dismissedTrends, id], trendToTry: st.trendToTry === id ? null : st.trendToTry }));
    setToast(CHAT.trendHidden);
    setTimeout(() => setToast(null), 1800);
  };
  const short = (p: string) => (p === "Instagram" ? "IG" : p === "WhatsApp Status" ? "Status" : p);

  return (
    <div className="scr dash">
      <header className="p-top">
        <button className="p-icon" aria-label="Back to Remini" onClick={back}>
          <IconBack />
        </button>
        <div className="p-title two" {...longPress(() => openSheet({ kind: "debug" }))}>
          Creator Studio
          <small>{HUB.dashSub}</small>
        </div>
        {isPro ? (
          <span className="pro-badge">PRO</span>
        ) : (
          <button className="get-pro" onClick={() => requirePro("Unlock every format", () => undefined)} data-testid="get-pro">
            Get Pro
          </button>
        )}
      </header>

      {/* profile + goal (compact, so the ways in fit on the first screen) */}
      <section className="prof compact" data-testid="profile">
        <div className="prof-row">
          <img className="prof-avatar" src={USER.avatar} alt="" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="prof-name">
              {USER.name}
              <button className="prof-edit" onClick={() => openSheet({ kind: "profile" })} data-testid="edit-profile">
                Edit
              </button>
            </div>
            <div className="prof-sub" data-testid="persona">
              {USER.handle} · {USER.followers} followers · {s.platforms.map(short).join(", ")}
            </div>
          </div>
          <div className="goal-mini" title={left === 0 ? "Goal reached" : `Your goal: ${goalLabel} a week · ${left} to go`}>
            <GoalRing done={s.posted} goal={s.goal} size={44} />
            <span className="goal-mini-t" data-testid="goal-text">
              {s.posted} of {s.goal === 7 ? 7 : s.goal} posted
              <br />
              this week
            </span>
          </div>
        </div>
        <div className="prof-line">
          <div className="chips mini">
            {/* One look and one topic fit next to the posts strip; the rest as a count (all in Edit). */}
            {s.aesthetics.slice(0, 1).map((id) => (
              <span key={id} className="chip">
                {aesthetic(id).name}
              </span>
            ))}
            {s.topics.slice(0, 1).map((t) => (
              <span key={t} className="chip topic">
                {t}
              </span>
            ))}
            {s.aesthetics.length + s.topics.length > 2 && <span className="chip">+{s.aesthetics.length + s.topics.length - Math.min(1, s.aesthetics.length) - Math.min(1, s.topics.length)}</span>}
          </div>
          <div className="past-mini" data-testid="past-posts" title={`Your posts: ${allPosts.length} made with Creator Studio`}>
            {allPosts.slice(0, 4).map((pp, i) => (
              <Shot key={`${pp.photo}-${i}`} src={photo(pp.photo).src} look={aesthetic(pp.aesthetic).look} className="past-th" />
            ))}
            <span className="past-more">
              Your posts
              <br />
              {allPosts.length}
            </span>
          </div>
        </div>
      </section>

      {/* way in 1: you come with an idea */}
      <section className="bring compact" data-testid="bring-idea">
        <div className="bring-head">
          <h2>{HUB.bringTitle}</h2>
          <span className={`fp-badge${isPro ? " pro" : ""}`}>{isPro ? "Full posts" : "Free preview · Pro full post"}</span>
        </div>
        <LinkField onGo={() => push({ name: "link", phase: "reading" })} />
        <div className="bring-opts">
          <button className="bring-opt" onClick={() => push({ name: "chat", entry: { kind: "own", mode: "idea" } })} data-testid="describe-it">
            <IconIdea size={18} />
            <b>Describe it</b>
          </button>
          <button className="bring-opt" onClick={() => push({ name: "templates" })} data-testid="pick-template">
            <IconLayers size={18} />
            <b>Pick a template</b>
          </button>
        </div>
      </section>

      {/* way in 2: it nudges you */}
      <div className="sec nudge" style={{ marginTop: 18 }}>
        <h2>
          This week for you <small>{HUB.nudgeLabel}</small>
        </h2>
        <span className="sec-note">{suggestions.length + (s.trendToTry ? 1 : 0)} ready to make</span>
      </div>
      <div className="hs dash-sg" data-testid="suggestions">
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

      {/* explore: more content to choose from */}
      <ExploreSection />

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
              <div className="rise-actions">
                <button className="pill-o sm" onClick={() => push({ name: "chat", entry: { kind: "trend", id: t.id } })}>
                  Try it
                </button>
                <button className="rise-hide" onClick={() => hideTrend(t.id)} aria-label={`Hide ${t.name}`} data-testid={`hide-${t.id}`}>
                  Hide
                </button>
              </div>
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

      {/* the creator's posts */}
      <div className="sec" data-testid="your-posts">
        <h2>Your posts</h2>
        <span className="sec-note">{allPosts.length} made with Creator Studio</span>
      </div>
      <div className="yp-grid">
        {allPosts.map((pp, i) => (
          <div key={`${pp.photo}-${i}`} className="yp" data-testid="yp">
            <Shot src={photo(pp.photo).src} look={aesthetic(pp.aesthetic).look} className="yp-img">
              <span className="fmt">
                {pp.format !== "carousel" && <IconPlay size={10} />} {FORMATS[pp.format].label.split(" ")[0]}
              </span>
              {pp.when === "Just now" && <span className="x-badge hot">New</span>}
            </Shot>
            <span className="yp-name">{pp.label}</span>
            <span className="yp-meta">
              {pp.platform} · {pp.when}
            </span>
          </div>
        ))}
      </div>
      <div style={{ height: 40 }} />
      {toast && <div className="p-toast">{toast}</div>}
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
