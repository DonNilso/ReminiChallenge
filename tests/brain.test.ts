import { test } from "node:test";
import assert from "node:assert/strict";
import { parse, swapPhoto, describe, photosFor, type Spec } from "../proto/brain.ts";

const base: Spec = { aesthetic: "film-flash", format: "carousel", photos: ["sat-sunset", "sat-tram", "sat-coffee", "sat-laugh", "sat-terrace", "sat-friends"], warmth: 0, mood: 0, bright: 0 };

test("'make it moody, 6 photos' changes the draft but is not a go", () => {
  const r = parse("make it moody, 4 photos", base);
  assert.equal(r.generate, false);
  assert.equal(r.spec.mood, 1);
  assert.equal(r.spec.photos.length, 4);
  assert.deepEqual(r.changes, ["moodier", "4 photos"]);
});

test("go phrases generate", () => {
  for (const t of ["Looks good, make it ✨", "make it", "yes", "Make it ✨", "let's go"]) assert.equal(parse(t, base).generate, true, t);
});

test("format, look and tone changes", () => {
  const r = parse("turn it into a reel, warmer, in old money", base);
  assert.equal(r.spec.format, "reel");
  assert.equal(r.spec.aesthetic, "old-money");
  assert.equal(r.spec.warmth, 1);
  assert.equal(parse("golden hour please", base).spec.warmth, 0); // look name is not a warmth request
  assert.equal(parse("golden hour please", base).spec.aesthetic, "golden-hour");
});

test("swap the second photo keeps the count and the day", () => {
  const r = parse("swap the 2nd photo", base);
  assert.equal(r.spec.photos.length, 6);
  assert.notEqual(r.spec.photos[1], base.photos[1]);
  assert.equal(r.spec.photos[0], base.photos[0]);
  assert.ok(r.spec.photos[1].startsWith("sat-"));
  assert.deepEqual(swapPhoto(["a"], 5), ["a"]);
});

test("topics pick photos; numbers in words work; shorter trims", () => {
  assert.ok(parse("night out with friends", { ...base, photos: [] }).spec.photos.every((p) => p.startsWith("fri-")));
  assert.equal(parse("only three photos", base).spec.photos.length, 3);
  assert.equal(parse("shorter", base).spec.photos.length, 4);
  assert.equal(photosFor("food").length > 2, true);
});

test("unknown text is not understood; describe joins changes", () => {
  assert.equal(parse("hmm what do you think about the weather", base).understood, false);
  assert.match(describe(["warmer", "4 photos"]), /warmer and 4 photos\./);
});
