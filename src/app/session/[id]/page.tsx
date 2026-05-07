"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { useSessionStore } from "@/store/useSessionStore";
import WaveformPlayer from "@/components/waveform/WaveformPlayer";
import PlaybackBar from "@/components/playback/PlaybackBar";
import RegionList from "@/components/regions/RegionList";
import { ChevronLeft, MapPin, Trash2, Clock, Layers, Info, Edit3, Check, RefreshCw } from "lucide-react";
import { formatTime } from "@/lib/timeUtils";

export default function SessionStudio() {
  const { id } = useParams();
  const router = useRouter();
  const { loadSession, saveSession } = useSession();
  const { currentSession, addMarker, removeMarker, currentTime, isReady, duration, playMode, globalLoopCount } = useSessionStore();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");

  useEffect(() => {
    if (id) loadSession(id as string).then(() => setIsLoaded(true));
  }, [id, loadSession]);

  useEffect(() => {
    if (currentSession && !isEditingName) {
      setEditedName(currentSession.name);
    }
  }, [currentSession, isEditingName]);

  const handleNameSave = () => {
    if (currentSession && editedName.trim() !== "") {
      useSessionStore.getState().setSession({ ...currentSession, name: editedName.trim() });
    }
    setIsEditingName(false);
  };

  const calculateTotalPracticeTime = () => {
    if (!currentSession || currentSession.regions.length === 0) return 0;
    const selectedRegions = currentSession.regions.filter(r => useSessionStore.getState().selectedRegionIds.includes(r.id));
    if (selectedRegions.length === 0) return 0;

    const sequenceDuration = selectedRegions.reduce((acc, r) => {
        const reps = r.repeatCount === "infinite" ? 1 : r.repeatCount;
        return acc + (r.end - r.start) * reps;
    }, 0);

    const globalReps = globalLoopCount === "infinite" ? 1 : globalLoopCount;
    return sequenceDuration * globalReps;
  };

  useEffect(() => {
    if (!isLoaded || !currentSession) return;
    const t = setTimeout(() => saveSession(currentSession), 1200);
    return () => clearTimeout(t);
  }, [currentSession, isLoaded, saveSession]);

  if (!isLoaded) return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", flexDirection: "column", gap: 16, background: "white",
    }}>
      <div style={{
        width: 40, height: 40, border: "3px solid #c4b5fd",
        borderTop: "3px solid #6d28d9", borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <p style={{ color: "#6b7280", fontWeight: 600, margin: 0 }}>Loading session…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", paddingBottom: 88 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Top nav ── */}
      <header style={{
        background: "white", borderBottom: "1.5px solid #e5e7eb",
        padding: "0 24px", height: 60,
        display: "flex", alignItems: "center", gap: 16,
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <button
          onClick={() => router.push("/")}
          style={{
            background: "none", border: "1.5px solid #e5e7eb",
            borderRadius: 10, padding: "7px 10px", cursor: "pointer",
            color: "#374151", display: "flex", alignItems: "center",
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#f3f4f6")}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "none")}
        >
          <ChevronLeft size={20} />
        </button>

        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8 }}>
          {isEditingName ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                autoFocus
                value={editedName}
                onChange={e => setEditedName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleNameSave()}
                onBlur={handleNameSave}
                style={{
                  margin: 0, fontWeight: 800, fontSize: 17, color: "#111827",
                  border: "1.5px solid #6d28d9", borderRadius: 8, padding: "2px 8px", outline: "none",
                }}
              />
              <button onClick={handleNameSave} style={{ background: "none", border: "none", cursor: "pointer", color: "#6d28d9", display: "flex" }}>
                <Check size={18} />
              </button>
            </div>
          ) : (
            <>
              <h1 style={{
                margin: 0, fontWeight: 800, fontSize: 17, color: "#111827",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {currentSession?.name || "Untitled"}
              </h1>
              <button 
                onClick={() => setIsEditingName(true)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex", padding: 4 }}
                title="Edit name"
              >
                <Edit3 size={16} />
              </button>
            </>
          )}
        </div>

        {/* Status pill */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "5px 14px",
          background: isReady ? "#dcfce7" : "#f3f4f6",
          border: `1.5px solid ${isReady ? "#86efac" : "#e5e7eb"}`,
          borderRadius: 20, fontSize: 12, fontWeight: 700,
          color: isReady ? "#15803d" : "#9ca3af",
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%",
            background: isReady ? "#16a34a" : "#d1d5db",
          }} />
          {isReady ? "Ready" : "Loading audio…"}
        </div>
      </header>

      {/* ── Two-column layout ── */}
      <div style={{
        maxWidth: 1440, margin: "0 auto", padding: 24,
        display: "grid", gridTemplateColumns: "1fr 360px", gap: 20,
      }}>
        {/* ── Left: Waveform + Actions + Regions ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>

          {/* Waveform card */}
          <div style={{
            background: "white", border: "1.5px solid #e5e7eb",
            borderRadius: 20, padding: 20,
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 16,
            }}>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#111827" }}>
                Waveform
              </h2>
              <span style={{
                fontFamily: "monospace", fontSize: 13, fontWeight: 700,
                background: "#f5f3ff", border: "1.5px solid #c4b5fd",
                borderRadius: 8, padding: "3px 10px", color: "#6d28d9",
              }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <WaveformPlayer />
          </div>

          {/* Marker action bar */}
          <div style={{
            background: "white", border: "1.5px solid #e5e7eb",
            borderRadius: 16, padding: "14px 16px",
            display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
          }}>
            <button
              onClick={() => addMarker({
                id: Math.random().toString(36).slice(2, 10),
                time: currentTime,
                label: `M${(currentSession?.markers.length ?? 0) + 1}`,
              })}
              disabled={!isReady}
              style={{
                padding: "9px 18px", borderRadius: 10,
                background: isReady ? "#6d28d9" : "#e5e7eb",
                color: isReady ? "white" : "#9ca3af",
                border: "none", fontWeight: 700, fontSize: 14,
                cursor: isReady ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", gap: 8,
                transition: "background 0.12s", flexShrink: 0,
              }}
              onMouseEnter={e => isReady && ((e.currentTarget as HTMLElement).style.background = "#5b21b6")}
              onMouseLeave={e => isReady && ((e.currentTarget as HTMLElement).style.background = "#6d28d9")}
            >
              <MapPin size={15} />
              Add Marker
              <kbd style={{
                background: "rgba(255,255,255,0.2)", borderRadius: 5,
                padding: "1px 6px", fontSize: 11,
              }}>M</kbd>
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#6b7280", fontSize: 12, flexShrink: 0 }}>
              <Clock size={13} />
              <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{formatTime(currentTime)}</span>
            </div>

            {/* Marker chips */}
            {(currentSession?.markers ?? []).map(m => (
              <span key={m.id} style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: "#ede9fe", color: "#5b21b6",
                border: "1.5px solid #c4b5fd", borderRadius: 8,
                padding: "4px 10px", fontSize: 12, fontWeight: 700,
              }}>
                <MapPin size={11} />
                {m.label} · {formatTime(m.time)}
                <button
                  onClick={() => removeMarker(m.id)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "#a78bfa", padding: 0, marginLeft: 2,
                    display: "flex", alignItems: "center",
                  }}
                  title="Delete marker"
                >
                  <Trash2 size={11} />
                </button>
              </span>
            ))}
          </div>

          {/* Practice Timeline / Loop Status */}
          {playMode === "looping" && useSessionStore.getState().selectedRegionIds.length > 0 && (
              <div style={{
                background: "linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%)",
                borderRadius: 20, padding: "20px 24px", color: "white",
                boxShadow: "0 10px 25px -5px rgba(109,40,217,0.3)",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <RefreshCw size={18} className="animate-spin-slow" />
                        <h3 style={{ margin: 0, fontWeight: 800, fontSize: 15 }}>Practice Sequence</h3>
                    </div>
                    <span style={{ fontSize: 12, opacity: 0.8, fontWeight: 600 }}>
                        Est. Total: {formatTime(calculateTotalPracticeTime())}
                    </span>
                </div>

                <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
                    {currentSession?.regions.filter(r => useSessionStore.getState().selectedRegionIds.includes(r.id)).map((r, i) => (
                        <div key={r.id} style={{
                            background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "10px 14px",
                            minWidth: 120, border: "1px solid rgba(255,255,255,0.2)",
                        }}>
                            <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.7, marginBottom: 4 }}>Step {i+1}</div>
                            <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.label}</div>
                            <div style={{ fontSize: 12, fontWeight: 700 }}>{r.repeatCount}× repeats</div>
                        </div>
                    ))}
                    <div style={{ display: "flex", alignItems: "center", padding: "0 10px", fontSize: 20, opacity: 0.5 }}>×</div>
                    <div style={{
                        background: "rgba(255,255,255,0.25)", borderRadius: 12, padding: "10px 14px",
                        minWidth: 100, border: "1.5px solid white",
                    }}>
                        <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.9, marginBottom: 4 }}>Global</div>
                        <div style={{ fontWeight: 800, fontSize: 15 }}>{globalLoopCount}×</div>
                    </div>
                </div>
              </div>
          )}

          {/* Regions */}
          <div style={{
            background: "white", border: "1.5px solid #e5e7eb",
            borderRadius: 20, padding: 20,
          }}>
            <RegionList />
          </div>
        </div>

        {/* ── Right: Info panel ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Session stats */}
          <div style={{
            background: "white", border: "1.5px solid #e5e7eb",
            borderRadius: 20, padding: 20,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: "1.5px solid #f3f4f6" }}>
              <Layers size={17} style={{ color: "#6d28d9" }} />
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#111827" }}>Session Info</h3>
            </div>
            {[
              ["Duration", formatTime(duration)],
              ["Markers", String(currentSession?.markers.length ?? 0)],
              ["Regions", String(currentSession?.regions.length ?? 0)],
            ].map(([label, val]) => (
              <div key={label} style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", padding: "8px 0",
                borderBottom: "1px solid #f9fafb",
              }}>
                <span style={{ fontSize: 13, color: "#6b7280" }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#1e1b4b", fontFamily: "monospace" }}>{val}</span>
              </div>
            ))}
          </div>



          {/* Keyboard shortcuts */}
          <div style={{
            background: "#f5f3ff", border: "1.5px solid #c4b5fd",
            borderRadius: 20, padding: 20,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Info size={15} style={{ color: "#6d28d9" }} />
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#5b21b6" }}>Shortcuts</h3>
            </div>
            {[
              ["Space", "Play / Pause"],
              ["M", "Add Marker"],
              ["L", "Toggle Loop"],
              ["← →", "Seek ±5s"],
              ["+ −", "Speed"],
            ].map(([k, a]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "#6b7280" }}>{a}</span>
                <kbd style={{
                  background: "white", border: "1.5px solid #c4b5fd",
                  borderRadius: 6, padding: "2px 8px", fontSize: 11,
                  fontFamily: "monospace", fontWeight: 700, color: "#6d28d9",
                  boxShadow: "0 2px 0 #c4b5fd",
                }}>{k}</kbd>
              </div>
            ))}
          </div>
        </div>
      </div>

      <PlaybackBar />
    </div>
  );
}
