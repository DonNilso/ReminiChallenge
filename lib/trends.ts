import data from "../data/trends.json" with { type: "json" };

export type DemoGrade = {
  brightness: number;
  saturation: number;
  hue: number;
  tint: [number, number, number];
  tintAmount: number;
  contrast: number;
  lift: number;
  grain: number;
  vignette: number;
};

/**
 * Trend signals. Trend detection is out of scope for the prototype, so these are
 * hard-coded, illustrative numbers in the shape a trend service would return.
 */
export type TrendMeta = {
  hashtag: string;
  posts: string; // e.g. "4.1M"
  growth: number; // % change in posts this week
  platforms: string[];
  interests: string[]; // content it suits, matched against the user's interests
  vibes: string[]; // matched against the user's preferred vibes
  months: number[]; // 1-12 when it is in season; empty = all year
  bestFor: string;
};

export type Trend = {
  id: string;
  name: string;
  description: string;
  status: "rising" | "steady";
  swatch: string[];
  meta: TrendMeta;
  stylePrompt: string;
  demo: DemoGrade;
};

/** What the browser gets: everything except the style prompt and demo grade. */
export type PublicTrend = Omit<Trend, "stylePrompt" | "demo">;

export function publicTrends(): PublicTrend[] {
  return TRENDS.map(({ id, name, description, status, swatch, meta }) => ({ id, name, description, status, swatch, meta }));
}

export const TRENDS = data.trends as unknown as Trend[];

export function getTrend(id: string): Trend | undefined {
  return TRENDS.find((t) => t.id === id);
}
