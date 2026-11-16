"use client";

import { useEffect, useState } from "react";
import "./proto.css";
import { ProtoProvider, useProto, type Screen } from "./store.tsx";
import { StatusBar } from "./ui.tsx";
import DemoPanel from "./DemoPanel.tsx";
import Chat from "./screens/Chat.tsx";
import Dashboard from "./screens/Dashboard.tsx";
import Draft from "./screens/Draft.tsx";
import Home from "./screens/Home.tsx";
import Lock from "./screens/Lock.tsx";
import Onboarding from "./screens/Onboarding.tsx";
import { DebugMenu, Paywall, ShareSheet } from "./screens/Sheets.tsx";
import Success from "./screens/Success.tsx";
import TrendAlert from "./screens/TrendAlert.tsx";

/** `?screen=lock|home|dashboard|onboarding|alert` opens the demo at a given place. */
function screenFromQuery(): Screen | undefined {
  if (typeof window === "undefined") return undefined;
  const q = new URLSearchParams(window.location.search).get("screen");
  if (q === "lock") return { name: "lock" };
  if (q === "dashboard") return { name: "dashboard" };
  if (q === "onboarding") return { name: "onboarding", step: 0 };
  if (q === "alert") return { name: "trendAlert", id: "film-flash" };
  return undefined;
}

export default function Prototype() {
  const [initial, setInitial] = useState<Screen | undefined | null>(null);
  useEffect(() => setInitial(screenFromQuery()), []);
  if (initial === null) return <div className="proto" />;
  return (
    <ProtoProvider initialScreen={initial}>
      <Shell />
    </ProtoProvider>
  );
}

function Shell() {
  const { screen, dir, depth, sheet, openSheet, closeSheet } = useProto();

  // ` (backtick) or Shift+D opens the demo menu; Esc closes sheets.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.tagName === "INPUT";
      if (!typing && (e.key === "`" || (e.shiftKey && e.key === "D"))) openSheet({ kind: "debug" });
      if (e.key === "Escape") closeSheet();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openSheet, closeSheet]);

  const light = screen.name === "lock";
  const key = `${depth}-${screen.name}-${screen.name === "onboarding" ? screen.step : ""}`;

  return (
    <div className="proto">
      <StatusBar light={light} />
      <div className={`stage ${dir}`} key={key}>
        {screen.name === "lock" && <Lock />}
        {screen.name === "home" && <Home />}
        {screen.name === "onboarding" && <Onboarding step={screen.step} />}
        {screen.name === "dashboard" && <Dashboard highlight={screen.highlight} />}
        {screen.name === "chat" && <Chat entry={screen.entry} />}
        {screen.name === "draft" && <Draft />}
        {screen.name === "success" && <Success />}
        {screen.name === "trendAlert" && <TrendAlert id={screen.id} />}
      </div>
      {sheet?.kind === "paywall" && <Paywall reason={sheet.reason} then={sheet.then} />}
      {sheet?.kind === "share" && <ShareSheet />}
      {sheet?.kind === "debug" && <DebugMenu />}
      <div className="home-indicator" aria-hidden />
      <DemoPanel />
    </div>
  );
}
