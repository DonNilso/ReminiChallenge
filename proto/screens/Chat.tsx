"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CHAT, FORMATS, ROLL, aesthetic, photo, trend as trendById } from "../data.ts";
import { describe, parse, photosFor, type Spec } from "../brain.ts";
import { useProto, suggestionById, type ChatEntry } from "../store.tsx";
import { IconBack, IconCheck, IconSend, IconSparkle, Shot, lookFor } from "../ui.tsx";

type Msg = { id: number; from: "ai" | "me"; text: string; picker?: boolean };

const fill = (t: string, v: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));
const formatWord = (f: Spec["format"]) => (f === "carousel" ? "carousel" : f === "reel" ? "Reel" : "Story");

function initial(entry: ChatEntry, preferred: string[]): { spec: Spec; greet: string; quick: string[]; picker: boolean } {
  const base = { warmth: 0, mood: 0, bright: 0 };
  if (entry.kind === "suggestion") {
    const sg = suggestionById(entry.id);
    const spec: Spec = { ...base, aesthetic: sg.aesthetic, format: sg.format, photos: [...sg.photos] };
    return {
      spec,
      greet: fill(CHAT.greetSuggestion, { look: aesthetic(sg.aesthetic).name.toLowerCase(), format: formatWord(sg.format), from: sg.from, n: sg.photos.length }),
      quick: CHAT.quickSuggestion,
      picker: true,
    };
  }
  if (entry.kind === "trend") {
    const t = trendById(entry.id);
    const spec: Spec = { ...base, aesthetic: t.aesthetic, format: t.format, photos: [...t.fromPhotos] };
    const from = photo(t.fromPhotos[0]).when.toLowerCase() || "your photos and face profile";
    return {
      spec,
      greet: fill(CHAT.greetTrend, { look: t.name, growth: t.growth, from, n: t.fromPhotos.length }),
      quick: CHAT.quickSuggestion,
      picker: true,
    };
  }
  const spec: Spec = { ...base, aesthetic: preferred[0] ?? "golden-hour", format: "carousel", photos: [] };
  return entry.mode === "photo"
    ? { spec, greet: CHAT.greetPhoto, quick: CHAT.quickPhoto, picker: true }
    : { spec, greet: CHAT.greetIdea, quick: CHAT.quickIdea, picker: false };
}

