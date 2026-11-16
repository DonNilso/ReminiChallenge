"use client";

import { useEffect, useRef, useState } from "react";
import { CHAT, FORMATS, aesthetic, photo, type Format } from "../data.ts";
import { describe, nextAesthetic, parse, type Spec } from "../brain.ts";
import { FREE_EDITS, useProto } from "../store.tsx";
import { IconBack, IconLock, IconMusic, IconRefresh, IconSend, IconSparkle, Shot } from "../ui.tsx";

const FORMAT_ORDER: Format[] = ["carousel", "reel", "story"];
const formatWord = (f: Format) => (f === "carousel" ? "carousel" : f === "reel" ? "Reel" : "Story");

export default function Draft() {
  const { s, set, back, openSheet, requirePro, formatLocked, isPro } = useProto();
  const draft = s.draft;
  const [generating, setGenerating] = useState(true);
  const [step, setStep] = useState(0);
  const [updating, setUpdating] = useState(false);
  const [ai, setAi] = useState<string>(CHAT.draftReady);
  const [text, setText] = useState("");

  // Generating state: a short, staged animation.
  useEffect(() => {
    const steps = CHAT.generating.length;
    const timers = Array.from({ length: steps }, (_, i) => setTimeout(() => setStep(i), i * 650));
    timers.push(setTimeout(() => setGenerating(false), steps * 650 + 300));
    return () => timers.forEach(clearTimeout);
  }, []);

  if (!draft) {
    return (
      <div className="scr">
        <p className="note pad">No draft yet.</p>
      </div>
    );
  }
  const spec = draft.spec;
  const a = aesthetic(spec.aesthetic);
  const mark = !isPro;
  const editsLeft = isPro ? Infinity : Math.max(0, FREE_EDITS - draft.edits);

  const applySpec = (next: Spec, reply: string) => {
    setUpdating(true);
    setTimeout(() => {
      set((st) => ({
        draft: st.draft && {
          ...st.draft,
          spec: next,
          title: `${aesthetic(next.aesthetic).name} ${formatWord(next.format)}`,
          edits: st.draft.edits + 1,
          version: st.draft.version + 1,
        },
      }));
      setAi(reply);
      setUpdating(false);
    }, 800);
  };

  const refine = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    setText("");
    const run = () => {
      const r = parse(t, spec, s.aesthetics);
      if (r.spec.format !== spec.format && formatLocked(r.spec.format)) {
        return requirePro(`${FORMATS[r.spec.format].label.split(" ")[0]}s are part of Pro`, () => applySpec(r.spec, describe(r.changes)));
      }
      if (!r.understood) {
        setAi("Try something like “warmer”, “moodier”, “swap the 2nd photo” or “5 photos”.");
        return;
      }
      applySpec(r.spec, `${describe(r.changes)} How's this?`);
    };
    if (editsLeft <= 0) return requirePro("Unlimited edits by asking are part of Pro", run);
    run();
  };

  const anotherLook = () => {
    const next = { ...spec, aesthetic: nextAesthetic(spec.aesthetic, s.aesthetics) };
    const go = () => applySpec(next, `Here it is in ${aesthetic(next.aesthetic).name.toLowerCase()}. Better?`);
    if (editsLeft <= 0) return requirePro("Unlimited edits by asking are part of Pro", go);
    go();
  };

  const switchFormat = (f: Format) => {
    if (f === spec.format) return;
    const go = () => applySpec({ ...spec, format: f }, `Now a ${FORMATS[f].label}.${f === "reel" ? " Cuts land on the beat; add the trending sound when you post." : ""}`);
    if (formatLocked(f)) return requirePro(`${FORMATS[f].label.split(" ")[0]}s are part of Pro`, go);
    go();
  };

  if (generating) {
    return (
      <div className="scr gen" data-testid="generating">
        <div className="gen-stack">
          {spec.photos.slice(0, 3).map((id, i) => (
            <Shot key={id} src={photo(id).src} look={a.look} className={`gen-card g${i}`} />
          ))}
          <div className="gen-sweep" />
        </div>
        <div className="gen-title">
          <IconSparkle size={20} /> Making your {a.name.toLowerCase()} {formatWord(spec.format)}
        </div>
        <ul className="gen-steps">
          {CHAT.generating.map((g, i) => (
            <li key={g} className={i < step ? "done" : i === step ? "now" : ""}>
              {g}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="scr draft">
      <header className="p-top">
        <button className="p-icon" aria-label="Back to chat" onClick={back}>
          <IconBack />
        </button>
        <div className="p-title sm" data-testid="draft-title">
          {draft.title}
        </div>
        <button className="post-top" onClick={() => openSheet({ kind: "share" })} data-testid="post">
          Post
        </button>
      </header>

      <div className="fmt-tabs" role="tablist">
        {FORMAT_ORDER.map((f) => (
          <button key={f} role="tab" aria-selected={spec.format === f} className={spec.format === f ? "on" : ""} onClick={() => switchFormat(f)}>
            {formatLocked(f) && <IconLock size={12} />} {FORMATS[f].label}
          </button>
        ))}
      </div>

      <div className={`preview-wrap${updating ? " updating" : ""}`} key={draft.version} data-testid="preview">
        {spec.format === "carousel" && <Carousel spec={spec} mark={mark} />}
        {spec.format === "reel" && <Reel spec={spec} mark={mark} />}
        {spec.format === "story" && <Story spec={spec} mark={mark} />}
        {updating && (
          <div className="updating-veil">
            <IconSparkle size={22} /> Updating…
          </div>
        )}
      </div>

      <div className="refine">
        <div className="msg ai compact">
          <span className="ai-av">
            <IconSparkle size={14} />
          </span>
          <div className="bubble" data-testid="draft-ai">
            {ai}
          </div>
        </div>
        <div className="quick">
          <button className="qr accent" onClick={anotherLook} data-testid="another-look">
            <IconRefresh size={14} /> Try another look
          </button>
          {CHAT.quickDraft.map((q) => (
            <button key={q} className="qr" onClick={() => refine(q)}>
              {q === "Shorter" && spec.format === "reel" ? "Shorter Reel" : q}
            </button>
          ))}
        </div>
        <form
          className="input-row"
          onSubmit={(e) => {
            e.preventDefault();
            refine(text);
          }}
        >
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Comment to change it: “warmer”, “swap the 2nd photo”…" aria-label="Refine" data-testid="refine-input" />
          <button className="send" aria-label="Send" disabled={!text.trim()}>
            <IconSend size={20} />
          </button>
        </form>
        {!isPro && <div className="edits-left">{editsLeft > 0 ? `${editsLeft} free edits left · Pro: unlimited` : "Free edits used · Pro: unlimited"}</div>}
      </div>

      <button className="pill-w block post-bottom" onClick={() => openSheet({ kind: "share" })}>
        Post · {FORMATS[spec.format].platforms.join(" / ")}
      </button>
    </div>
  );
}

function Carousel({ spec, mark }: { spec: Spec; mark: boolean }) {
  const [i, setI] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const look = aesthetic(spec.aesthetic).look;
  return (
    <div className="pv carousel-pv">
      <div
        className="car"
        ref={ref}
        onScroll={(e) => setI(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        data-testid="carousel"
      >
        {spec.photos.map((id) => (
          <Shot key={id} src={photo(id).src} look={look} tweak={spec} mark={mark} className="car-slide" />
        ))}
      </div>
      <span className="car-count">
        {i + 1}/{spec.photos.length}
      </span>
      <div className="car-dots">
        {spec.photos.map((id, k) => (
          <i key={id} className={k === i ? "on" : ""} />
        ))}
      </div>
    </div>
  );
}

/** 9:16 Reel preview: beat-cut every ~0.55 s with a Ken Burns move. */
function Reel({ spec, mark }: { spec: Spec; mark: boolean }) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setI((x) => (x + 1) % spec.photos.length), 550);
    return () => clearInterval(t);
  }, [playing, spec.photos.length]);
  const look = aesthetic(spec.aesthetic).look;
  const seconds = Math.max(3, Math.round(spec.photos.length * 1.1));
  return (
    <div className="pv tall-pv" onClick={() => setPlaying((p) => !p)} data-testid="reel">
      <Shot key={`${spec.photos[i]}-${i}`} src={photo(spec.photos[i]).src} look={look} tweak={spec} mark={mark} kenBurns={i} className="reel-frame cut" />
      <div className="beat">
        {Array.from({ length: 16 }, (_, k) => (
          <i key={k} className={k % 4 === i % 4 ? "hit" : ""} />
        ))}
      </div>
      <div className="reel-ui">
        <span className="sound-hint">
          <IconMusic size={14} /> Add sound when posting
        </span>
        <span className="reel-len">
          {seconds}s · {spec.photos.length} cuts{playing ? "" : " · paused"}
        </span>
      </div>
    </div>
  );
}

function Story({ spec, mark }: { spec: Spec; mark: boolean }) {
  const [i, setI] = useState(0);
  const frames = spec.photos.slice(0, 5);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % frames.length), 2200);
    return () => clearInterval(t);
  }, [frames.length]);
  const look = aesthetic(spec.aesthetic).look;
  return (
    <div className="pv tall-pv" onClick={() => setI((x) => (x + 1) % frames.length)} data-testid="story">
      <Shot key={frames[i]} src={photo(frames[i]).src} look={look} tweak={spec} mark={mark} className="reel-frame fade" />
      <div className="story-top">
        {frames.map((id, k) => (
          <i key={id} className={k < i ? "done" : k === i ? "run" : ""} />
        ))}
      </div>
      <div className="story-ava">
        <img src="/p/me.jpg" alt="" /> Your story
      </div>
    </div>
  );
}
