"use client";

import { useRef, useState } from "react";
import type { PreparedPhoto } from "@/lib/client/images.ts";

export const MIN_PHOTOS = 3;
export const MAX_PHOTOS = 10;

type Props = {
  photos: PreparedPhoto[];
  preparing: number;
  error: string | null;
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
};

export default function UploadStep({ photos, preparing, error, onAdd, onRemove }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const full = photos.length + preparing >= MAX_PHOTOS;

  return (
    <section>
      <h1>Your weekend, one look.</h1>
      <p className="sub">Add 3–10 real photos from the same trip. We keep the people and the moment exactly as they were, and give the whole post one on-trend look.</p>

      {!full && (
        <div
          className={`drop${over ? " over" : ""}`}
          role="button"
          tabIndex={0}
          onClick={() => input.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            onAdd(Array.from(e.dataTransfer.files));
          }}
        >
          <div className="plus">+</div>
          <div style={{ fontWeight: 600 }}>Add photos</div>
          <div className="hint">JPG, PNG or HEIC · up to {MAX_PHOTOS}</div>
          <input
            ref={input}
            data-testid="file-input"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/heic,image/heif,.heic,.heif"
            hidden
            onChange={(e) => {
              onAdd(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
        </div>
      )}

      {error && <div className="error">{error}</div>}

      {(photos.length > 0 || preparing > 0) && (
        <>
          <div className="grid">
            {photos.map((p, i) => (
              <div className="tile" key={p.id}>
                <img src={p.url} alt={p.name} />
                {i === 0 && <span className="tag label">Sets the look</span>}
                <button className="x" aria-label={`Remove ${p.name}`} onClick={() => onRemove(p.id)}>
                  ×
                </button>
              </div>
            ))}
            {Array.from({ length: preparing }, (_, i) => (
              <div className="tile" key={`prep-${i}`}>
                <div className="overlay">
                  <div className="spinner" />
                </div>
              </div>
            ))}
          </div>
          <div className="count">
            {photos.length} of {MAX_PHOTOS} photos
            {photos.length < MIN_PHOTOS && ` · add ${MIN_PHOTOS - photos.length} more`}
          </div>
        </>
      )}
    </section>
  );
}
