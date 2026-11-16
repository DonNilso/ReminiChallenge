/**
 * The prototype's "AI": turns plain-language requests into draft changes plus a reply.
 * Scripted on purpose (no backend needed). When OPENROUTER_API_KEY is set, the
 * free-text *reply wording* can come from a model, but the changes below still drive
 * the draft so the demo stays predictable.
 */
import { AESTHETICS, ROLL, type Format } from "./data.ts";

export type Spec = {
  aesthetic: string;
  format: Format;
  photos: string[];
  warmth: number; // -2..2
  mood: number; // 0..2 (darker, more contrast)
  bright: number; // -1..2
};

export type Parsed = {
  spec: Spec;
  changes: string[]; // human-readable, e.g. "moodier", "4 photos"
  generate: boolean; // user said "make it", "looks good", …
  understood: boolean;
};

const WORD_NUMBERS: Record<string, number> = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
const ORDINALS: Record<string, number> = { first: 0, "1st": 0, second: 1, "2nd": 1, third: 2, "3rd": 2, fourth: 3, "4th": 3, fifth: 4, "5th": 4, last: -1 };
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Photos from the roll matching a topic, best first. */
export function photosFor(topic: "saturday" | "friday" | "food" | "best" | "travel", n = 6): string[] {
  const pick = (f: (p: (typeof ROLL)[number]) => boolean) => ROLL.filter(f).map((p) => p.id);
  const lists = {
    saturday: pick((p) => p.when === "Saturday"),
    friday: pick((p) => p.when === "Friday night"),
    food: pick((p) => p.tags.includes("food")),
    travel: pick((p) => p.tags.includes("travel")),
    best: ["sat-sunset", "sat-laugh", "fri-red", "sat-tram", "wk-beach", "sat-coffee", "fri-cheers", "wk-pink"],
  };
  return lists[topic].slice(0, n);
}

function resize(photos: string[], n: number): string[] {
  if (photos.length >= n) return photos.slice(0, n);
  const day = ROLL.find((p) => p.id === photos[0])?.when;
  const extra = ROLL.filter((p) => !photos.includes(p.id) && (!day || p.when === day)).map((p) => p.id);
  const more = ROLL.filter((p) => !photos.includes(p.id) && !extra.includes(p.id)).map((p) => p.id);
  return [...photos, ...extra, ...more].slice(0, n);
}

export function swapPhoto(photos: string[], index: number): string[] {
  const i = index < 0 ? photos.length - 1 : index;
  if (i >= photos.length) return photos;
  const day = ROLL.find((p) => p.id === photos[i])?.when;
  const replacement =
    ROLL.find((p) => !photos.includes(p.id) && p.when === day) ?? ROLL.find((p) => !photos.includes(p.id));
  if (!replacement) return photos;
  const next = [...photos];
  next[i] = replacement.id;
  return next;
}

export function nextAesthetic(current: string, preferred: string[]): string {
  const pool = preferred.length > 1 ? preferred : AESTHETICS.map((a) => a.id);
  const i = pool.indexOf(current);
  return pool[(i + 1) % pool.length] === current ? pool[(i + 2) % pool.length] : pool[(i + 1) % pool.length];
}

