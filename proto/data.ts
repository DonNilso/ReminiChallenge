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
  hidden?: boolean; // used by a trend only, not offered in onboarding
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

// Looks used by trends only (not in the onboarding grid).
AESTHETICS.push({
  id: "dark-academia",
  name: "Dark academia",
  hidden: true,
  words: ["moody", "academic"],
  cover: "/p/ex-portrait.jpg",
  look: { filter: "sepia(.35) saturate(.7) contrast(1.15) brightness(.9)", overlay: "linear-gradient(180deg, rgba(110,72,36,.38), rgba(25,18,10,.38))", blend: "soft-light", grain: 0.1, vignette: 0.6 },
});

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
/**
 * Viral content trends (ideas, not just colour looks). Each one is made from the user's
 * own photos and face profile; `aesthetic` is the look applied on top.
 */
export type Trend = {
  id: string;
  name: string;
  growth: number; // % this week
  blurb: string;
  aesthetic: string; // look id (see AESTHETICS)
  examples: string[]; // example posts (other people's)
  fromPhotos: string[]; // what the user's version is made from (first = preview)
  format: Format;
};

export const TRENDS: Trend[] = [
  {
    id: "younger-me",
    name: "Me & me, 10 years ago",
    growth: 71,
    blurb: "A Reel where you talk to your younger self",
    aesthetic: "golden-hour",
    examples: ["duo-ex", "ex-portrait-2016", "ex-portrait"],
    fromPhotos: ["duo", "me", "me-2016"],
    format: "reel",
  },
  {
    id: "hairstyles",
    name: "5 hairstyles on me",
    growth: 58,
    blurb: "Try new hair on yourself, one look per slide",
    aesthetic: "soft-glam",
    examples: ["ex-redhead", "ex-curls", "ex-blonde"],
    fromPhotos: ["me", "ex-redhead", "ex-curls", "ex-blonde", "ex-dark"],
    format: "carousel",
  },
  {
    id: "film-flash",
    name: "Film flash",
    growth: 44,
    blurb: "Direct flash, deep shadows, party energy",
    aesthetic: "film-flash",
    examples: ["ex-neon", "ex-red", "ex-leather"],
    fromPhotos: ["fri-cheers", "fri-red", "fri-lights", "fri-bar", "sat-laugh"],
    format: "carousel",
  },
  {
    id: "dark-academia",
    name: "Dark academia",
    growth: 34,
    blurb: "Tweed, candlelight and old libraries",
    aesthetic: "dark-academia",
    examples: ["ex-portrait", "ex-hat", "ex-man"],
    fromPhotos: ["wk-white", "sat-walk", "fri-lights", "wk-dinner"],
    format: "carousel",
  },
  {
    id: "main-character",
    name: "Main character",
    growth: 22,
    blurb: "Cinematic travel shots with you at the centre",
    aesthetic: "golden-hour",
    examples: ["ex-denim", "ex-blonde", "ex-smile"],
    fromPhotos: ["sat-walk", "sat-street", "wk-coast", "sat-tram"],
    format: "story",
  },
];

export const trend = (id: string) => TRENDS.find((t) => t.id === id) ?? TRENDS[0];
export const trendLook = (id: string) => aesthetic(trend(id).aesthetic).look;

