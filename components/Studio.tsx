"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { preparePhoto, type PreparedPhoto } from "@/lib/client/images.ts";
import { styleViaApi } from "@/lib/client/styleApi.ts";
import { runStyleSet, type PipelineEvent } from "@/lib/shared/pipeline.ts";
import ProcessingStep from "./ProcessingStep.tsx";
import ResultsStep from "./ResultsStep.tsx";
import TrendStep from "./TrendStep.tsx";
import type { RunStats, Slot, TrendCard } from "./types.ts";
import UploadStep, { MAX_PHOTOS, MIN_PHOTOS } from "./UploadStep.tsx";

type Step = "upload" | "trend" | "processing" | "results";
const STEP_ORDER: Step[] = ["upload", "trend", "processing", "results"];

export default function Studio({ trends }: { trends: TrendCard[] }) {
  const [step, setStep] = useState<Step>("upload");
  const [photos, setPhotos] = useState<PreparedPhoto[]>([]);
  const [preparing, setPreparing] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [trendId, setTrendId] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [stats, setStats] = useState<RunStats | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const warmed = useRef(false);

  const trend = trends.find((t) => t.id === trendId) ?? null;

  // Which backend is active (shown in the header).
  useEffect(() => {
    fetch("/api/warmup")
      .then((r) => r.json())
      .then((j: { provider: string }) => setProvider(j.provider))
      .catch(() => undefined);
  }, []);

  // Pre-warm a GPU container as soon as the user adds photos, so the cold start
  // overlaps with picking photos and a trend instead of with "Make my set".
  const warmup = useCallback(() => {
    if (warmed.current) return;
    warmed.current = true;
    fetch("/api/warmup", { method: "POST" }).catch(() => undefined);
  }, []);

  const addFiles = async (files: File[]) => {
    setUploadError(null);
    warmup();
    const images = files.filter((f) => f.type.startsWith("image/") || /\.(hei[cf]|jpe?g|png)$/i.test(f.name));
    const room = MAX_PHOTOS - photos.length - preparing;
    if (images.length > room) setUploadError(`Max ${MAX_PHOTOS} photos per set, so only the first ${Math.max(0, room)} were added.`);
    const take = images.slice(0, Math.max(0, room));
    if (take.length === 0) return;
    setPreparing((n) => n + take.length);
    // Decode in parallel but keep the user's order: it is the carousel order, and the
    // first photo becomes the style anchor for the set.
    const prepared = await Promise.all(
      take.map((f) =>
        preparePhoto(f).catch(() => {
          setUploadError(`Couldn’t read ${f.name}. Try a JPG or PNG.`);
          return null;
        }),
      ),
    );
    setPhotos((prev) => [...prev, ...prepared.filter((p): p is PreparedPhoto => p !== null)].slice(0, MAX_PHOTOS));
    setPreparing((n) => n - take.length);
  };

  const removePhoto = (id: string) =>
    setPhotos((prev) => {
      const p = prev.find((x) => x.id === id);
      if (p) URL.revokeObjectURL(p.url);
      return prev.filter((x) => x.id !== id);
    });

  const run = async () => {
    if (!trend) return;
    setSlots(photos.map((photo) => ({ photo, status: "queued" })));
    setStats(null);
    setRunError(null);
    setStep("processing");

    const patch = (index: number, update: Partial<Slot>) =>
      setSlots((prev) => prev.map((s, i) => (i === index ? { ...s, ...update } : s)));

    // Same seed for every photo of the set.
    const seed = Math.floor(Math.random() * 2 ** 31);
    let final: Extract<PipelineEvent<Blob>, { type: "done" }> | null = null;
    const durations: number[] = [];
    let lastError: string | null = null;
    try {
      await runStyleSet<Blob, Blob>({
        photos: photos.map((p) => p.blob),
        style: styleViaApi(trend.id, seed),
        concurrency: 3,
        retry: { retries: 3, baseDelayMs: 2000 },
        emit: (e) => {
          if (e.type === "photo") {
            if (e.status === "processing") patch(e.index, { status: "processing", role: e.role });
            else if (e.status === "retrying") patch(e.index, { status: "retrying" });
            else if (e.status === "error") {
              lastError = e.error;
              patch(e.index, { status: "error", error: e.error });
            } else if (e.status === "done") {
              durations.push(e.ms);
              patch(e.index, {
                status: "done",
                styledBlob: e.output,
                styledUrl: URL.createObjectURL(e.output),
                ms: e.ms,
                attempts: e.attempts,
                role: e.role,
              });
            }
          } else if (e.type === "done") {
            final = e;
          }
        },
      });
    } catch (e) {
      lastError = (e as Error).message;
    }

    const f = final as Extract<PipelineEvent<Blob>, { type: "done" }> | null;
    if (f && f.ok > 0) {
      setStats({
        provider: provider ?? "unknown",
        totalMs: f.totalMs,
        ok: f.ok,
        failed: f.failed,
        avgMs: durations.reduce((a, b) => a + b, 0) / Math.max(1, durations.length),
      });
      setStep("results");
    } else {
      setRunError(`None of the photos could be styled.${lastError ? ` ${lastError}` : ""}`);
    }
  };

  const restart = () => {
    slots.forEach((s) => s.styledUrl && URL.revokeObjectURL(s.styledUrl));
    photos.forEach((p) => URL.revokeObjectURL(p.url));
    setPhotos([]);
    setSlots([]);
    setTrendId(null);
    setStats(null);
    setRunError(null);
    setStep("upload");
  };

  const stepIdx = STEP_ORDER.indexOf(step);

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">Creator Studio</div>
        {provider === "demo" && (
          <span className="mode demo" title="No AI backend configured: a local colour grade stands in for the model">
            Demo mode
          </span>
        )}
        {provider === "modal" && <span className="mode">AI · Modal</span>}
      </header>
      <div className="steps" aria-hidden>
        {STEP_ORDER.map((s, i) => (
          <span key={s} className={i <= stepIdx ? "on" : ""} />
        ))}
      </div>

      {step === "upload" && <UploadStep photos={photos} preparing={preparing} error={uploadError} onAdd={addFiles} onRemove={removePhoto} />}
      {step === "trend" && <TrendStep trends={trends} selected={trendId} onSelect={setTrendId} count={photos.length} />}
      {step === "processing" && (
        <>
          <ProcessingStep slots={slots} trendName={trend?.name ?? ""} provider={provider ?? ""} />
          {runError && (
            <>
              <div className="error">{runError}</div>
              <button className="pill ghost block" onClick={() => setStep("trend")}>
                Back to trends
              </button>
            </>
          )}
        </>
      )}
      {step === "results" && trend && <ResultsStep slots={slots} trendId={trend.id} trendName={trend.name} stats={stats} onRestart={restart} />}

      {step === "upload" && (
        <div className="cta-bar">
          <div className="inner">
            <button className="pill" disabled={photos.length < MIN_PHOTOS || preparing > 0} onClick={() => setStep("trend")}>
              {photos.length < MIN_PHOTOS ? `Add at least ${MIN_PHOTOS} photos` : "Continue"}
            </button>
          </div>
        </div>
      )}
      {step === "trend" && (
        <div className="cta-bar">
          <div className="inner">
            <button className="pill ghost" onClick={() => setStep("upload")}>
              Back
            </button>
            <button className="pill" disabled={!trend} onClick={run}>
              Make my set
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