export function parse(text: string, spec: Spec, preferred: string[] = []): Parsed {
  const t = text.toLowerCase();
  let s: Spec = { ...spec, photos: [...spec.photos] };
  const changes: string[] = [];
  const has = (...w: string[]) => w.some((x) => t.includes(x));

  // look
  if (has("another look", "different look", "other look", "try another")) {
    s.aesthetic = nextAesthetic(s.aesthetic, preferred);
    changes.push(`${AESTHETICS.find((a) => a.id === s.aesthetic)!.name} look`);
  } else {
    for (const a of AESTHETICS) {
      const names = [a.name.toLowerCase(), a.id.replace("-", " "), a.id];
      if (names.some((n) => t.includes(n)) && a.id !== s.aesthetic) {
        s.aesthetic = a.id;
        changes.push(`${a.name} look`);
        break;
      }
    }
  }

  // tone
  if (has("warmer", "more warm") || /\bwarm\b/.test(t)) (s.warmth = clamp(s.warmth + 1, -2, 2)), changes.push("warmer");
  if (has("cooler", "colder", "cool ")) (s.warmth = clamp(s.warmth - 1, -2, 2)), changes.push("cooler");
  if (has("moody", "moodier", "darker", "dramatic")) (s.mood = clamp(s.mood + 1, 0, 2)), changes.push("moodier");
  if (has("brighter", "lighter", "airy")) (s.bright = clamp(s.bright + 1, -1, 2)), (s.mood = Math.max(0, s.mood - 1)), changes.push("brighter");

  // format
  if (has("reel", "tiktok", "video") && s.format !== "reel") (s.format = "reel"), changes.push("a Reel");
  else if (has("story", "status") && s.format !== "story") (s.format = "story"), changes.push("a Story");
  else if (has("carousel", "feed post") && s.format !== "carousel") (s.format = "carousel"), changes.push("a carousel");

  // which photos
  if (has("saturday", "city trip", "lisbon")) (s.photos = photosFor("saturday", s.photos.length || 6)), changes.push("Saturday's photos");
  else if (has("friday", "night out", "party", "night")) (s.photos = photosFor("friday", s.photos.length || 6)), changes.push("Friday night's photos");
  else if (has("food", "ate", "brunch")) (s.photos = photosFor("food", s.photos.length || 5)), changes.push("your food photos");
  else if (has("best photos", "pick for me", "you pick", "best ones")) (s.photos = photosFor("best", s.photos.length || 6)), changes.push("your best photos");

  // swap the n-th photo
  const swap = t.match(/(?:swap|replace|change)\s+(?:the\s+)?(first|1st|second|2nd|third|3rd|fourth|4th|fifth|5th|last)/);
  if (swap) {
    s.photos = swapPhoto(s.photos, ORDINALS[swap[1]]);
    changes.push(`new ${swap[1]} photo`);
  }

  // how many photos
  const num = t.match(/\b(\d{1,2}|two|three|four|five|six|seven|eight|nine|ten)\s*(?:photos?|pics?|pictures?|slides?|shots?)\b/) ?? t.match(/\bonly\s+(\d{1,2}|two|three|four|five|six|seven|eight|nine|ten)\b/);
  if (num) {
    const n = clamp(Number(num[1]) || WORD_NUMBERS[num[1]], 1, 10);
    s.photos = resize(s.photos, n);
    changes.push(`${n} photos`);
  } else if (has("shorter", "fewer", "less photos")) {
    s.photos = s.photos.slice(0, Math.max(3, s.photos.length - 2));
    changes.push(s.format === "reel" ? "shorter" : `${s.photos.length} photos`);
  } else if (has("longer", "more photos")) {
    s.photos = resize(s.photos, Math.min(10, s.photos.length + 2));
    changes.push(s.format === "reel" ? "longer" : `${s.photos.length} photos`);
  }

  // "make it" only means "go" when nothing follows it ("make it moody" is a change).
  const generate = /\b(looks good|let'?s go|go ahead|create it|do it|yes|perfect|make the draft|generate|make it now)\b/.test(t) || /make it\s*(?:[✨!.]|$)/u.test(t.trim());
  if (s.photos.length === 0) s.photos = photosFor("best", 6);
  return { spec: s, changes, generate, understood: changes.length > 0 || generate };
}

export function describe(changes: string[]): string {
  if (changes.length === 0) return "";
  const list = changes.length === 1 ? changes[0] : `${changes.slice(0, -1).join(", ")} and ${changes.at(-1)}`;
  const openers = ["Done:", "On it:", "Sure:", "Got it:"];
  return `${openers[changes.join().length % openers.length]} ${list}.`;
}

/** CSS filter adjustments for the user's tweaks, appended to the aesthetic's filter. */
export function tweakFilter(spec: Pick<Spec, "warmth" | "mood" | "bright">): string {
  const parts: string[] = [];
  if (spec.mood) parts.push(`brightness(${1 - spec.mood * 0.08}) contrast(${1 + spec.mood * 0.12})`);
  if (spec.bright) parts.push(`brightness(${1 + spec.bright * 0.08})`);
  if (spec.warmth > 0) parts.push(`sepia(${spec.warmth * 0.12}) saturate(${1 + spec.warmth * 0.08})`);
  if (spec.warmth < 0) parts.push(`hue-rotate(${spec.warmth * 8}deg) saturate(${1 + spec.warmth * 0.08})`);
  return parts.join(" ");
}
