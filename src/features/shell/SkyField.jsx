import React, { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

/** The artwork is a complete fallback for limited motion, data or playback. */
export default function SkyField({ depth = 1, film = false, className = "", children }) {
  const [reduced, setReduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const surfaceRef = useRef(null);
  const videoRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);
  const [saveData, setSaveData] = useState(() => Boolean(navigator.connection?.saveData));
  const [paused, setPaused] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [blocked, setBlocked] = useState(false);
  // Without a connection the film can't load; the artwork stands in.
  const [online, setOnline] = useState(() => navigator.onLine !== false);
  const permitted = film && !reduced && !saveData && !failed && online;
  const shouldPlay = permitted && visible && pageVisible && !paused && !blocked;

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.05 });
    if (surfaceRef.current) observer.observe(surfaceRef.current);
    const visibility = () => setPageVisible(!document.hidden);
    const onlineChange = () => setOnline(navigator.onLine !== false);
    window.addEventListener("online", onlineChange);
    window.addEventListener("offline", onlineChange);
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motionChange = () => setReduced(motionQuery.matches);
    motionQuery.addEventListener("change", motionChange);
    const connection = navigator.connection;
    const dataChange = () => setSaveData(Boolean(connection?.saveData));
    document.addEventListener("visibilitychange", visibility);
    connection?.addEventListener("change", dataChange);
    return () => {
      observer.disconnect();
      motionQuery.removeEventListener("change", motionChange);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("online", onlineChange);
      window.removeEventListener("offline", onlineChange);
      connection?.removeEventListener("change", dataChange);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    let cancelled = false;
    if (!video) return;
    if (shouldPlay) {
      video.play().catch(() => { if (!cancelled) setBlocked(true); });
    } else {
      video.pause();
    }
    return () => { cancelled = true; video.pause(); };
  }, [shouldPlay]);

  return (
    <div ref={surfaceRef} className={`sky-surface sanctuary-surface relative overflow-hidden ${className}`} data-depth={Math.min(depth, 4)}>
      <img className="sanctuary-image" src="/media/sanctuary.webp" alt="" aria-hidden="true" />
      {permitted && visible && pageVisible && (
        <video ref={videoRef} className={`sanctuary-film ${playing ? "is-playing" : ""}`} muted loop playsInline preload="none"
          poster="/media/sanctuary.webp" src="/media/forest-light.mp4" aria-hidden="true" tabIndex={-1}
          onPlaying={() => setPlaying(true)} onPause={() => setPlaying(false)}
          onError={() => { setFailed(true); setPlaying(false); }} />
      )}
      <div className="sanctuary-shade" aria-hidden="true" />
      <div className="sanctuary-content relative">{children}</div>
      {permitted && (
        <button type="button" className="sanctuary-film-control" aria-label={paused || blocked ? "Play nature film" : "Pause nature film"}
          onClick={() => { if (blocked) { setBlocked(false); setPaused(false); } else setPaused(!paused); }}>
          {paused || blocked ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}
          <span>{paused || blocked ? "Play nature film" : "Pause nature film"}</span>
        </button>
      )}
    </div>
  );
}
