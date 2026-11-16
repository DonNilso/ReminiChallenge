"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { deletePost, getPost, type SavedPost } from "@/lib/client/postsStore.ts";
import { IconBack } from "./host/icons.tsx";
import ResultsStep from "./ResultsStep.tsx";
import { timeAgo } from "./StudioHome.tsx";
import type { Slot } from "./types.ts";
import { usePaywall } from "./usePaywall.tsx";

/** A finished post reopened from "Your posts": compare, preview, re-share, re-export, delete. */
export default function PostDetail({ id }: { id: string }) {
  const router = useRouter();
  const [post, setPost] = useState<SavedPost | null | undefined>(undefined);
  const [slots, setSlots] = useState<Slot[]>([]);
  const paywall = usePaywall(slots);

  useEffect(() => {
    const urls: string[] = [];
    getPost(id).then((p) => {
      setPost(p);
      if (!p) return;
      setSlots(
        p.items.map((it, i) => {
          const url = URL.createObjectURL(it.original);
          const styledUrl = URL.createObjectURL(it.styled);
          urls.push(url, styledUrl);
          return {
            photo: { id: `${p.id}-${i}`, name: `photo-${i + 1}.jpg`, blob: it.original, url, width: 0, height: 0 },
            status: "done",
            styledBlob: it.styled,
            styledUrl,
          };
        }),
      );
    });
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [id]);

  const remove = async () => {
    if (!confirm("Delete this post from this device?")) return;
    await deletePost(id);
    router.push("/studio");
  };

  return (
    <main className="shell">
      <header className="topbar">
        <div className="left">
          <Link href="/studio" className="back" aria-label="Back to Creator Studio">
            <IconBack />
          </Link>
          <div className="brand">Creator Studio</div>
        </div>
      </header>

      {post === undefined && <p className="note">Loading…</p>}
      {post === null && (
        <div className="card empty">
          <div style={{ fontWeight: 600 }}>This post isn’t on this device</div>
          <p className="note">Posts are saved in this browser only, so they don’t follow you to other devices.</p>
          <Link href="/studio" className="pill small">
            Back to Creator Studio
          </Link>
        </div>
      )}
      {post && slots.length > 0 && (
        <>
          <div className="chip">Made {timeAgo(post.createdAt)}</div>
          <ResultsStep
            slots={slots}
            trendId={post.trendId}
            trendName={post.trendName}
            stats={null}
            onRestart={() => router.push("/studio/new?from=post_detail")}
            gate={paywall.gate}
          />
          <button className="link danger" onClick={remove} data-testid="delete-post">
            Delete post
          </button>
        </>
      )}
      {paywall.node}
    </main>
  );
}
