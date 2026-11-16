"use client";

import { HOME, NOTIFICATIONS } from "../data.ts";
import { useProto } from "../store.tsx";
import { IconSparkle } from "../ui.tsx";

/** iPhone-style lock screen with the two Creator Studio notifications. */
export default function Lock() {
  const { reset, set } = useProto();
  const openReady = () => {
    set({ onboarded: true }); // notifications only exist for users who set up Creator Studio
    reset([{ name: "home" }, { name: "dashboard", highlight: NOTIFICATIONS.ready.suggestion }]);
  };
  const openTrend = () => {
    set({ onboarded: true });
    reset({ name: "trendAlert", id: NOTIFICATIONS.trend.trend });
  };
  return (
    <div className="scr lock" style={{ backgroundImage: `url(${HOME.lockWallpaper})` }} data-testid="lock">
      <div className="lock-shade" />
      <div className="lock-date">Monday 17 November</div>
      <div className="lock-time">9:41</div>
      <div className="lock-notes">
        <button className="note-card" onClick={openReady} data-testid="notif-ready">
          <span className="note-ic">
            <IconSparkle size={18} />
          </span>
          <span className="note-body">
            <span className="note-head">
              <b>Remini</b>
              <small>now</small>
            </span>
            <b className="note-title">{NOTIFICATIONS.ready.title}</b>
            <span>{NOTIFICATIONS.ready.body}</span>
          </span>
          <img className="note-thumb" src="/p/sat-sunset.jpg" alt="" />
        </button>
        <button className="note-card" onClick={openTrend} data-testid="notif-trend">
          <span className="note-ic">
            <IconSparkle size={18} />
          </span>
          <span className="note-body">
            <span className="note-head">
              <b>Remini</b>
              <small>12m ago</small>
            </span>
            <b className="note-title">{NOTIFICATIONS.trend.title}</b>
            <span>{NOTIFICATIONS.trend.body}</span>
          </span>
          <img className="note-thumb" src="/p/fri-red.jpg" alt="" />
        </button>
      </div>
      <button className="lock-open" onClick={() => reset({ name: "home" })}>
        Swipe up to open
      </button>
    </div>
  );
}
