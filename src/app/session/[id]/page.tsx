"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { useSessionStore } from "@/store/useSessionStore";
import WaveformPlayer from "@/components/waveform/WaveformPlayer";
import PlaybackBar from "@/components/playback/PlaybackBar";
import RegionList from "@/components/regions/RegionList";
import { ChevronLeft, MapPin, Trash2, Clock, Layers, Info, Edit3, Check, Maximize2, Monitor, RefreshCw } from "lucide-react";
import { formatTime } from "@/lib/timeUtils";

export default function SessionStudio() {
  const { id } = useParams();
  const router = useRouter();
  const { loadSession, saveSession } = useSession();
  const { 
    currentSession, addMarker, removeMarker, currentTime, 
    isReady, duration, playMode, globalLoopCount, 
    selectedRegionIds, loopGap, setLoopGap, waitingTimeRemaining,
    practiceProgress
  } = useSessionStore();
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (id) loadSession(id as string).then(() => setIsLoaded(true));
  }, [id, loadSession]);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

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

  const toggleMobileView = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        if (screen.orientation && (screen.orientation as any).lock) {
            await (screen.orientation as any).lock("landscape").catch(() => {});
        }
      } else {
        await document.exitFullscreen();
        if (screen.orientation && (screen.orientation as any).unlock) {
            (screen.orientation as any).unlock();
        }
      }
    } catch (e) {
      console.error("Mobile view error", e);
    }
  };

  const calculateTotalPracticeTime = () => {
    if (!currentSession || currentSession.regions.length === 0) return 0;
    const selectedRegions = currentSession.regions.filter(r => selectedRegionIds.includes(r.id));
    if (selectedRegions.length === 0) return 0;

    const sequenceDuration = selectedRegions.reduce((acc, r) => {
        const reps = r.repeatCount === "infinite" ? 1 : r.repeatCount;
        return acc + (r.end - r.start) * reps;
    }, 0);

    const globalReps = globalLoopCount === "infinite" ? 1 : globalLoopCount;
    return sequenceDuration * globalReps;
  };

  useEffect(() => {
    if (currentSession && isLoaded) {
      const hasInfinite = currentSession.regions.some(r => r.repeatCount === "infinite");
      if (hasInfinite) {
        const updatedRegions = currentSession.regions.map(r => ({
          ...r,
          repeatCount: r.repeatCount === "infinite" ? 1 : r.repeatCount
        }));
        useSessionStore.getState().setSession({ ...currentSession, regions: updatedRegions });
      }
    }
  }, [currentSession, isLoaded]);

  useEffect(() => {
    if (!isLoaded || !currentSession) return;
    setSaveStatus("saving");
    const t = setTimeout(async () => {
        await saveSession(currentSession);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
    }, 1200);
    return () => clearTimeout(t);
  }, [currentSession, isLoaded, saveSession]);

  if (!isLoaded) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, background: "white" }}>
      <div className="animate-spin" style={{ width: 40, height: 40, border: "3px solid #c4b5fd", borderTop: "3px solid #6d28d9", borderRadius: "50%" }} />
      <p style={{ color: "#6b7280", fontWeight: 600, margin: 0 }}>Loading session</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", paddingBottom: 88 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } } 
        .animate-spin { animation: spin 0.8s linear infinite; }
        @keyframes spin-slow { to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
        .mobile-view-btn { 
           position: fixed; bottom: 100px; right: 20px; z-index: 100;
           background: #6d28d9; color: white; border: none; border-radius: 50%;
           width: 56px; height: 56px; display: flex; align-items: center; justify-content: center;
           box-shadow: 0 8px 20px rgba(109,40,217,0.4); cursor: pointer; transition: all 0.2s;
        }
        .mobile-view-btn:active { transform: scale(0.9); }
        @media (min-width: 769px) { .mobile-view-btn { display: none; } }
      `}</style>      <button className="mobile-view-btn" onClick={toggleMobileView} title="Full Screen">
        <Maximize2 size={24} />
      </button>

      {/* ── Top nav ── */}
      <header style={{
        background: "white", borderBottom: "1.5px solid #e5e7eb",
        padding: "0 16px", height: 60,
        display: "flex", alignItems: "center", gap: 12,
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <button onClick={() => router.push("/")} style={{ background: "none", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "7px", cursor: "pointer", color: "#374151", display: "flex" }}>
          <ChevronLeft size={20} />
        </button>

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontWeight: 900, fontSize: 13, color: "#6d28d9" }}>SANTHAI</span>
            <span style={{ fontWeight: 500, fontSize: 10, color: "#6d28d9", opacity: 0.7, letterSpacing: 1 }}>STUDIO</span>
            <span style={{ width: 1, height: 12, background: "#e5e7eb", margin: "0 4px" }} />
          </div>
          {isEditingName ? (
            <input autoFocus value={editedName} onChange={e => setEditedName(e.target.value)} onBlur={handleNameSave} style={{ width: "200px", fontWeight: 800, fontSize: 16, color: "#111827", border: "1.5px solid #6d28d9", borderRadius: 8, padding: "2px 8px", outline: "none" }} />
          ) : (
            <>
              <h1 style={{ margin: 0, fontWeight: 800, fontSize: 16, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentSession?.name || "Untitled"}</h1>
              <button onClick={() => setIsEditingName(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex", padding: 4 }}><Edit3 size={14} /></button>
            </>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: saveStatus === "saving" ? "#6d28d9" : "#10b981", opacity: saveStatus === "idle" ? 0.4 : 1 }}>
           {saveStatus === "saving" ? <div className="animate-spin" style={{ width: 10, height: 10, border: "2px solid #ddd6fe", borderTopColor: "#6d28d9", borderRadius: "50%" }} /> : <Check size={12} />}
           <span className="mobile-hide">{saveStatus === "saving" ? "Saving" : "Saved"}</span>
        </div>

        <button
            onClick={toggleMobileView}
            className="mobile-hide"
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "6px 12px", borderRadius: 10,
              background: isFullscreen ? "#10b981" : "#6d28d9", color: "white",
              border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer"
            }}
          >
            <Maximize2 size={14} /> Full Screen
          </button>
      </header>

      <div className="responsive-grid" style={{ maxWidth: 1440, margin: "0 auto", padding: "16px 24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <div style={{ background: "white", border: "1.5px solid #e5e7eb", borderRadius: 20, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#111827" }}>Waveform</h2>
              <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, background: "#f5f3ff", border: "1px solid #c4b5fd", borderRadius: 6, padding: "2px 8px", color: "#6d28d9" }}>{formatTime(currentTime)} / {formatTime(duration)}</span>
            </div>
            <WaveformPlayer />
          </div>

          <div style={{ background: "white", border: "1.5px solid #e5e7eb", borderRadius: 16, padding: "12px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#6b7280", marginRight: 4 }}>Markers:</span>
            {(currentSession?.markers ?? []).map(m => (
              <span key={m.id} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#ede9fe", color: "#5b21b6", border: "1px solid #c4b5fd", borderRadius: 8, padding: "3px 8px", fontSize: 11, fontWeight: 700 }}>
                {m.label}  {formatTime(m.time)}
                <button onClick={() => removeMarker(m.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#a78bfa", display: "flex" }}><Trash2 size={11} /></button>
              </span>
            ))}
            {currentSession?.markers.length === 0 && (
              <span style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>No markers added yet. Use "Add Marker" on the waveform.</span>
            )}
          </div>

          {/* Practice Timeline */}
          {playMode === "looping" && selectedRegionIds.length > 0 && (
              <div style={{
                background: "linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%)",
                borderRadius: 20, padding: "16px 20px", color: "white",
                boxShadow: "0 8px 20px -5px rgba(109,40,217,0.3)",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <RefreshCw size={16} className="animate-spin-slow" />
                        <h3 style={{ margin: 0, fontWeight: 800, fontSize: 14 }}>Practice Sequence</h3>
                    </div>
                    <span style={{ fontSize: 11, opacity: 0.8, fontWeight: 600 }}>
                        Total Duration: {formatTime(calculateTotalPracticeTime())}
                    </span>
                </div>

                <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }} className="hide-scrollbar">
                    {currentSession?.regions.filter(r => selectedRegionIds.includes(r.id)).map((r, i) => {
                        const isActive = practiceProgress.regionId === r.id;
                        return (
                            <div key={r.id} style={{
                                background: isActive ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.15)", 
                                borderRadius: 10, padding: "8px 12px",
                                minWidth: 100, border: isActive ? "2px solid white" : "1px solid rgba(255,255,255,0.2)",
                                transition: "all 0.2s",
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.7 }}>{i+1}</div>
                                    {isActive && (
                                        <div style={{ 
                                            background: "#fbbf24", color: "#1e1b4b", padding: "1px 4px", 
                                            borderRadius: 4, fontSize: 8, fontWeight: 900 
                                        }}>ACTIVE</div>
                                    )}
                                </div>
                                <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.label}</div>
                                <div style={{ fontSize: 11, fontWeight: 700 }}>
                                    {isActive ? (
                                        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                            <span style={{ color: "#fbbf24" }}>{practiceProgress.regionRepeat}</span>
                                            <span style={{ opacity: 0.6, fontSize: 9 }}>/ {r.repeatCount === "infinite" ? "∞" : r.repeatCount}x</span>
                                        </div>
                                    ) : (
                                        <span style={{ opacity: 0.6 }}>{r.repeatCount === "infinite" ? "∞" : r.repeatCount}x</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <div style={{ display: "flex", alignItems: "center", padding: "0 4px", fontSize: 16, opacity: 0.5 }}></div>
                    <div style={{
                        background: "rgba(255,255,255,0.25)", borderRadius: 10, padding: "8px 12px",
                        minWidth: 80, border: "1.5px solid white",
                    }}>
                        <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.9, marginBottom: 2 }}>Global Pass</div>
                        <div style={{ fontWeight: 800, fontSize: 14 }}>
                            <span style={{ color: "#fbbf24" }}>{practiceProgress.globalPass}</span>
                            <span style={{ fontSize: 11, opacity: 0.7 }}> / {globalLoopCount === "infinite" ? "∞" : globalLoopCount}</span>
                        </div>
                    </div>
                </div>
              </div>
          )}

          <div style={{ background: "white", border: "1.5px solid #e5e7eb", borderRadius: 20, padding: 16 }}>
            <RegionList />
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "white", border: "1.5px solid #e5e7eb", borderRadius: 20, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #f3f4f6" }}>
              <Layers size={15} style={{ color: "#6d28d9" }} />
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#1e1b4b" }}>Session Info</h3>
            </div>
            {[["Duration", formatTime(duration)], ["Markers", String(currentSession?.markers.length ?? 0)], ["Regions", String(currentSession?.regions.length ?? 0)]].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13 }}>
                <span style={{ color: "#6b7280" }}>{l}</span>
                <span style={{ fontWeight: 800, color: "#1e1b4b", fontFamily: "monospace" }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ background: "white", border: "1.5px solid #e5e7eb", borderRadius: 20, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #f3f4f6" }}>
              <Clock size={15} style={{ color: "#6d28d9" }} />
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#1e1b4b" }}>Practice Settings</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280" }}>Loop Gap</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {waitingTimeRemaining > 0 && (
                            <span style={{ 
                                background: "#ede9fe", color: "#6d28d9", padding: "2px 8px", 
                                borderRadius: 6, fontSize: 10, fontWeight: 900, 
                                display: "flex", alignItems: "center", gap: 4,
                                border: "1px solid #c4b5fd",
                            }}>
                                <div className="animate-spin" style={{ width: 8, height: 8, border: "1.5px solid #c4b5fd", borderTopColor: "#6d28d9", borderRadius: "50%" }} />
                                WAITING: {(waitingTimeRemaining/1000).toFixed(1)}s
                            </span>
                        )}
                        <span style={{ fontSize: 12, fontWeight: 800, color: "#6d28d9" }}>{loopGap === 0 ? "None" : `${loopGap/1000}s`}</span>
                    </div>
                </div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {[0, 500, 1000, 2000, 3000, 5000, 10000].map(val => (
                        <button
                            key={val}
                            onClick={() => setLoopGap(val)}
                            style={{
                                padding: "4px 8px", borderRadius: 8,
                                border: "1.5px solid",
                                borderColor: loopGap === val ? "#6d28d9" : "#e5e7eb",
                                background: loopGap === val ? "#6d28d9" : "white",
                                color: loopGap === val ? "white" : "#6b7280",
                                fontWeight: 700, fontSize: 11, cursor: "pointer",
                                transition: "all 0.12s",
                            }}
                        >
                            {val === 0 ? "None" : val < 1000 ? "0.5s" : `${val/1000}s`}
                        </button>
                    ))}
                </div>
                <p style={{ margin: 0, fontSize: 10, color: "#9ca3af" }}>
                    Pause duration between repeats.
                </p>
            </div>
          </div>

          <div className="mobile-hide" style={{ background: "#f5f3ff", border: "1.5px solid #c4b5fd", borderRadius: 20, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Info size={15} style={{ color: "#6d28d9" }} />
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#5b21b6" }}>Shortcuts</h3>
            </div>
            {[["Space", "Play/Pause"], ["M", "Marker"], ["L", "Loop"], ["← →", "Seek"], ["+ -", "Speed"]].map(([k, a]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "#6b7280" }}>{a}</span>
                <kbd style={{ background: "white", border: "1.5px solid #c4b5fd", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700, color: "#6d28d9" }}>{k}</kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
      <PlaybackBar />
    </div>
  );
}
