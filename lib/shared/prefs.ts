/** Creator account + preferences shown on the Creator Studio dashboard. */

export const INTERESTS = ["Travel", "City", "Food", "Friends", "Nature", "Nightlife", "Fashion"] as const;
export const VIBES = ["Warm", "Cool", "Film", "Clean", "Bold"] as const;
export const PLATFORMS = ["Instagram", "TikTok"] as const;
export const GOALS = [1, 2, 3, 5] as const;

export type Prefs = {
  handle: string;
  platforms: string[];
  interests: string[];
  vibes: string[];
  weeklyGoal: number; // posts per week
};

export const DEFAULT_PREFS: Prefs = {
  handle: "@your.handle",
  platforms: ["Instagram"],
  interests: ["Travel", "Friends", "City"],
  vibes: ["Warm", "Film"],
  weeklyGoal: 2,
};

/** Hard-coded "best time to post" per platform (a real version would use account insights). */
export function bestTimeToPost(platforms: string[]): string {
  if (platforms.includes("TikTok") && !platforms.includes("Instagram")) return "Tue & Thu, 7–9 pm";
  return "Thu & Sun, 6–8 pm";
}