/** The trend the user picked in onboarding, turned into a ready-to-make idea. */
export function trendSuggestion(trendId: string): Suggestion {
  const t = trend(trendId);
  const first = ROLL.find((x) => x.id === t.fromPhotos[0]);
  return {
    id: `trend-${t.id}`,
    title: t.name,
    format: t.format,
    aesthetic: t.aesthetic,
    photos: [...t.fromPhotos],
    from: first ? `${first.when.toLowerCase()}'s photos` : "your photos and face profile",
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

// ---------------------------------------------------------------- hub copy
/** Creator Studio is a posting HUB: one tab where creators make, track and post content. */
export const HUB = {
  homeSub: "Your posting hub. Make any trend or idea with your own photos.",
  dashSub: "Your posting hub",
  waysIn: "Bring any post or idea, or let us bring you ideas every week.",
  bringTitle: "Bring your idea",
  bringSub: "Any post, vision or template, made with your photos.",
  nudgeLabel: "Or let us bring you ideas",
};

// ---------------------------------------------------------------- Mia's past posts (made with Creator Studio)
export type PastPost = { photo: string; aesthetic: string; format: Format; label: string; when: string };

export const PAST_POSTS: PastPost[] = [
  { photo: "wk-beach", aesthetic: "golden-hour", format: "carousel", label: "Beach day", when: "Last week" },
  { photo: "fri-red", aesthetic: "film-flash", format: "reel", label: "Friday flash", when: "Last week" },
  { photo: "wk-venice", aesthetic: "old-money", format: "carousel", label: "Venice", when: "2 weeks ago" },
  { photo: "wk-pink", aesthetic: "soft-glam", format: "story", label: "GRWM", when: "2 weeks ago" },
  { photo: "wk-coffee", aesthetic: "clean-girl", format: "story", label: "Sunday coffee", when: "3 weeks ago" },
  { photo: "wk-hike", aesthetic: "90s", format: "carousel", label: "Dolomites", when: "3 weeks ago" },
];

// ---------------------------------------------------------------- bring a link
/** The post a creator brings (pasted or shared from TikTok) and what we "read" from it. */
export const LINK_DEMO = {
  url: "tiktok.com/@cityloops/video/7311428590236",
  display: "tiktok.com/@cityloops/video/7311…",
  platform: "TikTok",
  author: "@cityloops",
  caption: "friday in 7 cuts 📸 #filmflash",
  thumb: "/p/ex-neon.jpg",
  format: "reel" as Format,
  cuts: 7,
  seconds: 12,
  aesthetic: "film-flash",
  textOnScreen: "text on beat 2",
  reading: ["Cuts and pacing", "The look", "Text on screen", "Length"],
  photos: ["fri-cheers", "fri-red", "fri-bar", "fri-lights", "fri-confetti", "fri-cocktail", "sat-laugh"],
  name: "Your @cityloops version",
  promise: "We recreate the format and look, never the content. Add the sound when you post.",
};

// ---------------------------------------------------------------- templates
export type Template = { id: string; name: string; format: Format; aesthetic: string; cover: string; photos: string[]; blurb: string };

export const TEMPLATES: Template[] = [
  { id: "photo-dump", name: "Photo dump", format: "carousel", aesthetic: "90s", cover: "sat-laugh", photos: ["sat-laugh", "sat-coffee", "sat-tram", "fri-cocktail", "sat-pancakes", "sat-friends", "wk-beach"], blurb: "Unfiltered moments, one vibe" },
  { id: "younger-me", name: "Me & me, 10 years ago", format: "reel", aesthetic: "golden-hour", cover: "duo", photos: ["duo", "me", "me-2016"], blurb: "Talk to your younger self" },
  { id: "five-outfits", name: "5 outfits on me", format: "carousel", aesthetic: "old-money", cover: "wk-white", photos: ["wk-white", "sat-denim", "fri-red", "wk-pink", "sat-walk"], blurb: "One outfit per slide" },
  { id: "grwm", name: "Get ready with me", format: "reel", aesthetic: "soft-glam", cover: "wk-pink", photos: ["wk-pink", "me", "fri-lights", "fri-red", "fri-cheers"], blurb: "From mirror to night out" },
  { id: "day-in-my-life", name: "Day in my life", format: "story", aesthetic: "clean-girl", cover: "wk-coffee", photos: ["wk-coffee", "sat-tram", "wk-bowl", "sat-walk", "sat-sunset"], blurb: "Morning to night in 5 frames" },
  { id: "golden-carousel", name: "Golden hour carousel", format: "carousel", aesthetic: "golden-hour", cover: "sat-sunset", photos: ["sat-sunset", "sat-sun", "sat-friends", "wk-beach", "sat-street"], blurb: "Warm light on every slide" },
  { id: "film-flash", name: "Film flash", format: "reel", aesthetic: "film-flash", cover: "fri-red", photos: ["fri-red", "fri-cheers", "fri-bar", "fri-lights", "fri-confetti"], blurb: "Flash, cuts on the beat" },
];

export const template = (id: string) => TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];

// ---------------------------------------------------------------- Free vs Pro
export const FREE_VS_PRO: [string, string, string][] = [
  ["Your own idea (link, description or template)", "Free preview", "Full post"],
  ["Weekly ideas from your photos", "Enhance-only preview", "Full trend look"],
  ["Full drafts from weekly ideas", "1 a week", "Unlimited"],
  ["Formats", "Carousel", "Carousel, Reel, Story"],
  ["Edits by asking", "3 per draft", "Unlimited"],
  ["“Made with Remini” mark", "Yes", "No"],
];

// ---------------------------------------------------------------- explore styles
// More looks to browse in Explore (not offered in onboarding).
AESTHETICS.push(
  { id: "y2k", name: "Y2K", hidden: true, words: ["y2k", "glossy"], cover: "/p/fri-lights.jpg", look: { filter: "saturate(1.45) contrast(1.15) brightness(1.06) hue-rotate(8deg)", overlay: "linear-gradient(160deg, rgba(120,170,255,.28), rgba(255,120,220,.22))", blend: "soft-light", grain: 0.06, vignette: 0.3 } },
  { id: "coastal", name: "Coastal", hidden: true, words: ["airy", "coastal"], cover: "/p/wk-coast.jpg", look: { filter: "brightness(1.12) saturate(.9) contrast(.92) hue-rotate(-4deg)", overlay: "linear-gradient(180deg, rgba(170,215,255,.3), rgba(255,250,240,.12))", blend: "soft-light", grain: 0.02, vignette: 0 } },
  { id: "noir", name: "Noir", hidden: true, words: ["noir", "black & white"], cover: "/p/sat-walk.jpg", look: { filter: "grayscale(1) contrast(1.35) brightness(.95)", grain: 0.14, vignette: 0.55 } },
  { id: "polaroid", name: "Polaroid", hidden: true, words: ["instant", "faded"], cover: "/p/sat-friends.jpg", look: { filter: "sepia(.25) saturate(.8) contrast(.85) brightness(1.1)", overlay: "linear-gradient(180deg, rgba(255,240,200,.3), rgba(120,200,190,.18))", blend: "soft-light", grain: 0.12, vignette: 0.25 } },
);

/**
 * Explore styles: everything people can choose from, in one browsable list.
 * kind "trend" opens the trend in the chat, "template" opens the template,
 * "style" makes a post in that look from your best photos.
 */
export type ExploreItem = {
  id: string;
  name: string;
  kind: "trend" | "template" | "style";
  ref: string; // trend id, template id or aesthetic id
  cover: string; // photo id (camera roll, profile or example)
  aesthetic: string;
  format: Format;
  badge?: string;
};

export const EXPLORE_FILTERS = ["For you", "Trending", "Aesthetics", "Templates", "Reels"] as const;

export const EXPLORE: ExploreItem[] = [
  { id: "x-younger-me", name: "Me & me, 10 years ago", kind: "trend", ref: "younger-me", cover: "duo", aesthetic: "golden-hour", format: "reel", badge: "+71%" },
  { id: "x-hairstyles", name: "5 hairstyles on me", kind: "trend", ref: "hairstyles", cover: "ex-redhead", aesthetic: "soft-glam", format: "carousel", badge: "+58%" },
  { id: "x-film-flash", name: "Film flash", kind: "trend", ref: "film-flash", cover: "fri-red", aesthetic: "film-flash", format: "carousel", badge: "+44%" },
  { id: "x-dark-academia", name: "Dark academia", kind: "trend", ref: "dark-academia", cover: "wk-white", aesthetic: "dark-academia", format: "carousel", badge: "+34%" },
  { id: "x-main-character", name: "Main character", kind: "trend", ref: "main-character", cover: "sat-walk", aesthetic: "golden-hour", format: "story", badge: "+22%" },
  { id: "x-photo-dump", name: "Photo dump", kind: "template", ref: "photo-dump", cover: "sat-laugh", aesthetic: "90s", format: "carousel" },
  { id: "x-grwm", name: "Get ready with me", kind: "template", ref: "grwm", cover: "wk-pink", aesthetic: "soft-glam", format: "reel" },
  { id: "x-outfits", name: "5 outfits on me", kind: "template", ref: "five-outfits", cover: "sat-denim", aesthetic: "old-money", format: "carousel" },
  { id: "x-day", name: "Day in my life", kind: "template", ref: "day-in-my-life", cover: "wk-coffee", aesthetic: "clean-girl", format: "story" },
  { id: "x-golden", name: "Golden hour carousel", kind: "template", ref: "golden-carousel", cover: "sat-sunset", aesthetic: "golden-hour", format: "carousel" },
  { id: "x-old-money", name: "Old money", kind: "style", ref: "old-money", cover: "sat-terrace", aesthetic: "old-money", format: "carousel" },
  { id: "x-soft-glam", name: "Soft glam", kind: "style", ref: "soft-glam", cover: "fri-lights", aesthetic: "soft-glam", format: "carousel" },
  { id: "x-clean-girl", name: "Clean girl", kind: "style", ref: "clean-girl", cover: "wk-pink", aesthetic: "clean-girl", format: "carousel" },
  { id: "x-y2k", name: "Y2K", kind: "style", ref: "y2k", cover: "fri-red", aesthetic: "y2k", format: "reel", badge: "New" },
  { id: "x-coastal", name: "Coastal", kind: "style", ref: "coastal", cover: "wk-coast", aesthetic: "coastal", format: "carousel", badge: "New" },
  { id: "x-noir", name: "Noir", kind: "style", ref: "noir", cover: "sat-street", aesthetic: "noir", format: "carousel" },
  { id: "x-polaroid", name: "Polaroid", kind: "style", ref: "polaroid", cover: "sat-friends", aesthetic: "polaroid", format: "carousel" },
  { id: "x-90s", name: "90s", kind: "style", ref: "90s", cover: "sat-tram", aesthetic: "90s", format: "carousel" },
  { id: "x-streetwear", name: "Streetwear", kind: "style", ref: "streetwear", cover: "fri-bar", aesthetic: "streetwear", format: "reel" },
  { id: "x-minimal", name: "Minimal", kind: "style", ref: "minimal", cover: "wk-bowl", aesthetic: "minimal", format: "carousel" },
];

/** Items for a filter. "For you" puts the user's aesthetics and trend pick first. */
export function exploreItems(filter: string, mine: { aesthetics: string[]; trendToTry: string | null }): ExploreItem[] {
  if (filter === "Trending") return EXPLORE.filter((x) => x.kind === "trend");
  if (filter === "Aesthetics") return EXPLORE.filter((x) => x.kind === "style");
  if (filter === "Templates") return EXPLORE.filter((x) => x.kind === "template");
  if (filter === "Reels") return EXPLORE.filter((x) => x.format === "reel");
  const score = (x: ExploreItem) => (x.ref === mine.trendToTry ? 3 : 0) + (mine.aesthetics.includes(x.aesthetic) ? 2 : 0) + (x.kind === "trend" ? 1 : 0);
  return [...EXPLORE].sort((a, b) => score(b) - score(a));
}

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
  // bring your own idea
  describePlaceholder: "a moody night-out Reel from Friday",
  greetDescribe: "Describe your vision in a few words, like “a moody night-out Reel from Friday”. I'll pick the photos.",
  quickDescribe: ["A moody night-out Reel from Friday", "Make it like the link", "Use a template"],
  linkApplied: "Got it: same format and look as the link, made with your photos.",
  toTemplates: "Here are templates that fit you. Pick one and I'll do the rest.",
  describeAsk: "Sure. What's the vision? A mood, a place, a format, anything.",
  freePreview: "Free preview of your idea. Make the full post with Pro.",
  greetStyle: "Let's make a {look} post ✨ I picked {n} of your best photos for it. Tap any to swap, or tell me what you want.",
};
