"use client";

import {
  Play, Pause, Square, SkipBack, SkipForward,
  Volume2, Repeat, Repeat1, Layers, Music
} from "lucide-react";
import { useSessionStore } from "@/store/useSessionStore";
import { formatTime } from "@/lib/timeUtils";
import { getWaveSurferInstance } from "@/lib/wavesurferInstance";

const GLOBAL_LOOP_OPTIONS: Array<number | "infinite"> = [1, 2, 3, 5, "infinite"];

export default function PlaybackBar() {
  const {
    isPlaying,
    currentTime,
    duration,
    playbackSpeed,
    setPlaybackSpeed,
    volume,
    setVolume,
    loopMode,
    setLoopMode,
    globalLoopCount,
    setGlobalLoopCount,
    playMode,
    setPlayMode,
    currentSession,
    isReady,
  } = useSessionStore();

  const ws = () => getWaveSurferInstance();
  const toggle  = () => ws()?.playPause();
  const stop    = () => { ws()?.pause(); ws()?.seekTo(0); };
  const seekBk  = () => ws()?.setTime(Math.max(0, currentTime - 5));
  const seekFwd = () => ws()?.setTime(Math.min(duration, currentTime + 5));

  const progress = duration > 0 ? currentTime / duration : 0;
  const disabled = !isReady || !currentSession;
  const speeds   = [0.5, 0.75, 1, 1.25, 1.5, 2];

  const iconBtn = (onClick: () => void, dis: boolean, title: string, children: React.ReactNode) => (
    <button
      onClick={onClick}
      disabled={dis}
      title={title}
      style={{
        background: "none",
        border: "1.5px solid #e5e7eb",
        borderRadius: 10,
        padding: "8px 12px",
        cursor: dis ? "not-allowed" : "pointer",
        color: dis ? "#d1d5db" : "#374151",
        display: "flex", alignItems: "center",
        transition: "background 0.12s, border-color 0.12s",
      }}
      onMouseEnter={e => !dis && Object.assign((e.currentTarget as HTMLElement).style, { background: "#f3f4f6", borderColor: "#c4b5fd" })}
      onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, { background: "none", borderColor: "#e5e7eb" })}
    >
      {children}
    </button>
  );

  return (
    <div style={{
      position: "fixed",
      bottom: 0, left: 0, right: 0,
      background: "white",
      borderTop: "1.5px solid #e5e7eb",
      boxShadow: "0 -4px 32px rgba(0,0,0,0.07)",
      zIndex: 100,
    }}>
      {/* Gradient progress bar */}
      <div style={{ height: 3, background: "#f3f4f6" }}>
        <div style={{
          height: "100%",
          width: `${progress * 100}%`,
          background: "linear-gradient(90deg, #6d28d9 0%, #2563eb 100%)",
          transition: "width 0.15s linear",
        }} />
      </div>

      <div style={{
        display: "flex", alignItems: "center",
        gap: 0, height: 72, padding: "0 20px",
        overflowX: "auto",
      }}>
        {/* Time display */}
        <div style={{ minWidth: 120, paddingRight: 20 }}>
          <div style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 19, color: "#1e1b4b", lineHeight: 1 }}>
            {formatTime(currentTime)}
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>
            / {formatTime(duration)}
          </div>
        </div>

        <div style={{ width: 1, height: 40, background: "#e5e7eb", marginRight: 20 }} />

        {/* Play Mode Toggle */}
        <div style={{ display: "flex", background: "#f3f4f6", borderRadius: 10, padding: 3, marginRight: 20 }}>
          <button
            onClick={() => setPlayMode("standard")}
            style={{
                padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                background: playMode === "standard" ? "white" : "transparent",
                color: playMode === "standard" ? "#6d28d9" : "#6b7280",
                border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                boxShadow: playMode === "standard" ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
            }}
          >
            <Music size={14} /> Standard
          </button>
          <button
            onClick={() => setPlayMode("looping")}
            style={{
                padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                background: playMode === "looping" ? "white" : "transparent",
                color: playMode === "looping" ? "#6d28d9" : "#6b7280",
                border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                boxShadow: playMode === "looping" ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
            }}
          >
            <Layers size={14} /> Practice
          </button>
        </div>

        {/* Transport controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, paddingRight: 20 }}>
          {iconBtn(seekBk, disabled, "Seek back 5s (←)", <SkipBack size={17} />)}

          <button
            onClick={toggle}
            disabled={disabled}
            title="Play / Pause (Space)"
            style={{
              width: 50, height: 50, borderRadius: "50%",
              background: disabled ? "#e5e7eb" : "linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%)",
              border: "none",
              color: "white",
              cursor: disabled ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: disabled ? "none" : "0 4px 18px rgba(109,40,217,0.35)",
              transition: "transform 0.1s, box-shadow 0.15s",
              flexShrink: 0,
            }}
            onMouseEnter={e => !disabled && ((e.currentTarget as HTMLElement).style.transform = "scale(1.08)")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.transform = "scale(1)")}
          >
            {isPlaying
              ? <Pause size={20} fill="white" />
              : <Play size={20} fill="white" style={{ marginLeft: 2 }} />}
          </button>

          {iconBtn(stop, disabled, "Stop", <Square size={17} />)}
          {iconBtn(seekFwd, disabled, "Seek forward 5s (→)", <SkipForward size={17} />)}
        </div>

        <div style={{ width: 1, height: 40, background: "#e5e7eb", marginRight: 20 }} />

        {/* Speed chips */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, paddingRight: 20 }}>
          <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 700, whiteSpace: "nowrap" }}>Speed</span>
          <div style={{ display: "flex", gap: 4 }}>
            {speeds.map(s => (
              <button
                key={s}
                onClick={() => setPlaybackSpeed(s)}
                style={{
                  padding: "5px 10px", borderRadius: 8,
                  border: "1.5px solid",
                  borderColor: playbackSpeed === s ? "#6d28d9" : "#e5e7eb",
                  background: playbackSpeed === s ? "#6d28d9" : "white",
                  color: playbackSpeed === s ? "white" : "#6b7280",
                  fontWeight: 700, fontSize: 12, cursor: "pointer",
                  transition: "all 0.12s",
                }}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>

        {/* Global Loop selector */}
        {playMode === "looping" && (
            <>
                <div style={{ width: 1, height: 40, background: "#e5e7eb", marginRight: 20 }} />
                <div style={{ display: "flex", alignItems: "center", gap: 8, paddingRight: 20 }}>
                    <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 700, whiteSpace: "nowrap" }}>Global Loop</span>
                    <div style={{ display: "flex", gap: 4 }}>
                        {GLOBAL_LOOP_OPTIONS.map(opt => (
                            <button
                                key={String(opt)}
                                onClick={() => setGlobalLoopCount(opt)}
                                style={{
                                    padding: "5px 10px", borderRadius: 8,
                                    border: "1.5px solid",
                                    borderColor: globalLoopCount === opt ? "#6d28d9" : "#e5e7eb",
                                    background: globalLoopCount === opt ? "#6d28d9" : "white",
                                    color: globalLoopCount === opt ? "white" : "#6b7280",
                                    fontWeight: 700, fontSize: 12, cursor: "pointer",
                                    transition: "all 0.12s",
                                }}
                            >
                                {opt === "infinite" ? "∞" : `${opt}×`}
                            </button>
                        ))}
                    </div>
                </div>
            </>
        )}

        {/* Volume — pushed to right */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          marginLeft: "auto", minWidth: 180,
        }}>
          <Volume2 size={16} style={{ color: "#6b7280", flexShrink: 0 }} />
          <input
            type="range" min="0" max="1" step="0.01"
            value={volume}
            onChange={e => setVolume(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: "#6d28d9", cursor: "pointer", height: 4 }}
          />
          <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 700, minWidth: 36 }}>
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}
