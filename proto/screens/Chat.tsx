"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CHAT, FORMATS, FREE_MAX_PHOTOS, ROLL, aesthetic, photo, trend as trendById } from "../data.ts";
import { describe, parse, photosFor, type Spec } from "../brain.ts";
import { formatWord, useProto, suggestionById, type ChatEntry } from "../store.tsx";
import { IconBack, IconCheck, IconSend, IconSparkle, Shot, lookFor } from "../ui.tsx";

type Msg = { id: number; from: "ai" | "me"; text: string; picker?: boolean };

/** Conversation kept per entry so Back (from a draft or the template gallery) returns to it. */
const memory = new Map<string, { msgs: Msg[]; spec: Spec; quick: string[]; nextId: number }>();

const fill = (t: string, v: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));

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
  if (entry.kind === "style") {
    const spec: Spec = { ...base, aesthetic: entry.id, format: "carousel", photos: photosFor("best", 6) };
    return { spec, greet: fill(CHAT.greetStyle, { look: aesthetic(entry.id).name.toLowerCase(), n: 6 }), quick: CHAT.quickSuggestion, picker: true };
  }
  const spec: Spec = { ...base, aesthetic: preferred[0] ?? "golden-hour", format: "carousel", photos: [] };
  return entry.mode === "photo"
    ? { spec, greet: CHAT.greetPhoto, quick: CHAT.quickPhoto, picker: true }
    : { spec, greet: CHAT.greetDescribe, quick: CHAT.quickDescribe, picker: false };
}

