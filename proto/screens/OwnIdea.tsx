"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CHAT, FORMATS, LINK_DEMO, ROLL, TEMPLATES, aesthetic, photo, template, type Format } from "../data.ts";
import type { Spec } from "../brain.ts";
import { formatWord, useProto } from "../store.tsx";
import { IconBack, IconCheck, IconClose, IconLock, IconMusic, IconPlay, IconSparkle, Shot, lookFor } from "../ui.tsx";

const BASE = { warmth: 0, mood: 0, bright: 0 };

/* ------------------------------------------------------------------ link flow */

/** 1. paste → 2. reading → 3. format found + your photos that fit → draft. */
export function Link({ phase, shared }: { phase: "paste" | "reading" | "found"; shared?: boolean }) {
  const { back, replace } = useProto();
  if (phase === "paste") return <LinkPaste onGo={() => replace({ name: "link", phase: "reading" })} onBack={back} />;
  if (phase === "reading") return <LinkReading shared={shared} onDone={() => replace({ name: "link", phase: "found", shared })} onBack={back} />;
  return <LinkFound onBack={back} />;
}

/** Link field with a Paste button, used on the dashboard card and on the paste screen. */
export function LinkField({ onGo, autoFill = true }: { onGo: () => void; autoFill?: boolean }) {
  const [url, setUrl] = useState(autoFill ? LINK_DEMO.display : "");
  return (
    <form
      className="link-field"
      onSubmit={(e) => {
        e.preventDefault();
        if (url.trim()) onGo();
      }}
    >
      <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste a TikTok, Instagram or Pinterest link" aria-label="Link" data-testid="link-input" />
      {url ? (
        <button className="lf-go" aria-label="Recreate" data-testid="link-go">
          Go
        </button>
      ) : (
        <button type="button" className="lf-paste" onClick={() => setUrl(LINK_DEMO.display)} data-testid="link-paste">
          Paste
        </button>
      )}
    </form>
  );
}

function LinkPaste({ onGo, onBack }: { onGo: () => void; onBack: () => void }) {
  return (
    <div className="scr own" data-testid="link-paste-screen">
      <Top title="Bring a link" onBack={onBack} />
      <h1 className="own-h">Make it your way</h1>
      <p className="own-p">Paste any post you love. We read its format and look, then make your version with your photos.</p>
      <LinkField onGo={onGo} autoFill={false} />
      <p className="own-fine">Works with TikTok, Instagram Reels and posts, Pinterest.</p>
    </div>
  );
}

function LinkReading({ shared, onDone, onBack }: { shared?: boolean; onDone: () => void; onBack: () => void }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const n = LINK_DEMO.reading.length;
    const timers = Array.from({ length: n }, (_, i) => setTimeout(() => setStep(i + 1), (i + 1) * 340));
    timers.push(setTimeout(onDone, n * 340 + 250)); // about 1.6 s in total
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="scr gen" data-testid="link-reading">
      {shared && <div className="shared-chip">Shared from {LINK_DEMO.platform}</div>}
      <div className="read-card">
        <Shot src={LINK_DEMO.thumb} look={aesthetic(LINK_DEMO.aesthetic).look} className="read-thumb">
          <span className="play sm">
            <IconPlay size={18} />
          </span>
        </Shot>
        <div className="gen-sweep" />
      </div>
      <div className="gen-title">
        <IconSparkle size={20} /> Reading the post…
      </div>
      <div className="read-url">{LINK_DEMO.display}</div>
      <ul className="gen-steps">
        {LINK_DEMO.reading.map((r, i) => (
          <li key={r} className={i < step ? "done" : i === step ? "now" : ""}>
            {r}
          </li>
        ))}
      </ul>
      <button className="link" onClick={onBack}>
        Cancel
      </button>
    </div>
  );
}

