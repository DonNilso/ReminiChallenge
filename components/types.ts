import type { PreparedPhoto } from "@/lib/client/images.ts";

export type TrendCard = { id: string; name: string; description: string; status: "rising" | "steady"; swatch: string[] };

export type SlotStatus = "queued" | "processing" | "retrying" | "done" | "error";

export type Slot = {
  photo: PreparedPhoto;
  status: SlotStatus;
  styledBlob?: Blob;
  styledUrl?: string;
  error?: string;
  ms?: number;
  attempts?: number;
  role?: "anchor" | "matched";
};

export type RunStats = { provider: string; totalMs: number; ok: number; failed: number; avgMs: number };
