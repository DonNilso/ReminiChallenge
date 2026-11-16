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

export type Trend = {
  id: string;
  name: string;
  description: string;
  status: "rising" | "steady";
  swatch: string[];
  stylePrompt: string;
  demo: DemoGrade;
};

export const TRENDS = data.trends as Trend[];

export function getTrend(id: string): Trend | undefined {
  return TRENDS.find((t) => t.id === id);
}
