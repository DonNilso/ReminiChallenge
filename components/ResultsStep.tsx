"use client";

import { useEffect, useRef, useState } from "react";
import { toInstagramPortrait, type FitMode } from "@/lib/client/images.ts";
import { IconShare } from "./host/icons.tsx";
import { downloadBlob, buildZip } from "@/lib/client/zip.ts";
import { makeSlideshow, type VideoResult } from "@/lib/client/video.ts";
import type { RunStats, Slot } from "./types.ts";

type Props = {
  slots: Slot[];
  trendId: string;
  trendName: string;
  stats: RunStats | null;
  onRestart: () => void;
  /** Runs the action now, or after the (mock) paywall when the user has no trial yet. */
  gate?: (action: () => void) => void;
};

export default function ResultsStep({ slots, trendId, trendName, stats, onRestart, gate = (a) => a() }: Props) {
  const done = slots.filter((s) => s.status === "done" && s.styledBlob);
  const failed = slots.filter((s) => s.status === "error");
  const [showBefore, setShowBefore] = useState<Set<string>>(new Set());
  const [fit, setFit] = useState<FitMode>("crop");
  const [active, setActive] = useState(0);
  const [zipping, setZipping] = useState(false);
  const [video, setVideo] = useState<(VideoResult & { url: string }) | null>(null);
  const [videoProgress, setVideoProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const carousel = useRef<HTMLDivElement>(null);
  const [igFiles, setIgFiles] = useState<File[] | null>(null);

  // Pre-render the 1080x1350 versions so "Share" can open the share sheet immediately
  // (browsers only allow navigator.share() directly inside the tap).
  const doneKey = done.map((s) => s.photo.id).join(",");
  useEffect(() => {
    let cancelled = false;
    setIgFiles(null);
    Promise.all(
      done.map(async (s, i) => new File([await toInstagramPortrait(s.styledBlob!, fit)], `${trendId}-${String(i + 1).padStart(2, "0")}.jpg`, { type: "image/jpeg" })),
    )
      .then((files) => !cancelled && setIgFiles(files))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneKey, fit, trendId]);
  const canShare = typeof navigator !== "undefined" && !!igFiles && !!navigator.canShare?.({ files: igFiles });

  const onShare = () => {
    if (!igFiles) return;
    navigator.share({ files: igFiles, title: `My ${trendName} set` }).catch((e: Error) => {
      if (e.name !== "AbortError") setError(`Couldn’t open the share sheet: ${e.message}`);
    });
  };

  useEffect(() => () => {
    if (video) URL.revokeObjectURL(video.url);
  }, [video]);

  const toggle = (id: string) =>
    setShowBefore((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const onZip = async () => {
    setZipping(true);
    setError(null);
    try {
      const zip = await buildZip(
        done.map((s) => s.styledBlob!),
        trendId,
        fit,
        video ? { blob: video.blob, ext: video.ext } : undefined,
      );
      downloadBlob(zip, `creator-studio-${trendId}.zip`);
    } catch (e) {
      setError(`Couldn’t build the ZIP: ${(e as Error).message}`);
    } finally {
      setZipping(false);
    }
  };

  const onVideo = async () => {
    setError(null);
    setVideoProgress(0);
    try {
      const res = await makeSlideshow(done.map((s) => s.styledBlob!), setVideoProgress);
      setVideo({ ...res, url: URL.createObjectURL(res.blob) });
    } catch (e) {
      setError(`Couldn’t make the video: ${(e as Error).message}`);
    } finally {
      setVideoProgress(null);
    }
  };

  return (
    <section>
      <h1>Your {trendName} set</h1>
      <p className="sub">Tap a photo to compare before and after.</p>

      {failed.length > 0 && (
        <div className="error">
          {failed.length} photo{failed.length > 1 ? "s" : ""} couldn’t be styled and {failed.length > 1 ? "were" : "was"} left out.
          {failed[0].error ? ` (${failed[0].error})` : ""}
        </div>
      )}

      <div className="grid two" data-testid="results-grid">
        {done.map((s, i) => {
          const before = showBefore.has(s.photo.id);
          return (
            <div
              key={s.photo.id}
              className="tile toggle"
              role="button"
              tabIndex={0}
              aria-pressed={before}
              aria-label={`Photo ${i + 1}, showing ${before ? "before" : "after"}`}
              onClick={() => toggle(s.photo.id)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggle(s.photo.id)}
            >
              <div className="stack">
                <img src={s.styledUrl} alt="" style={{ opacity: before ? 0 : 1 }} />
                <img src={s.photo.url} alt="" style={{ opacity: before ? 1 : 0 }} />
              </div>
              <span className={`tag label${before ? "" : " after"}`}>{before ? "Before" : "After"}</span>
            </div>
          );
        })}
      </div>

      {stats && (
        <div className="stats">
          <div className="card">
            <div className="v">{(stats.totalMs / 1000).toFixed(1)}s</div>
            <div className="k">Total</div>
          </div>
          <div className="card">
            <div className="v">{(stats.avgMs / 1000).toFixed(1)}s</div>
            <div className="k">Per photo</div>
          </div>
          <div className="card">
            <div className="v">{stats.provider === "demo" ? "Demo" : "AI"}</div>
            <div className="k">{stats.provider === "demo" ? "No GPU" : "Qwen Edit"}</div>
          </div>
        </div>
      )}

      <div className="row-between">
        <div className="section-title">Carousel preview</div>
        <div className="seg" role="group" aria-label="Instagram fit">
          <button className={fit === "crop" ? "on" : ""} onClick={() => setFit("crop")}>
            Fill 4:5
          </button>
          <button className={fit === "pad" ? "on" : ""} onClick={() => setFit("pad")}>
            Fit 4:5
          </button>
        </div>
      </div>
      <div
        className="carousel"
        ref={carousel}
        data-testid="carousel"
        onScroll={(e) => {
          const el = e.currentTarget;
          setActive(Math.round(el.scrollLeft / el.clientWidth));
        }}
      >
        {done.map((s) => (
          <div key={s.photo.id} className={`slide${fit === "pad" ? " pad" : ""}`}>
            {fit === "pad" && <img className="bg" src={s.styledUrl} alt="" />}
            <img className={fit === "pad" ? "fg" : ""} src={s.styledUrl} alt="" />
          </div>
        ))}
      </div>
      <div className="dots">
        {done.map((s, i) => (
          <i key={s.photo.id} className={i === active ? "on" : ""} />
        ))}
      </div>

      <div className="section-title">Export</div>
      {error && <div className="error">{error}</div>}
      <div className="actions">
        {canShare && (
          <button className="pill block" onClick={() => gate(onShare)} data-testid="share">
            <IconShare size={18} /> Share to Instagram
          </button>
        )}
        <button className={`pill block${canShare ? " ghost" : ""}`} onClick={() => gate(onZip)} disabled={zipping || done.length === 0} data-testid="download-zip">
          {zipping ? "Packing…" : `Download ZIP (${done.length} photos${video ? " + video" : ""})`}
        </button>
        <p className="note" style={{ margin: 0 }}>
          Full-size styled photos plus Instagram portrait versions at 1080×1350 ({fit === "crop" ? "filled and centre-cropped" : "fitted with blurred bars"}).
        </p>
        {!video && (
          <button className="pill ghost block" onClick={onVideo} disabled={videoProgress !== null || done.length === 0} data-testid="make-video">
            {videoProgress !== null ? `Rendering video… ${Math.round(videoProgress * 100)}%` : "Make 15s slideshow video"}
          </button>
        )}
      </div>

      {video && (
        <>
          <video className="preview" src={video.url} controls autoPlay muted loop playsInline data-testid="video" />
          <div className="actions">
            <button className="pill ghost block" onClick={() => gate(() => downloadBlob(video.blob, `creator-studio-${trendId}.${video.ext}`))}>
              Download video (.{video.ext})
            </button>
            <p className="note" style={{ margin: 0 }}>No music on purpose: add a trending sound when you post in Instagram or TikTok.</p>
          </div>
        </>
      )}

      <button className="link" onClick={onRestart}>
        Start a new set
      </button>
    </section>
  );
}
