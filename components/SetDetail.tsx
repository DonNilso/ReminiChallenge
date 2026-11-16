"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { deleteSet, getSet, type SavedSet } from "@/lib/client/setsStore.ts";
import { IconBack } from "./host/icons.tsx";
import ResultsStep from "./ResultsStep.tsx";
import { timeAgo } from "./StudioHome.tsx";
import type { Slot } from "./types.ts";
import { usePaywall } from "./usePaywall.tsx";

/** A finished set reopened from "Your sets": compare, preview, re-share, re-export, delete. */
export default function SetDetail({ id }: { id: string }) {
  const router = useRouter();
  const [set, setSet] = useState<SavedSet | null | undefined>(undefined);
  const [slots, setSlots] = useState<Slot[]>([]);
  const paywall = usePaywall(slots);

  useEffect(() => {
    let urls: string[] = [];
    getSet(id).then((s) => {
      setSet(s);
      if (!s) return;
      const built: Slot[] = s.items.map((it, i) => {
        const url = URL.createObjectURL(it.original);
        const styledUrl = URL.createObjectURL(it.styled);
        urls.push(url, styledUrl);
        return {
          photo: { id: `${s.id}-${i}`, name: `photo-${i + 1}.jpg`, blob: it.original, url, width: 0, height: 0 },
          status: "done",
          styledBlob: it.styled,
          styledUrl,
        };
      });
      setSlots(built);
    });
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [id]);

  const remove = async () => {
    if (!confirm("Delete this set from this device?")) return;
    await deleteSet(id);
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

      {set === undefined && <p className="note">Loading…</p>}
      {set === null && (
        <div className="card empty">
          <div style={{ fontWeight: 600 }}>This set isn’t on this device</div>
          <p className="note">Sets are saved in this browser only, so they don’t follow you to other devices.</p>
          <Link href="/studio" className="pill small">
            Back to Creator Studio
          </Link>
        </div>
      )}
      {set && slots.length > 0 && (
        <>
          <div className="chip">Made {timeAgo(set.createdAt)}</div>
          <ResultsStep
            slots={slots}
            trendId={set.trendId}
            trendName={set.trendName}
            stats={null}
            onRestart={() => router.push("/studio/new?from=set_detail")}
            gate={paywall.gate}
          />
          <button className="link danger" onClick={remove} data-testid="delete-set">
            Delete set
          </button>
        </>
      )}
      {paywall.node}
    </main>
  );
}
