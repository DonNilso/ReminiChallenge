import { test } from "node:test";
import assert from "node:assert/strict";
import { proposeTrends, postsThisWeek } from "../lib/shared/recommend.ts";
import { DEFAULT_PREFS, bestTimeToPost, type Prefs } from "../lib/shared/prefs.ts";
import { publicTrends } from "../lib/trends.ts";

const trends = publicTrends();
const prefs = (p: Partial<Prefs>): Prefs => ({ ...DEFAULT_PREFS, ...p });
const ids = (list: { trend: { id: string } }[]) => list.map((x) => x.trend.id);

test("public trends never expose the style prompt", () => {
  for (const t of trends) assert.equal((t as Record<string, unknown>).stylePrompt, undefined);
});

test("nightlife + bold creators get the flash look first", () => {
  const r = proposeTrends(trends, prefs({ interests: ["Nightlife", "Friends"], vibes: ["Bold"] }), 11);
  assert.equal(r[0].trend.id, "y2k-flash");
  assert.ok(r[0].reasons.some((x) => x.startsWith("Matches")));
});

test("season matters: golden hour ranks higher in July than in November", () => {
  const p = prefs({ interests: ["Travel", "Nature"], vibes: ["Warm"] });
  const july = ids(proposeTrends(trends, p, 7)).indexOf("golden-hour");
  const nov = ids(proposeTrends(trends, p, 11)).indexOf("golden-hour");
  assert.ok(july < nov, `july ${july}, nov ${nov}`);
  assert.ok(proposeTrends(trends, p, 11).find((x) => x.trend.id === "cozy-autumn")!.reasons.includes("In season"));
});

test("clean/cool food creators get minimal looks, not party flash", () => {
  const r = ids(proposeTrends(trends, prefs({ interests: ["Food"], vibes: ["Clean", "Cool"] }), 3));
  assert.ok(r.indexOf("clean-minimal") < r.indexOf("y2k-flash"));
  assert.ok(r.slice(0, 3).includes("clean-minimal"));
});

test("ranking is stable and returns every trend once", () => {
  const r = proposeTrends(trends, DEFAULT_PREFS, 11);
  assert.equal(r.length, trends.length);
  assert.equal(new Set(ids(r)).size, trends.length);
  for (let i = 1; i < r.length; i++) assert.ok(r[i - 1].score >= r[i].score);
});

test("posts this week and best time", () => {
  const now = Date.parse("2026-11-16T12:00:00Z");
  const day = 86400_000;
  assert.equal(postsThisWeek([now - day, now - 3 * day, now - 8 * day], now), 2);
  assert.match(bestTimeToPost(["Instagram"]), /pm/);
});
