/**
 * ALL mock data for the Creator Studio prototype lives in this file.
 * Edit names, photos, suggestions, trends, chat lines and prices here.
 * Photos are Unsplash placeholders in /public/p (see public/p/CREDITS.md).
 */

// ---------------------------------------------------------------- user
export const USER = {
  name: "Mia",
  handle: "@mia.moments",
  avatar: "/p/me.jpg", // also the AI face profile "Person 1"
};

export const PRICING = {
  trialDays: 3,
  weekly: "€9.99",
  yearly: "€59.99",
};

// ---------------------------------------------------------------- photos ("camera roll")
export type Photo = { id: string; src: string; when: string; tags: string[] };

const p = (id: string, when: string, ...tags: string[]): Photo => ({ id, src: `/p/${id}.jpg`, when, tags });

export const ROLL: Photo[] = [
  p("sat-tram", "Saturday", "city", "travel"),
  p("sat-coffee", "Saturday", "food", "friends"),
  p("sat-laugh", "Saturday", "friends", "portrait"),
  p("sat-walk", "Saturday", "city", "portrait"),
  p("sat-street", "Saturday", "travel", "city"),
  p("sat-denim", "Saturday", "portrait", "city"),
  p("sat-terrace", "Saturday", "food", "travel"),
  p("sat-pancakes", "Saturday", "food"),
  p("sat-sunset", "Saturday", "friends", "sunset"),
  p("sat-friends", "Saturday", "friends", "sunset"),
  p("sat-sun", "Saturday", "portrait", "sunset"),
  p("sat-table", "Saturday", "friends", "food"),
  p("fri-cheers", "Friday night", "night", "friends"),
  p("fri-bar", "Friday night", "night"),
  p("fri-red", "Friday night", "night", "portrait"),
  p("fri-lights", "Friday night", "night", "portrait"),
  p("fri-cocktail", "Friday night", "night", "food"),
  p("fri-concert", "Friday night", "night"),
  p("fri-confetti", "Friday night", "night"),
  p("wk-coffee", "This week", "food"),
  p("wk-bowl", "This week", "food"),
  p("wk-toast", "This week", "food"),
  p("wk-pizza", "This week", "food"),
  p("wk-dinner", "This week", "food", "friends"),
  p("wk-white", "Last week", "portrait"),
  p("wk-pink", "Last week", "portrait"),
  p("wk-beach", "Last week", "travel", "sunset"),
  p("wk-coast", "Last week", "travel"),
  p("wk-venice", "Last week", "travel", "city"),
  p("wk-hike", "Last week", "travel", "friends"),
];

export const photo = (id: string) => ROLL.find((x) => x.id === id) ?? { id, src: `/p/${id}.jpg`, when: "", tags: [] };

// ---------------------------------------------------------------- aesthetics (looks)
/**
 * A look is rendered on top of the user's real photo with CSS (filter + colour overlay
 * + grain + vignette). In the real product this is the AI restyle; here it only has
 * to read convincingly in a demo.
 */
export type Look = {
  filter: string;
  overlay?: string; // CSS background
  blend?: string; // mix-blend-mode of the overlay
  grain?: number; // 0..0.3
  vignette?: number; // 0..0.8
  flash?: boolean; // bright on-camera-flash centre
};

export type Aesthetic = {
  id: string;
  name: string;
  words: string[]; // used for the "Your style: …" summary
  cover: string;
  look: Look;
};

export const AESTHETICS: Aesthetic[] = [
  {
    id: "old-money",
    name: "Old money",
    words: ["timeless", "quiet luxury"],
    cover: "/p/ae-old-money.jpg",
    look: { filter: "sepia(.2) saturate(.75) contrast(.95) brightness(1.04)", overlay: "linear-gradient(180deg, rgba(222,200,160,.28), rgba(70,50,30,.18))", blend: "soft-light", grain: 0.05, vignette: 0.25 },
  },
  {
    id: "film-flash",
    name: "Film flash",
    words: ["film", "flash"],
    cover: "/p/sat-laugh.jpg",
    look: { filter: "contrast(1.28) saturate(1.18) brightness(1.04)", overlay: "linear-gradient(180deg, rgba(40,70,120,.18), rgba(0,0,0,.1))", blend: "soft-light", grain: 0.16, vignette: 0.55, flash: true },
  },
  {
    id: "golden-hour",
    name: "Golden hour",
    words: ["warm", "golden hour"],
    cover: "/p/sat-sunset.jpg",
    look: { filter: "sepia(.22) saturate(1.3) brightness(1.06) hue-rotate(-6deg)", overlay: "linear-gradient(150deg, rgba(255,176,64,.45), rgba(255,96,48,.18))", blend: "soft-light", grain: 0.04, vignette: 0.3 },
  },
  {
    id: "soft-glam",
    name: "Soft glam",
    words: ["soft", "glam"],
    cover: "/p/ae-soft-glam.jpg",
    look: { filter: "brightness(1.08) contrast(.9) saturate(1.05)", overlay: "linear-gradient(180deg, rgba(255,182,200,.35), rgba(255,220,230,.2))", blend: "soft-light", grain: 0.02, vignette: 0.15 },
  },
  {
    id: "clean-girl",
    name: "Clean girl",
    words: ["clean", "fresh"],
    cover: "/p/ae-clean-girl.jpg",
    look: { filter: "brightness(1.13) contrast(.9) saturate(.82)", overlay: "linear-gradient(180deg, rgba(235,244,255,.3), rgba(255,255,255,.1))", blend: "screen", grain: 0, vignette: 0 },
  },
  {
    id: "90s",
    name: "90s",
    words: ["retro", "90s"],
    cover: "/p/ae-90s.jpg",
    look: { filter: "sepia(.3) contrast(.88) saturate(.85) hue-rotate(-8deg) brightness(1.05)", overlay: "linear-gradient(180deg, rgba(0,150,170,.18), rgba(255,170,80,.2))", blend: "overlay", grain: 0.2, vignette: 0.35 },
  },
  {
    id: "streetwear",
    name: "Streetwear",
    words: ["street", "bold"],
    cover: "/p/ae-streetwear.jpg",
    look: { filter: "contrast(1.3) saturate(.65) brightness(.96)", overlay: "linear-gradient(180deg, rgba(20,50,90,.25), rgba(0,0,0,.15))", blend: "soft-light", grain: 0.08, vignette: 0.45 },
  },
  {
    id: "minimal",
    name: "Minimal",
    words: ["minimal", "calm"],
    cover: "/p/ae-minimal.jpg",
    look: { filter: "brightness(1.1) saturate(.55) contrast(.95)", grain: 0, vignette: 0 },
  },
];

