"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { motion, AnimatePresence } from "framer-motion";
import { Music2, Play, Trash2, Search, Clock, Headphones, Scissors, Plus, Upload } from "lucide-react";
import AudioCutterModal from "@/components/upload/AudioCutterModal";

export default function Home() {
  const router = useRouter();
  const { createSession } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCutterOpen, setIsCutterOpen] = useState(false);
  const [cutterFile, setCutterFile] = useState<File | null>(null);

  const sessions = useLiveQuery(() =>
    db.sessions.orderBy("updatedAt").reverse().toArray()
  );

  const filteredSessions = sessions?.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "audio/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const id = await createSession(file.name.replace(/\.[^/.]+$/, ""), file);
          router.push(`/session/${id}`);
        } catch (e) {
          console.error("Upload error:", e);
        }
      }
    };
    input.click();
  };

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this session?")) await db.sessions.delete(id);
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

      {/* ── Header / Nav ── */}
      <header style={{
        background: "white",
        borderBottom: "1.5px solid #e5e7eb",
        padding: "0 32px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
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
            <span style={{ fontWeight: 900, fontSize: 20, color: "#1e1b4b", letterSpacing: "-0.5px" }}>
              SANTHAI
            </span>
            <span style={{
              fontSize: 11, color: "#6d28d9", fontWeight: 700,
              background: "#ede9fe", borderRadius: 4,
              padding: "1px 6px", marginLeft: 8,
            }}>
              Studio
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={handleUpload}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 16px", borderRadius: 10,
              background: "#6d28d9", color: "white",
              border: "none", fontWeight: 700, fontSize: 13,
              cursor: "pointer", transition: "all 0.12s",
              boxShadow: "0 4px 12px rgba(109,40,217,0.2)",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#5b21b6")}
            onMouseLeave={e => (e.currentTarget.style.background = "#6d28d9")}
          >
            <Plus size={16} /> New Session
          </button>
          <button
            onClick={handleCutterClick}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 16px", borderRadius: 10,
              background: "#ede9fe", color: "#6d28d9",
              border: "1.5px solid #c4b5fd", fontWeight: 700, fontSize: 13,
              cursor: "pointer", transition: "all 0.12s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#ddd6fe")}
            onMouseLeave={e => (e.currentTarget.style.background = "#ede9fe")}
          >
            <Scissors size={16} /> Audio Cutter
          </button>
          <div style={{ width: 1, height: 24, background: "#e5e7eb", margin: "0 4px" }} />
          <div style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>
            {sessions?.length ?? 0} saved
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px", display: "flex", flexDirection: "column", gap: 40 }}>

        {/* ── Hero section ── */}
        <section style={{ textAlign: "center" }}>
          <h1 style={{ margin: 0, fontSize: 36, fontWeight: 900, color: "#111827", letterSpacing: "-0.8px" }}>
            Professional Audio Loop Studio
          </h1>
          <p style={{ margin: "12px 0 0", fontSize: 16, color: "#6b7280", maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}>
            The ultimate tool for Vedic chanting, mantra practice, and audio analysis.
            Create precision loops, adjust speeds, and master your segments.
          </p>
        </section>

        {/* ── Recent Sessions ── */}
        <section>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 20, gap: 16, flexWrap: "wrap",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Clock size={20} style={{ color: "#6d28d9" }} />
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111827" }}>
                My Sessions
              </h2>
            </div>

            <div style={{ position: "relative" }}>
              <Search size={15} style={{
                position: "absolute", left: 12, top: "50%",
                transform: "translateY(-50%)", color: "#9ca3af",
              }} />
              <input
                type="text"
                placeholder="Search sessions…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  paddingLeft: 36, paddingRight: 14,
                  paddingTop: 10, paddingBottom: 10,
                  border: "1.5px solid #e5e7eb",
                  borderRadius: 12, fontSize: 14,
                  outline: "none", background: "white",
                  color: "#111827", width: 280,
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                }}
                onFocus={e => (e.target.style.borderColor = "#6d28d9")}
                onBlur={e => (e.target.style.borderColor = "#e5e7eb")}
              />
            </div>
          </div>

          {/* Empty state */}
          {(!sessions || sessions.length === 0) && (
            <div style={{
              textAlign: "center",
              padding: "80px 32px",
              border: "2px dashed #e5e7eb",
              borderRadius: 24,
              background: "white",
            }}>
              <div style={{
                width: 72, height: 72,
                background: "#f5f3ff",
                borderRadius: 20,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px",
              }}>
                <Upload size={32} style={{ color: "#c4b5fd" }} />
              </div>
              <p style={{ margin: 0, fontWeight: 800, color: "#1e1b4b", fontSize: 18 }}>
                Start your practice
              </p>
              <p style={{ margin: "10px 0 24px", color: "#6b7280", fontSize: 15 }}>
                Upload an audio file to create your first session.
              </p>
              <button
                onClick={handleUpload}
                style={{
                    padding: "12px 24px", borderRadius: 12, background: "#6d28d9", color: "white",
                    border: "none", fontWeight: 700, fontSize: 15, cursor: "pointer",
                }}
              >
                Choose Audio File
              </button>
            </div>
          )}

          {/* Session grid */}
          {filteredSessions && filteredSessions.length > 0 && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 16,
            }}>
              <AnimatePresence mode="popLayout">
                {filteredSessions.map((session, i) => (
                  <motion.div
                    key={session.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => router.push(`/session/${session.id}`)}
                    style={{
                      background: "white",
                      border: "1.5px solid #e5e7eb",
                      borderRadius: 20,
                      padding: 24,
                      cursor: "pointer",
                      position: "relative",
                      overflow: "hidden",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "#6d28d9";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 30px -10px rgba(109,40,217,0.15)";
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "#e5e7eb";
                      (e.currentTarget as HTMLElement).style.boxShadow = "none";
                      (e.currentTarget as HTMLElement).style.transform = "none";
                    }}
                  >
                    <div style={{
                      position: "absolute", left: 0, top: 0, bottom: 0,
                      width: 5, background: "linear-gradient(180deg, #6d28d9, #2563eb)",
                    }} />

                    <div style={{ paddingLeft: 8 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{
                            margin: 0, fontWeight: 800, fontSize: 16,
                            color: "#1e1b4b",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {session.name}
                          </h3>
                          <p style={{ margin: "6px 0 0", fontSize: 12, color: "#9ca3af", fontWeight: 500 }}>
                            {new Date(session.updatedAt).toLocaleDateString(undefined, {
                              month: "long", day: "numeric", year: "numeric",
                            })}
                          </p>
                        </div>

                        <button
                          onClick={e => deleteSession(session.id, e)}
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            color: "#d1d5db", padding: 6, borderRadius: 8,
                            display: "flex", alignItems: "center",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#dc2626"; (e.currentTarget as HTMLElement).style.background = "#fee2e2"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#d1d5db"; (e.currentTarget as HTMLElement).style.background = "none"; }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div style={{ display: "flex", gap: 10, marginTop: 20, alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <div style={{
                            background: "#f5f3ff", color: "#6d28d9",
                            borderRadius: 8, padding: "4px 10px",
                            fontSize: 11, fontWeight: 800,
                            display: "flex", alignItems: "center", gap: 4,
                          }}>
                            {session.markers.length} Markers
                          </div>
                          <div style={{
                            background: "#eff6ff", color: "#1d4ed8",
                            borderRadius: 8, padding: "4px 10px",
                            fontSize: 11, fontWeight: 800,
                            display: "flex", alignItems: "center", gap: 4,
                          }}>
                            {session.regions.length} Regions
                          </div>
                        </div>

                        <div style={{
                          width: 32, height: 32, borderRadius: "50%",
                          background: "#6d28d9",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          boxShadow: "0 4px 8px rgba(109,40,217,0.3)",
                        }}>
                          <Play size={14} fill="white" color="white" style={{ marginLeft: 2 }} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </div>

      <AudioCutterModal
        isOpen={isCutterOpen}
        onClose={() => { setIsCutterOpen(false); setCutterFile(null); }}
        file={cutterFile}
      />
    </div>
  );
}
