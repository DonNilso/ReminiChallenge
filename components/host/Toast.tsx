"use client";

import { useCallback, useRef, useState } from "react";

/** Tiny toast for "this part of the host app is only a mock". */
export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = useCallback((m: string) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2200);
  }, []);
  const node = msg ? (
    <div className="toast" role="status">
      {msg}
    </div>
  ) : null;
  return { show, node };
}

export const MOCK_MSG = "Mock screen: only Creator Studio works in this prototype";