/** Free previews only enhance the photo; the trend look needs Pro. */
export const ENHANCE_ONLY: Look = { filter: "contrast(1.07) saturate(1.1) brightness(1.03)" };

export const aesthetic = (id: string) => AESTHETICS.find((a) => a.id === id) ?? AESTHETICS[0];

// ---------------------------------------------------------------- formats
export type Format = "carousel" | "reel" | "story";

export const FORMATS: Record<Format, { label: string; ratio: string; platforms: string[]; pro: boolean }> = {
  carousel: { label: "Carousel 4:5", ratio: "4 / 5", platforms: ["Instagram"], pro: false },
  reel: { label: "Reel 9:16", ratio: "9 / 16", platforms: ["Instagram", "TikTok"], pro: true },
  story: { label: "Story 9:16", ratio: "9 / 16", platforms: ["Instagram", "WhatsApp Status"], pro: true },
};

export const PLATFORMS = ["Instagram", "TikTok", "WhatsApp Status"];
export const GOALS = [
  { id: 1, label: "1× a week" },
  { id: 3, label: "3× a week" },
  { id: 7, label: "Daily" },
];

// ---------------------------------------------------------------- weekly suggestions
export type Suggestion = {
  id: string;
  title: string; // "A carousel from Saturday"
  format: Format;
  aesthetic: string;
  photos: string[];
  from: string; // shown in the chat greeting
  why: string;
};

export const SUGGESTIONS: Suggestion[] = [
  {
    id: "sat-carousel",
    title: "A carousel from Saturday",
    format: "carousel",
    aesthetic: "golden-hour",
    photos: ["sat-sunset", "sat-tram", "sat-coffee", "sat-laugh", "sat-terrace", "sat-friends"],
    from: "Saturday's photos",
    why: "6 photos from Saturday · golden light all day",
  },
  {
    id: "fri-reel",
    title: "A Reel in film flash",
    format: "reel",
    aesthetic: "film-flash",
    photos: ["fri-cheers", "fri-red", "fri-bar", "fri-lights", "fri-confetti", "fri-cocktail", "fri-concert"],
    from: "Friday night",
    why: "7 clips' worth from Friday night · film flash is rising",
  },
  {
    id: "golden-story",
    title: "A Story in golden hour",
    format: "story",
    aesthetic: "golden-hour",
    photos: ["sat-sun", "sat-sunset", "sat-friends"],
    from: "Saturday's sunset",
    why: "3 sunset shots · perfect for a Story",
  },
  {
    id: "food-carousel",
    title: "Your week in food",
    format: "carousel",
    aesthetic: "old-money",
    photos: ["wk-dinner", "wk-coffee", "wk-toast", "sat-pancakes", "wk-bowl"],
    from: "this week's food photos",
    why: "5 food photos · old money tones",
  },
];

// ---------------------------------------------------------------- rising trends
export type Trend = {
  id: string; // = aesthetic id it maps to
  name: string;
  growth: number; // % this week
  blurb: string;
  examples: string[]; // example posts (other people's)
  fromPhotos: string[]; // the user's photos it would restyle
  format: Format;
};