function LinkFound({ onBack }: { onBack: () => void }) {
  const { startOwnIdea } = useProto();
  const meta = `${FORMATS[LINK_DEMO.format].label.split(" ")[0]} · ${LINK_DEMO.cuts} cuts · ${LINK_DEMO.seconds} s · ${aesthetic(LINK_DEMO.aesthetic).name.toLowerCase()} look · ${LINK_DEMO.textOnScreen}`;
  return (
    <PhotoFit
      title="Your version"
      onBack={onBack}
      initial={LINK_DEMO.photos}
      aesthetic={LINK_DEMO.aesthetic}
      format={LINK_DEMO.format}
      cta="Make my version ✨"
      onMake={(photos) => startOwnIdea({ ...BASE, aesthetic: LINK_DEMO.aesthetic, format: LINK_DEMO.format, photos }, LINK_DEMO.name, "link")}
      testId="link-found"
    >
      <div className="found" data-testid="format-card">
        <Shot src={LINK_DEMO.thumb} look={aesthetic(LINK_DEMO.aesthetic).look} className="found-thumb">
          <span className="play sm">
            <IconPlay size={16} />
          </span>
        </Shot>
        <div className="found-body">
          <span className="found-k">
            <IconCheck size={14} /> We found the format
          </span>
          <div className="found-meta">{meta}</div>
          <div className="found-src">
            from {LINK_DEMO.author} on {LINK_DEMO.platform}
          </div>
        </div>
      </div>
      <p className="found-promise">
        <IconMusic size={15} /> {LINK_DEMO.promise}
      </p>
    </PhotoFit>
  );
}

/* ------------------------------------------------------------------ templates */