export default function Chat({ entry }: { entry: ChatEntry }) {
  const { s, set, back, push, requirePro, formatLocked, isPro, openDraft, startOwnIdea, dir } = useProto();
  const describing = entry.kind === "own" && entry.mode === "idea";
  // Your own idea: the user chooses the photos. The AI only puts likely ones first.
  const ownIdea = entry.kind === "own";
  const [focus, setFocus] = useState<string[]>([]);
  const planRef = useRef(s.plan);
  planRef.current = s.plan;
  const isProNow = () => planRef.current === "pro";
  const init = useMemo(() => initial(entry, s.aesthetics), [entry, s.aesthetics]);
  const key = JSON.stringify(entry);
  // Coming back with Back: restore the conversation. Opening it anew: start fresh.
  const [saved] = useState(() => (dir === "pop" ? memory.get(key) : undefined));
  const [spec, setSpec] = useState<Spec>(saved?.spec ?? init.spec);
  const [msgs, setMsgs] = useState<Msg[]>(saved?.msgs ?? []);
  const [quick, setQuick] = useState<string[]>(saved?.quick ?? init.quick);
  const [typing, setTyping] = useState(!saved);
  const [text, setText] = useState("");
  const idRef = useRef(saved?.nextId ?? 0);

  useEffect(() => {
    memory.set(key, { msgs, spec, quick, nextId: idRef.current });
  }, [key, msgs, spec, quick]);
  const scroller = useRef<HTMLDivElement>(null);

  const add = (m: Omit<Msg, "id">) => setMsgs((prev) => [...prev, { ...m, id: idRef.current++ }]);

  // AI greeting (with a short "typing" beat so it feels alive)
  const greeted = useRef(!!saved);
  const greetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const greet = () => {
    if (greeted.current) return;
    greeted.current = true;
    clearTimeout(greetTimer.current);
    setTyping(false);
    add({ from: "ai", text: init.greet, picker: init.picker });
  };
  useEffect(() => {
    if (saved) return;
    greetTimer.current = setTimeout(greet, 700);
    return () => clearTimeout(greetTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [msgs, typing]);

  const lastPickerId = [...msgs].reverse().find((m) => m.picker)?.id;

  const generate = (sp: Spec) => {
    if (sp.photos.length === 0) {
      aiSay(ownIdea ? "Choose at least one photo below first." : "Pick at least one photo first, or tap “Pick for me”.", ownIdea ? CHAT.quickAfterChange : CHAT.quickPhoto, ownIdea);
      return;
    }
    // Your own idea (described or from photos): Free preview, Pro full post.
    if (entry.kind === "own") return startOwnIdea(sp, "Your idea", "describe");
    if (entry.kind === "style") return startOwnIdea(sp, aesthetic(entry.id).name, "template");
    // Weekly ideas and trends: 1 free draft a week, carousel only.
    const go = () => {
      set((st) => ({ freeDraftsUsed: st.plan === "free" ? st.freeDraftsUsed + 1 : st.freeDraftsUsed }));
      // Free: one full post a week of up to FREE_MAX_PHOTOS photos.
      const capped = !isProNow() && sp.photos.length > FREE_MAX_PHOTOS;
      const final = capped ? { ...sp, photos: sp.photos.slice(0, FREE_MAX_PHOTOS) } : sp;
      // Posts made from a trend keep the trend's name ("Me & me, 10 years ago · Reel").
      openDraft(final, entry.kind === "trend" ? trendById(entry.id).name : null, {
        note: capped ? fill(CHAT.freeCap, { max: FREE_MAX_PHOTOS, n: sp.photos.length }) : undefined,
      });
    };
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
    greet(); // if they type before the greeting appears, show it first
    add({ from: "me", text: t });
    const parsed = parse(t, spec, s.aesthetics);
    // Own idea: photo topics ("from Friday", "like the link") only reorder the picker.
    const photosTouched = parsed.spec.photos.join() !== spec.photos.join();
    const r = ownIdea && photosTouched ? { ...parsed, spec: { ...parsed.spec, photos: spec.photos } } : parsed;
    if (ownIdea && photosTouched) setFocus(parsed.spec.photos);
    setSpec(r.spec);
    if (r.action === "templates" && !r.generate) {
      aiSay(CHAT.toTemplates, CHAT.quickAfterChange);
      setTimeout(() => push({ name: "templates" }), 1300);
      return;
    }
    if (r.action === "describe" && r.changes.length === 0 && !r.generate) {
      aiSay(CHAT.describeAsk, CHAT.quickDescribe);
      return;
    }
    if (r.action === "link" && !r.generate) {
      aiSay(
        ownIdea ? `${CHAT.linkApplied} ${CHAT.choosePhotos}` : `${CHAT.linkApplied} ${r.spec.photos.length} photos as a ${formatWord(r.spec.format)}. Ready when you are.`,
        CHAT.quickAfterChange,
        true,
      );
      return;
    }
    if (r.generate) {
      if (r.changes.length) aiSay(describe(r.changes) + " Making it now…", []);
      setTimeout(() => generate(r.spec), r.changes.length ? 900 : 300);
      return;
    }
    if (r.understood) {
      if (ownIdea && r.spec.photos.length === 0) {
        // Photos aren't chosen for you here: only mention the look and format changes.
        const said = describe(r.changes.filter((c) => !c.includes("photo")));
        aiSay(`${said ? `${said} ` : ""}A ${formatWord(r.spec.format)} in ${aesthetic(r.spec.aesthetic).name.toLowerCase()}. ${CHAT.choosePhotos}`, CHAT.quickAfterChange, true);
        return;
      }
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
    // Own idea: the photos that fit the description come first (but aren't selected).
    const suggested = ROLL.filter((p) => focus.includes(p.id));
    const first = ROLL.filter((p) => !suggested.includes(p) && (spec.photos.includes(p.id) || (day && p.when === day)));
    return [...extra, ...suggested, ...first, ...ROLL.filter((p) => !first.includes(p) && !suggested.includes(p))].slice(0, 18);
  }, [spec.photos, focus]);

  return (
    <div className="scr chat">
      <header className="p-top">
        <button className="p-icon" aria-label="Back" onClick={back}>
          <IconBack />
        </button>
        <div className="p-title sm">{describing ? "Describe it" : "New post"}</div>
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
                    {ownIdea
                      ? `${spec.photos.length} chosen · ${focus.length ? "the ones that fit are first" : "tap the photos you want"}`
                      : `${spec.photos.length} selected · ${photo(spec.photos[0] ?? "").when || "your camera roll"}`}
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
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={describing ? CHAT.describePlaceholder : "Tell the AI what you want…"}
            aria-label="Message"
            data-testid="chat-input"
            autoFocus={describing}
          />
          <button className="send" aria-label="Send" disabled={!text.trim()}>
            <IconSend size={20} />
          </button>
        </form>
        <button className="make" onClick={() => generate(spec)} data-testid="make-draft">
          <IconCheck size={18} /> Make the draft ·{" "}
          {!isPro && !ownIdea && spec.photos.length > FREE_MAX_PHOTOS ? `${FREE_MAX_PHOTOS} of ${spec.photos.length} photos · Free` : `${spec.photos.length} photos`}
        </button>
      </div>
    </div>
  );
}

export { photosFor };
