"use client";

import React, { useState } from "react";
import { HelpCircle, X, BookOpen, MousePointer2, Keyboard, Repeat, Scissors, Music2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

const HelpSection = ({ icon: Icon, title, children }: { icon: any, title: string, children: React.ReactNode }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: "#f5f3ff", color: "#6d28d9", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={16} />
      </div>
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#1e1b4b" }}>{title}</h3>
    </div>
    <div style={{ paddingLeft: 38, fontSize: 13, color: "#4b5563", lineHeight: 1.5 }}>
      {children}
    </div>
  </div>
);

export default function HelpWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Only show on the home page
  if (pathname !== "/") return null;

  return (
    <>
      {/* THE MODAL (CENTERED INDEPENDENTLY) */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              style={{
                position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                background: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(8px)",
                zIndex: 9999
              }}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: "-50%", y: "-40%" }}
              animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
              exit={{ opacity: 0, scale: 0.9, x: "-50%", y: "-40%" }}
              style={{
                position: "fixed", top: "50%", left: "50%",
                width: "90%", maxWidth: 850, maxHeight: "85vh",
                background: "white", borderRadius: 32,
                boxShadow: "0 40px 100px rgba(0,0,0,0.4)",
                border: "1.5px solid #ede9fe",
                overflow: "hidden", display: "flex", flexDirection: "column",
                zIndex: 10000
              }}
            >
              {/* Header */}
              <div style={{ 
                padding: "32px 40px", background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
                color: "white", display: "flex", alignItems: "center", justifyContent: "space-between"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 48, height: 48, background: "rgba(255,255,255,0.1)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: "-0.5px" }}>The Ultimate Studio Guide</h2>
                    <p style={{ margin: 0, fontSize: 12, opacity: 0.7, fontWeight: 700, letterSpacing: 1 }}>MASTER EVERY FEATURE OF SANTHAI STUDIO</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div style={{ padding: "40px", overflowY: "auto", flex: 1, background: "#fff" }} className="hide-scrollbar">
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
                  
                  {/* Column 1 */}
                  <div>
                    <HelpSection icon={Music2} title="1. Dashboard & Sessions">
                      Your <b>Home Dashboard</b> is where you manage your practice library. 
                      <ul style={{ margin: "8px 0", paddingLeft: 18 }}>
                        <li><b>Search</b>: Use the search bar to quickly find specific sessions as your library grows.</li>
                        <li><b>Management</b>: Delete old sessions using the trash icon. Every session is stored 100% locally in your browser for privacy.</li>
                        <li><b>Try Demo</b>: Perfect for first-time users to see how a professional session looks.</li>
                      </ul>
                    </HelpSection>

                    <HelpSection icon={Scissors} title="2. The Audio Cutter">
                      Before starting a session, you can use the <b>Audio Cutter</b> to isolate a specific portion of a long audio file.
                      <ul style={{ margin: "8px 0", paddingLeft: 18 }}>
                        <li>Upload your file and drag the handles to select the "start" and "end" points.</li>
                        <li>Click <b>Crop & Start</b> to create a new session focused only on that segment. This is ideal for trimming long recordings or intros.</li>
                      </ul>
                    </HelpSection>

                    <HelpSection icon={MousePointer2} title="3. Waveform & Markers">
                      Precision is key to effective practice.
                      <ul style={{ margin: "8px 0", paddingLeft: 18 }}>
                        <li><b>Adding Markers</b>: Simply click anywhere on the waveform. A marker will appear, splitting the audio into practiceable regions.</li>
                        <li><b>Fine-Tuning</b>: Drag the marker handles left or right to align perfectly with the start of a mantra or verse.</li>
                        <li><b>Zooming</b>: Use the zoom slider to see the fine details of the waveform for perfect marker placement.</li>
                      </ul>
                    </HelpSection>

                    <HelpSection icon={Keyboard} title="4. Essential Shortcuts">
                      Master these keys to practice without touching the mouse:
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 12px", marginTop: 12, background: "#f9fafb", padding: 12, borderRadius: 12, border: "1px solid #f3f4f6" }}>
                        <div style={{ fontSize: 11 }}><b>Space</b>: Play / Pause</div>
                        <div style={{ fontSize: 11 }}><b>M</b>: Quick Marker</div>
                        <div style={{ fontSize: 11 }}><b>L</b>: Toggle Loop</div>
                        <div style={{ fontSize: 11 }}><b>← / →</b>: Seek 5s</div>
                        <div style={{ fontSize: 11 }}><b>+ / -</b>: Change Speed</div>
                        <div style={{ fontSize: 11 }}><b>Delete</b>: Remove Marker</div>
                      </div>
                    </HelpSection>
                  </div>

                  {/* Column 2 */}
                  <div>
                    <HelpSection icon={Repeat} title="5. Looping Practice System">
                      SANTHAI Studio's core power lies in its advanced looping sequence.
                      <ul style={{ margin: "8px 0", paddingLeft: 18 }}>
                        <li><b>Selection</b>: Use the checkboxes in the Region List to choose which parts you want to practice.</li>
                        <li><b>Individual Repeat</b>: Set a specific count for each region (e.g., repeat the first verse 10 times, the second 5 times).</li>
                        <li><b>Global Pass</b>: Determine how many times the <i>entire</i> selected sequence should run.</li>
                      </ul>
                    </HelpSection>

                    <HelpSection icon={CheckCircle2} title="6. Advanced Settings">
                      Fine-tune your session in the right sidebar:
                      <ul style={{ margin: "8px 0", paddingLeft: 18 }}>
                        <li><b>Playback Speed</b>: Slow down audio to 0.5x to catch every syllable of complex recitations.</li>
                        <li><b>Loop Gap</b>: Turn this ON to add a pause (0.5s to 10s) between repeats. This is critical for giving your brain time to process and repeat the mantra yourself.</li>
                        <li><b>Universal Repeat</b>: Turn this ON to override all region settings with a single global count (e.g., "Repeat everything 5 times").</li>
                      </ul>
                    </HelpSection>

                    <div style={{ background: "#f5f3ff", padding: 20, borderRadius: 20, border: "1.5px solid #ddd6fe" }}>
                      <h4 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 800, color: "#5b21b6" }}>Pro Practice Tip 💡</h4>
                      <p style={{ margin: 0, fontSize: 12, color: "#6d28d9", lineHeight: 1.6 }}>
                        Start by setting the <b>Playback Speed</b> to 0.75x and the <b>Loop Gap</b> to 2 seconds. This gives you plenty of time to hear the audio clearly and recite it back during the pause. As you improve, increase the speed and shorten the gap!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: "24px 40px", background: "#f9fafb", borderTop: "1.5px solid #ede9fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 8, height: 8, background: "#10b981", borderRadius: "50%" }} />
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1e1b4b" }}>Ready to master your practice? Close this guide and start exploring!</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* THE BUTTON (IN CORNER) */}
      <div style={{ position: "fixed", bottom: 24, left: 24, zIndex: 1000, fontFamily: "inherit" }}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
            color: "white", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 10px 25px rgba(30,27,75,0.3)",
            position: "relative"
          }}
        >
          <HelpCircle size={28} />
        </motion.button>
      </div>
    </>
  );
}