export function Templates() {
  const { back, push, isPro } = useProto();
  return (
    <div className="scr own" data-testid="templates">
      <Top title="Templates" onBack={back} />
      <h1 className="own-h">Pick a template</h1>
      <p className="own-p">We pick your photos and make it in seconds. {isPro ? "" : "Free: preview · Pro: full post."}</p>
      <div className="tpl-grid">
        {TEMPLATES.map((t) => (
          <button key={t.id} className="tpl" onClick={() => push({ name: "template", id: t.id })} data-testid={`tpl-${t.id}`}>
            <Shot src={photo(t.cover).src} look={aesthetic(t.aesthetic).look} className="tpl-img">
              <span className="fmt">
                {FormatIcon(t.format)} {formatWord(t.format).replace(/^./, (c) => c.toUpperCase())}
              </span>
            </Shot>
            <span className="tpl-name">{t.name}</span>
            <span className="tpl-blurb">{t.blurb}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function TemplateDetail({ id }: { id: string }) {
  const { back, startOwnIdea } = useProto();
  const t = template(id);
  return (
    <PhotoFit
      title={t.name}
      onBack={back}
      initial={t.photos}
      aesthetic={t.aesthetic}
      format={t.format}
      cta="Make it ✨"
      onMake={(photos) => startOwnIdea({ ...BASE, aesthetic: t.aesthetic, format: t.format, photos }, t.name, "template")}
      testId="template-detail"
    >
      <div className="found">
        <Shot src={photo(t.cover).src} look={aesthetic(t.aesthetic).look} className="found-thumb" />
        <div className="found-body">
          <span className="found-k">
            <IconSparkle size={14} /> Template
          </span>
          <div className="found-meta">
            {FORMATS[t.format].label} · {aesthetic(t.aesthetic).name.toLowerCase()} look
          </div>
          <div className="found-src">{t.blurb}</div>
        </div>
      </div>
    </PhotoFit>
  );
}

/* ------------------------------------------------------------------ shared: your photos that fit */

function PhotoFit({
  title,
  onBack,
  initial,
  aesthetic: aes,
  format,
  cta,
  onMake,
  children,
  testId,
}: {
  title: string;
  onBack: () => void;
  initial: string[];
  aesthetic: string;
  format: Format;
  cta: string;
  onMake: (photos: string[]) => void;
  children: ReactNode;
  testId: string;
}) {
  const { isPro } = useProto();
  const [sel, setSel] = useState<string[]>(initial);
  const pool = useMemo(() => {
    const extra = initial.filter((id) => !ROLL.some((p) => p.id === id)).map(photo);
    const day = photo(initial.find((id) => ROLL.some((p) => p.id === id)) ?? "").when;
    const first = ROLL.filter((p) => initial.includes(p.id) || p.when === day);
    return [...extra, ...first, ...ROLL.filter((p) => !first.includes(p))].slice(0, 16);
  }, [initial]);
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 10 ? s : [...s, id]));
  return (
    <div className="scr own" data-testid={testId}>
      <Top title={title} onBack={onBack} />
      {children}
      <div className="sec" style={{ marginTop: 18 }}>
        <h2>Your photos that fit</h2>
        <span className="sec-note">{sel.length} picked</span>
      </div>
      <p className="own-fine" style={{ marginTop: -6 }}>
        Picked automatically. Tap to swap.
      </p>
      <div className="picker fit" data-testid="fit-picker">
        {pool.map((p) => {
          const i = sel.indexOf(p.id);
          return (
            <button key={p.id} className={`pk${i >= 0 ? " on" : ""}`} onClick={() => toggle(p.id)}>
              <Shot src={p.src} look={i >= 0 ? aesthetic(aes).look : lookFor(null)} />
              {i >= 0 && <span className="pk-n">{i + 1}</span>}
            </button>
          );
        })}
      </div>
      <div className="own-cta">
        <button className="pill-w block" disabled={sel.length === 0} onClick={() => onMake(sel)} data-testid="make-version">
          {cta}
        </button>
        <div className="own-fine center">
          {FORMATS[format].label} · {isPro ? "full post" : "free preview, full post with Pro"}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ free preview of your own idea */

export function Preview({ spec, title, source }: { spec: Spec; title: string; source: "link" | "template" | "describe" }) {
  const { back, requirePro, openDraft } = useProto();
  const [i, setI] = useState(0);
  const frames = spec.photos.slice(0, 3);
  const tall = spec.format !== "carousel";
  const label = source === "link" ? "your version" : "your photos";
  return (
    <div className="scr own" data-testid="free-preview">
      <Top title={title} onBack={back} />
      <div className="pv-note">
        <IconLock size={14} /> {CHAT.freePreview}
      </div>
      <div className={`fp-wrap${tall ? " tall" : ""}`}>
        <div className="car" onScroll={(e) => setI(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))} style={{ aspectRatio: FORMATS[spec.format].ratio }}>
          {frames.map((id) => (
            <Shot key={id} src={photo(id).src} look={aesthetic(spec.aesthetic).look} className="car-slide">
              <span className="preview-wm">PREVIEW</span>
            </Shot>
          ))}
        </div>
        <div className="car-dots">
          {frames.map((id, k) => (
            <i key={id} className={k === i ? "on" : ""} />
          ))}
        </div>
      </div>
      <p className="alert-note">
        First {frames.length} of {spec.photos.length} {spec.format === "carousel" ? "slides" : "frames"} · {formatWord(spec.format)} · watermarked
      </p>
      <div className="alert-actions">
        <button
          className="pill-w block"
          onClick={() => requirePro("Your own idea: full post with Pro", () => openDraft(spec, title, { replace: true }))}
          data-testid="make-full-post"
        >
          Make the full post
        </button>
        <button className="pill-o block" onClick={back}>
          {source === "describe" ? "Back" : `Back to ${label}`}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ shared from TikTok (system share sheet, mock) */

export function ShareIn() {
  const { reset, set } = useProto();
  const open = () => {
    set({ onboarded: true });
    reset([{ name: "home" }, { name: "dashboard" }, { name: "link", phase: "reading", shared: true }]);
  };
  const apps = [
    { name: "Messages", bg: "#30d158" },
    { name: "Mail", bg: "#0a84ff" },
    { name: "Remini", bg: "linear-gradient(135deg, #f7b733, #d92d50 55%, #c03ac9)", me: true },
    { name: "Notes", bg: "#ffd60a" },
    { name: "More", bg: "#3a3a3c" },
  ];
  return (
    <div className="scr sharein" data-testid="share-in">
      <Shot src={LINK_DEMO.thumb} look={aesthetic(LINK_DEMO.aesthetic).look} className="si-bg" />
      <div className="si-shade" />
      <div className="si-video">
        <b>{LINK_DEMO.author}</b>
        <span>{LINK_DEMO.caption}</span>
      </div>
      <div className="si-sheet" role="dialog" aria-label="Share">
        <div className="si-head">
          <Shot src={LINK_DEMO.thumb} look={aesthetic(LINK_DEMO.aesthetic).look} className="si-thumb" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <b>Video by {LINK_DEMO.author}</b>
            <small>{LINK_DEMO.display}</small>
          </div>
          <span className="si-x">
            <IconClose size={16} />
          </span>
        </div>
        <div className="si-apps">
          {apps.map((a) => (
            <button key={a.name} className={`si-app${a.me ? " me" : ""}`} onClick={a.me ? open : undefined} data-testid={a.me ? "share-remini" : undefined}>
              <span className="si-ic" style={{ background: a.bg }}>
                {a.me ? <IconSparkle size={24} /> : a.name[0]}
              </span>
              <span>{a.name}</span>
            </button>
          ))}
        </div>
        <button className="pill-w block" onClick={open} data-testid="open-in-remini">
          Make my version in Remini
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ bits */

function Top({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="p-top">
      <button className="p-icon" aria-label="Back" onClick={onBack}>
        <IconBack />
      </button>
      <div className="p-title sm">{title}</div>
      <span style={{ width: 40 }} />
    </header>
  );
}

function FormatIcon(f: Format) {
  return f === "carousel" ? null : <IconPlay size={11} />;
}