export default function Chat({ entry }: { entry: ChatEntry }) {
  const { s, set, back, push, requirePro, formatLocked, isPro } = useProto();
  const init = useMemo(() => initial(entry, s.aesthetics), [entry, s.aesthetics]);
  const [spec, setSpec] = useState<Spec>(init.spec);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [quick, setQuick] = useState<string[]>(init.quick);
  const [typing, setTyping] = useState(true);
  const [text, setText] = useState("");
  const idRef = useRef(0);
  const scroller = useRef<HTMLDivElement>(null);

  const add = (m: Omit<Msg, "id">) => setMsgs((prev) => [...prev, { ...m, id: idRef.current++ }]);

  // AI greeting (with a short "typing" beat so it feels alive)
  useEffect(() => {
    const t = setTimeout(() => {
      setTyping(false);
      add({ from: "ai", text: init.greet, picker: init.picker });
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [msgs, typing]);

  const lastPickerId = [...msgs].reverse().find((m) => m.picker)?.id;

  const generate = (sp: Spec) => {
    const go = () => {
      set((st) => ({
        draft: {
          spec: sp,
          // Posts made from a trend keep the trend's name ("Me & me, 10 years ago · Reel").
          title: entry.kind === "trend" ? `${trendById(entry.id).name} · ${formatWord(sp.format)}` : `${aesthetic(sp.aesthetic).name} ${formatWord(sp.format)}`,
          trend: entry.kind === "trend" ? entry.id : null,
          edits: 0,
          version: 1,
        },
        freeDraftsUsed: st.plan === "free" ? st.freeDraftsUsed + 1 : st.freeDraftsUsed,
      }));
      push({ name: "draft" });
    };
    if (sp.photos.length === 0) {
      aiSay("Pick at least one photo first, or tap “Pick for me”.", CHAT.quickPhoto);
      return;
    }
    if (formatLocked(sp.format)) return requirePro(`${FORMATS[sp.format].label.split(" ")[0]}s are part of Pro`, go);
    if (!isPro && s.freeDraftsUsed >= 1) return requirePro("You've used this week's free draft", go);
    go();
  };

  const aiSay = (t: string, q: string[] = CHAT.quickAfterChange, picker = false) => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      add({ from: "ai", text: t, picker });
      setQuick(q);
    }, 650);
  };

  const send = async (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    setText("");
    add({ from: "me", text: t });
    const r = parse(t, spec, s.aesthetics);
    setSpec(r.spec);
    if (r.generate) {
      if (r.changes.length) aiSay(describe(r.changes) + " Making it now…", []);
      setTimeout(() => generate(r.spec), r.changes.length ? 900 : 300);
      return;
    }
    if (r.understood) {
      const pickerAgain = r.changes.some((c) => c.includes("photo"));
      aiSay(`${describe(r.changes)} ${r.spec.photos.length} photos in ${aesthetic(r.spec.aesthetic).name.toLowerCase()}. Ready when you are.`, CHAT.quickAfterChange, pickerAgain);
      return;
    }
    // Not something the script understands: ask the model if one is configured.
    setTyping(true);
    let reply = CHAT.fallback;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: t, context: { look: aesthetic(spec.aesthetic).name, format: spec.format, photos: spec.photos.length } }),
      });
      if (res.ok) {
        const j = (await res.json()) as { reply?: string };
        if (j.reply) reply = j.reply;
      }
    } catch {}
    setTyping(false);
    add({ from: "ai", text: reply });
    setQuick(CHAT.quickAfterChange);
  };

  const togglePhoto = (id: string) =>
    setSpec((sp) => {
      const has = sp.photos.includes(id);
      if (!has && sp.photos.length >= 10) return sp;
      return { ...sp, photos: has ? sp.photos.filter((x) => x !== id) : [...sp.photos, id] };
    });

  // Picker shows the relevant day first, then everything else.
  const pickerPhotos = useMemo(() => {
    const day = photo(spec.photos[0] ?? "")?.when;
    // Trend images that aren't in the camera roll (face profile, "now / then" frames) come first.
    const extra = spec.photos.filter((id) => !ROLL.some((p) => p.id === id)).map(photo);
    const first = ROLL.filter((p) => spec.photos.includes(p.id) || (day && p.when === day));
    return [...extra, ...first, ...ROLL.filter((p) => !first.includes(p))].slice(0, 18);
  }, [spec.photos]);

  return (
    <div className="scr chat">
      <header className="p-top">
        <button className="p-icon" aria-label="Back" onClick={back}>
          <IconBack />
        </button>
        <div className="p-title sm">New post</div>
        <span className="chat-spec">
          {aesthetic(spec.aesthetic).name} · {formatWord(spec.format)}
        </span>
      </header>

      <div className="chat-log" ref={scroller} data-testid="chat-log">
        {msgs.map((m) => (
          <div key={m.id} className={`msg ${m.from}`}>
            {m.from === "ai" && (
              <span className="ai-av">
                <IconSparkle size={16} />
              </span>
            )}
            <div className="bubble-wrap">
              <div className="bubble">{m.text}</div>
              {m.picker && (
                <div className={`picker${m.id === lastPickerId ? "" : " old"}`} data-testid="picker">
                  {pickerPhotos.map((p) => {
                    const i = spec.photos.indexOf(p.id);
                    return (
                      <button key={p.id} className={`pk${i >= 0 ? " on" : ""}`} onClick={() => m.id === lastPickerId && togglePhoto(p.id)}>
                        <Shot src={p.src} look={lookFor(null)} />
                        {i >= 0 && <span className="pk-n">{i + 1}</span>}
                      </button>
                    );
                  })}
                  <div className="pk-foot">
                    {spec.photos.length} selected · {photo(spec.photos[0] ?? "").when || "your camera roll"}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {typing && (
          <div className="msg ai">
            <span className="ai-av">
              <IconSparkle size={16} />
            </span>
            <div className="bubble typing">
              <i />
              <i />
              <i />
            </div>
          </div>
        )}
      </div>

      <div className="composer">
        <div className="quick" data-testid="quick">
          {quick.map((q) => (
            <button key={q} className="qr" onClick={() => send(q)}>
              {q}
            </button>
          ))}
        </div>
        <form
          className="input-row"
          onSubmit={(e) => {
            e.preventDefault();
            send(text);
          }}
        >
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Tell the AI what you want…" aria-label="Message" data-testid="chat-input" />
          <button className="send" aria-label="Send" disabled={!text.trim()}>
            <IconSend size={20} />
          </button>
        </form>
        <button className="make" onClick={() => generate(spec)} data-testid="make-draft">
          <IconCheck size={18} /> Make the draft · {spec.photos.length} photos
        </button>
      </div>
    </div>
  );
}

export { photosFor };
