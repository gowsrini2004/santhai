"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { motion, AnimatePresence } from "framer-motion";
import { Music2, Play, Trash2, Search, Clock, Headphones, Scissors, Plus, Upload, Maximize2 } from "lucide-react";
import AudioCutterModal from "@/components/upload/AudioCutterModal";

export default function Home() {
  const router = useRouter();
  const { sessions, createSession, deleteSession } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isCutterOpen, setIsCutterOpen] = useState(false);
  const [cutterFile, setCutterFile] = useState<File | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

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

  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    return sessions
      .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [sessions, searchQuery]);

  const handleUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "audio/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setIsUploading(true);
        try {
          const id = await createSession(file.name.replace(/\.[^/.]+$/, ""), file);
          router.push(`/session/${id}`);
        } catch (e) {
          console.error("Upload failed", e);
          setIsUploading(false);
        }
      }
    };
    input.click();
  };

  const handleTryDemo = async () => {
    setIsUploading(true);
    try {
      const sampleRate = 44100;
      const duration = 5; 
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const buffer = audioCtx.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        const freq = 440 + Math.sin(t * 2) * 50; 
        data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 0.5);
      }
      const wavBlob = bufferToWav(buffer);
      const file = new File([wavBlob], "Demo_Practice.wav", { type: "audio/wav" });
      const id = await createSession("Sample Demo Session", file);
      router.push(`/session/${id}`);
    } catch (e) {
      console.error("Demo failed", e);
      alert("Failed to generate demo. Please try uploading your own audio file.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCutterClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "audio/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setCutterFile(file);
        setIsCutterOpen(true);
      }
    };
    input.click();
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } } 
        .animate-spin { animation: spin 0.8s linear infinite; }
        .mobile-view-btn { 
           position: fixed; bottom: 30px; right: 20px; z-index: 100;
           background: #6d28d9; color: white; border: none; border-radius: 50%;
           width: 56px; height: 56px; display: flex; align-items: center; justify-content: center;
           box-shadow: 0 8px 20px rgba(109,40,217,0.4); cursor: pointer; transition: all 0.2s;
        }
        .mobile-view-btn:active { transform: scale(0.9); }
        @media (min-width: 769px) { .mobile-view-btn { display: none; } }
      `}</style>

      {/* Floating Button for Full Screen */}
      <button className="mobile-view-btn" onClick={toggleMobileView} title="Full Screen">
        <Maximize2 size={24} />
      </button>

      {/* ── Header ── */}
      <header style={{
        background: "white", borderBottom: "1.5px solid #e5e7eb",
        padding: "0 24px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36,
            background: "linear-gradient(135deg, #6d28d9 0%, #2563eb 100%)",
            borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Headphones size={18} color="white" />
          </div>
          <div>
            <span style={{ fontWeight: 900, fontSize: 20, color: "#1e1b4b" }}>SANTHAI</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={handleUpload}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 16px", borderRadius: 10,
              background: "#6d28d9", color: "white",
              border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer"
            }}
          >
            <Plus size={16} /> New Session
          </button>
          <button
            onClick={handleCutterClick}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 16px", borderRadius: 10,
              background: "#ede9fe", color: "#6d28d9",
              border: "1.5px solid #c4b5fd", fontWeight: 700, fontSize: 13, cursor: "pointer"
            }}
          >
            <Scissors size={16} /> Audio Cutter
          </button>
          <button
            onClick={toggleMobileView}
            className="mobile-hide"
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 16px", borderRadius: 10,
              background: isFullscreen ? "#10b981" : "#ede9fe", color: isFullscreen ? "white" : "#6d28d9",
              border: "1.5px solid #c4b5fd", fontWeight: 700, fontSize: 13, cursor: "pointer"
            }}
          >
            <Maximize2 size={16} /> Full Screen
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
        
        {/* ── Hero ── */}
        <section style={{ textAlign: "center", marginBottom: 60 }}>
          <h1 style={{ margin: 0, fontSize: 42, fontWeight: 900, color: "#111827", letterSpacing: "-1px" }}>
            Master Your Audio Practice
          </h1>
          <p style={{ margin: "16px 0 0", fontSize: 17, color: "#6b7280", maxWidth: 600, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
            The ultimate tool for precision looping, speed adjustment, and audio segmentation. 
          </p>
        </section>

        {/* ── Sessions List ── */}
        <section>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Clock size={20} style={{ color: "#6d28d9" }} />
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111827" }}>My Sessions</h2>
            </div>
            
            <div style={{ position: "relative" }}>
              <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
              <input
                type="text"
                placeholder="Search sessions…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  padding: "10px 14px 10px 36px", border: "1.5px solid #e5e7eb",
                  borderRadius: 12, fontSize: 14, outline: "none", width: 280,
                }}
              />
            </div>
          </div>

          {(!sessions || sessions.length === 0) ? (
            <div style={{
              textAlign: "center", padding: "80px 32px", border: "2px dashed #e5e7eb", borderRadius: 24, background: "white"
            }}>
              <div style={{ width: 64, height: 64, background: "#f5f3ff", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <Upload size={32} style={{ color: "#c4b5fd" }} />
              </div>
              <h3 style={{ margin: 0, fontWeight: 800, color: "#1e1b4b", fontSize: 18 }}>Ready to start?</h3>
              <p style={{ margin: "8px 0 24px", color: "#6b7280" }}>Generate a demo or upload your own file.</p>
              
              <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
                <button
                    onClick={handleUpload}
                    style={{ padding: "12px 24px", borderRadius: 12, background: "#6d28d9", color: "white", border: "none", fontWeight: 700, cursor: "pointer" }}
                >
                    Upload File
                </button>
                <button
                    onClick={handleTryDemo}
                    disabled={isUploading}
                    style={{ padding: "12px 24px", borderRadius: 12, background: "#ede9fe", color: "#6d28d9", border: "1.5px solid #c4b5fd", fontWeight: 700, cursor: "pointer" }}
                >
                    {isUploading ? "Generating Demo..." : "Try Demo Audio"}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
              <AnimatePresence mode="popLayout">
                {filteredSessions.map((session, i) => (
                  <motion.div
                    key={session.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => router.push(`/session/${session.id}`)}
                    style={{
                      background: "white", border: "1.5px solid #e5e7eb", borderRadius: 20,
                      padding: 24, cursor: "pointer", position: "relative",
                    }}
                    whileHover={{ borderColor: "#6d28d9", translateY: -4 }}
                  >
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: "#6d28d9", borderTopLeftRadius: 20, borderBottomLeftRadius: 20 }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ margin: 0, fontWeight: 800, fontSize: 16, color: "#1e1b4b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {session.name}
                        </h3>
                        <span style={{ fontSize: 12, color: "#9ca3af" }}>{new Date(session.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <button onClick={e => deleteSession(session.id, e)} style={{ background: "none", border: "none", cursor: "pointer", color: "#d1d5db" }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: 8 }}>
                            <span style={{ background: "#f5f3ff", color: "#6d28d9", fontSize: 11, fontWeight: 700, padding: "4px 8px", borderRadius: 6 }}>{session.markers.length} Markers</span>
                            <span style={{ background: "#eff6ff", color: "#2563eb", fontSize: 11, fontWeight: 700, padding: "4px 8px", borderRadius: 6 }}>{session.regions.length} Regions</span>
                        </div>
                        <div style={{ width: 32, height: 32, background: "#6d28d9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Play size={14} fill="white" color="white" style={{ marginLeft: 2 }} />
                        </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </div>

      <AudioCutterModal isOpen={isCutterOpen} onClose={() => { setIsCutterOpen(false); setCutterFile(null); }} file={cutterFile} />
    </div>
  );
}

function bufferToWav(abuffer: AudioBuffer) {
  let numOfChan = abuffer.numberOfChannels,
      length = abuffer.length * numOfChan * 2 + 44,
      buffer = new ArrayBuffer(length),
      view = new DataView(buffer),
      channels = [], i, sample,
      offset = 0, pos = 0;
  function setUint16(data: any) { view.setUint16(pos, data, true); pos += 2; }
  function setUint32(data: any) { view.setUint32(pos, data, true); pos += 4; }
  setUint32(0x46464952); setUint32(length - 8); setUint32(0x45564157);
  setUint32(0x20746d66); setUint32(16); setUint16(1); setUint16(numOfChan);
  setUint32(abuffer.sampleRate); setUint32(abuffer.sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2); setUint16(16);
  setUint32(0x61746164); setUint32(length - pos - 4);
  for(i = 0; i < abuffer.numberOfChannels; i++) channels.push(abuffer.getChannelData(i));
  while(pos < length) {
    for(i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF) | 0;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }
  return new Blob([buffer], {type: "audio/wav"});
}