export const TRENDS: Trend[] = [
  { id: "film-flash", name: "Film flash", growth: 44, blurb: "Direct flash, deep shadows, party energy", examples: ["ex-neon", "ex-red", "ex-leather"], fromPhotos: ["fri-cheers", "fri-red", "fri-lights", "fri-bar", "sat-laugh"], format: "carousel" },
  { id: "old-money", name: "Old money", growth: 18, blurb: "Cream, camel and navy. Quiet and timeless", examples: ["ex-shopping", "ex-dress", "ex-blonde"], fromPhotos: ["wk-white", "sat-terrace", "wk-dinner", "sat-walk"], format: "carousel" },
  { id: "golden-hour", name: "Golden hour", growth: 12, blurb: "Warm sun, glowing skin, long shadows", examples: ["ex-smile", "ex-curls", "ex-denim"], fromPhotos: ["sat-sun", "sat-sunset", "sat-friends", "wk-beach"], format: "story" },
  { id: "soft-glam", name: "Soft glam", growth: 31, blurb: "Pink-soft light, dewy and polished", examples: ["ex-redhead", "ex-dark", "ex-portrait"], fromPhotos: ["wk-pink", "sat-denim", "fri-lights"], format: "carousel" },
  { id: "clean-girl", name: "Clean girl", growth: 9, blurb: "Bright, fresh, no-makeup makeup", examples: ["ex-winter", "ex-hoodie", "ex-hat"], fromPhotos: ["wk-pink", "wk-coffee", "sat-walk"], format: "carousel" },
];

export const trend = (id: string) => TRENDS.find((t) => t.id === id) ?? TRENDS[0];

/** The trend the user picked in onboarding, turned into a ready-to-make idea. */
export function trendSuggestion(trendId: string): Suggestion {
  const t = trend(trendId);
  const first = ROLL.find((x) => x.id === t.fromPhotos[0]);
  const word = t.format === "carousel" ? "carousel" : t.format === "reel" ? "Reel" : "Story";
  return {
    id: `trend-${t.id}`,
    title: `Your first ${t.name.toLowerCase()} ${word}`,
    format: t.format,
    aesthetic: t.id,
    photos: [...t.fromPhotos],
    from: first ? `${first.when.toLowerCase()}'s photos` : "your recent photos",
    why: `The trend you picked · +${t.growth}% this week`,
  };
}

// ---------------------------------------------------------------- onboarding
/** Screenshots the user "uploads" as inspiration (mock). */
export const INSPIRATION_UPLOADS = [
  { src: "/p/ex-neon.jpg", source: "Instagram" },
  { src: "/p/ex-shopping.jpg", source: "Pinterest" },
  { src: "/p/ex-leather.jpg", source: "TikTok" },
];

// ---------------------------------------------------------------- Remini home (host app)
export const HOME = {
  retouch: [
    { label: "Face contour", src: "/p/ex-man.jpg" },
    { label: "Change hair", src: "/p/ex-boy.jpg" },
    { label: "Add muscles", src: "/p/ex-beard.jpg" },
    { label: "New outfit", src: "/p/ex-dark.jpg" },
  ],
  recent: ["sat-laugh", "sat-denim", "fri-red", "wk-pink", "sat-walk"],
  viral: ["/p/ex-neon.jpg", "/p/ex-leather.jpg", "/p/ex-red.jpg"],
  packs: [
    { label: "Iconic", src: "/p/ex-portrait.jpg" },
    { label: "Golden hour", src: "/p/ex-smile.jpg" },
    { label: "Cozy", src: "/p/ex-winter.jpg" },
  ],
  lockWallpaper: "/p/wall.jpg",
};

// ---------------------------------------------------------------- notifications
export const NOTIFICATIONS = {
  ready: { title: "Your post is ready to make", body: "A golden-hour carousel from Saturday is ready to make.", suggestion: "sat-carousel" },
  trend: { title: "Film flash is taking off", body: "Film flash is taking off. Here's your version.", trend: "film-flash" },
};

// ---------------------------------------------------------------- chat script
/** Canned AI lines. {look}, {format}, {from}, {n} are filled in. */
export const CHAT = {
  greetSuggestion: "Let's make a {look} {format} from {from} ✨ I picked {n} photos that work best. Tap any to swap, or tell me what you want.",
  greetTrend: "{look} is up {growth}% this week. I can make your version from {from}: {n} photos, ready in seconds.",
  greetPhoto: "Which photos should we use? Pick a few below, or just tell me what you want to post.",
  greetIdea: "What do you want to post? Describe it in a few words, like “cozy café morning” or “night out with friends”.",
  quickSuggestion: ["Looks good, make it ✨", "Make it moody", "Only 4 photos", "Turn it into a Reel"],
  quickPhoto: ["Use Saturday's photos", "My best photos this week", "Pick for me"],
  quickIdea: ["Night out with friends", "City trip on Saturday", "Food I ate this week"],
  quickAfterChange: ["Make it ✨", "Warmer", "Try another look"],
  fallback: "Got it, I'll keep that in mind. Want me to make the draft now?",
  generating: ["Picking your best shots", "Applying the look", "Matching colours across photos", "Fitting it to the format"],
  draftReady: "Here's your draft. Ask for any change, like “warmer”, “swap the second photo” or “shorter”.",
  quickDraft: ["Warmer", "Swap the 2nd photo", "Moodier", "Shorter"],
  posted: "Posted! That's {done} of {goal} this week.",
};
