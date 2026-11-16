"use client";

import { useCallback, useEffect, useState } from "react";
import Paywall from "./Paywall.tsx";
import type { Slot } from "./types.ts";

const TRIAL_KEY = "cs-mock-trial";

/** Mock monetisation: previews are free, exporting/sharing needs a (mock) PRO trial. */
export function usePaywall(slots: Slot[]) {
  const [trial, setTrial] = useState(false);
  const [pending, setPending] = useState<(() => void) | null>(null);

  useEffect(() => {
    try {
      setTrial(localStorage.getItem(TRIAL_KEY) === "1");
    } catch {}
  }, []);

  const gate = useCallback(
    (action: () => void) => {
      if (trial) action();
      else setPending(() => action);
    },
    [trial],
  );

  const start = () => {
    try {
      localStorage.setItem(TRIAL_KEY, "1");
    } catch {}
    setTrial(true);
    const action = pending;
    setPending(null);
    action?.(); // still inside the tap, so navigator.share() is allowed
  };

  const node = pending ? <Paywall slots={slots} onStart={start} onClose={() => setPending(null)} /> : null;
  return { gate, node };
}
