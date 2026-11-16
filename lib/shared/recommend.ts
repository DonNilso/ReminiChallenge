import type { Prefs } from "./prefs.ts";

type RankableTrend = {
  id: string;
  status: "rising" | "steady";
  meta: { growth: number; interests: string[]; vibes: string[]; months: number[]; platforms: string[] };
};

export type Proposal<T> = { trend: T; score: number; reasons: string[] };

/**
 * Rank trends for a creator: content match (interests) weighs most, then look match
 * (vibes), then momentum (rising, weekly growth) and season. Returns the reasons so
 * the UI can say why a trend is proposed.
 */
export function proposeTrends<T extends RankableTrend>(trends: T[], prefs: Prefs, month = new Date().getMonth() + 1): Proposal<T>[] {
  return trends
    .map((trend) => {
      const m = trend.meta;
      const interests = m.interests.filter((i) => prefs.interests.includes(i));
      const vibes = m.vibes.filter((v) => prefs.vibes.includes(v));
      const inSeason = m.months.includes(month);
      const outOfSeason = m.months.length > 0 && !inSeason;
      const onPlatform = m.platforms.some((p) => prefs.platforms.includes(p));
      let score = interests.length * 3 + vibes.length * 2 + (trend.status === "rising" ? 2 : 0) + Math.min(m.growth, 50) / 10;
      if (inSeason) score += 2;
      if (outOfSeason) score -= 4;
      if (!onPlatform) score -= 1;

      const reasons: string[] = [];
      if (interests.length) reasons.push(`Matches ${interests.slice(0, 2).join(" & ")}`);
      if (vibes.length) reasons.push(`${vibes[0]} look you like`);
      if (m.growth >= 20) reasons.push(`+${m.growth}% this week`);
      if (inSeason) reasons.push("In season");
      return { trend, score: Math.round(score * 10) / 10, reasons };
    })
    .sort((a, b) => b.score - a.score);
}

/** Posts made in the last 7 days. */
export function postsThisWeek(createdAts: number[], now = Date.now()): number {
  return createdAts.filter((t) => now - t < 7 * 24 * 3600 * 1000).length;
}
