"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, X, Bug, Heart, Send, Paperclip } from "lucide-react";
import { useSessionStore } from "@/store/useSessionStore";

export default function FeedbackWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"bug" | "feedback" | null>(null);
  
  // Show ONLY on the home page, hide in sessions
  const isHomePage = pathname === "/";

  const [subjectText, setSubjectText] = useState("");
  const [message, setMessage] = useState("");
  const [showHint, setShowHint] = useState(false);
  const { setNotification } = useSessionStore();

  useEffect(() => {
    if (!isHomePage) return;
    // Show hint after 2 seconds on load
    const timer = setTimeout(() => setShowHint(true), 2000);
    // Hide hint after 10 seconds
    const hideTimer = setTimeout(() => setShowHint(false), 10000);
    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, [isHomePage]);

  if (!isHomePage) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // VALIDATION
    if (mode === "bug") {
      if (!subjectText || !message) {
        setNotification({ message: "Please provide both a subject and a description for the bug report.", type: "error" });
        return;
      }
    } else {
      if (!message) {
        setNotification({ message: "Please provide your feedback message.", type: "error" });
        return;
      }
    }

    const emailSubject = mode === "bug" 
      ? `🚨 [BUG REPORT] - ${subjectText}` 
      : `✨ [FEEDBACK] - SANTHAI STUDIO`;
    
    const body = `Type: ${mode === "bug" ? "Bug Report" : "Feedback"}\n${mode === "bug" ? `Subject: ${subjectText}\n` : ""}Message:\n${message}`;
    
    // Direct Gmail Web Compose URL
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=gowsrini2004@gmail.com&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(body)}`;
    
    // Open in new tab
    window.open(gmailUrl, '_blank');

    setNotification({ 
      message: mode === "bug" ? "Opening Gmail to send bug report..." : "Opening Gmail to send feedback...", 
      type: "info" 
    });

    // Reset and close
    setTimeout(() => {
      setIsOpen(false);
      setMode(null);
      setMessage("");
      setSubjectText("");
    }, 1000);
  };

  return (
    <div style={{ position: "fixed", bottom: 24, left: 24, zIndex: 1000 }}>
      {/* Hint Bubble */}
      {showHint && !isOpen && (
        <div style={{
          position: "absolute", bottom: 70, left: 0,
          background: "white", color: "#1e1b4b", padding: "8px 14px",
          borderRadius: "16px 16px 16px 4px", fontSize: 12, fontWeight: 700,
          boxShadow: "0 10px 25px rgba(0,0,0,0.15)", whiteSpace: "nowrap",
          border: "1.5px solid #6d28d9", animation: "bounce 2s infinite"
        }}>
          Help us improve! ✨
          <div style={{
            position: "absolute", bottom: -6, left: 10,
            width: 10, height: 10, background: "white",
            borderRight: "1.5px solid #6d28d9", borderBottom: "1.5px solid #6d28d9",
            transform: "rotate(45deg)"
          }} />
        </div>
      )}

      {/* Main Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setShowHint(false);
        }}
        style={{
          width: 56, height: 56, borderRadius: "50%",
          background: isOpen ? "#1e1b4b" : "#6d28d9",
          color: "white", border: "none", cursor: "pointer",
          boxShadow: "0 8px 20px rgba(109,40,217,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          transform: isOpen ? "rotate(90deg)" : "none"
        }}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Chat Drawer */}
      {isOpen && (
        <div style={{
          position: "absolute", bottom: 70, left: 0,
          width: 340, background: "white", borderRadius: 24,
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          border: "1.5px solid #e5e7eb", overflow: "hidden",
          animation: "slideUp 0.3s ease-out"
        }}>
          {/* Header only for non-feedback mode or main menu */}
          {(!mode || mode === "bug") && (
            <div style={{ 
              padding: "20px 20px 10px", background: "linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%)",
              color: "white"
            }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Feedback Center</h3>
              <p style={{ margin: "4px 0 0", fontSize: 11, opacity: 0.8, fontWeight: 600 }}>We'd love to hear from you!</p>
            </div>
          )}

          {!mode ? (
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <button
                onClick={() => setMode("bug")}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "14px",
                  borderRadius: 16, background: "#fef2f2", color: "#991b1b",
                  border: "1.5px solid #fee2e2", cursor: "pointer", fontWeight: 700,
                  textAlign: "left", transition: "all 0.2s"
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#ef4444", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Bug size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 14 }}>Report a Bug</div>
                  <div style={{ fontSize: 10, opacity: 0.7 }}>Something is broken</div>
                </div>
              </button>

              <button
                onClick={() => setMode("feedback")}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "14px",
                  borderRadius: 16, background: "#f0fdf4", color: "#166534",
                  border: "1.5px solid #dcfce7", cursor: "pointer", fontWeight: 700,
                  textAlign: "left", transition: "all 0.2s"
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#22c55e", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Heart size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 14 }}>Give Feedback</div>
                  <div style={{ fontSize: 10, opacity: 0.7 }}>Share your thoughts</div>
                </div>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ padding: mode === "feedback" ? "20px 20px 20px" : "20px", display: "flex", flexDirection: "column", gap: 12 }}>
              {mode === "feedback" && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                   <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#f0fdf4", color: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Heart size={16} fill="currentColor" />
                   </div>
                   <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#166534" }}>Share your feedback</h4>
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginBottom: 2 }}>
                <button 
                  type="button" 
                  onClick={() => { setMode(null); setSubjectText(""); setMessage(""); }}
                  style={{ background: "none", border: "none", color: "#6d28d9", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                >
                  Change Type
                </button>
              </div>

              {mode === "bug" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 10, fontWeight: 800, color: "#ef4444", marginLeft: 4 }}>SUBJECT (REQUIRED)</label>
                  <input
                    autoFocus
                    required
                    placeholder="e.g. Loop skipping in Region 1"
                    value={subjectText}
                    onChange={(e) => setSubjectText(e.target.value)}
                    style={{
                      width: "100%", borderRadius: 12, padding: "12px",
                      border: "1.5px solid #e5e7eb", fontSize: 13, outline: "none",
                      background: "#f9fafb"
                    }}
                  />
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 10, fontWeight: 800, color: mode === "bug" ? "#ef4444" : "#22c55e", marginLeft: 4 }}>
                   {mode === "bug" ? "DESCRIPTION (REQUIRED)" : "YOUR MESSAGE (REQUIRED)"}
                </label>
                <textarea
                  autoFocus={mode === "feedback"}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={mode === "bug" ? "Explain what happened..." : "Share your suggestions..."}
                  style={{
                    width: "100%", height: 120, borderRadius: 14, padding: 12,
                    border: "1.5px solid #e5e7eb", fontSize: 13, resize: "none",
                    outline: "none", fontFamily: "inherit", background: "#f9fafb"
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={mode === "bug" ? (!subjectText || !message) : !message}
                style={{
                  marginTop: 4,
                  width: "100%", padding: "14px", borderRadius: 16,
                  background: (mode === "bug" ? (!subjectText || !message) : !message) ? "#e5e7eb" : "#6d28d9",
                  color: (mode === "bug" ? (!subjectText || !message) : !message) ? "#9ca3af" : "white",
                  border: "none",
                  fontWeight: 800, fontSize: 14, 
                  cursor: (mode === "bug" ? (!subjectText || !message) : !message) ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  boxShadow: (mode === "bug" ? (!subjectText || !message) : !message) ? "none" : "0 8px 20px rgba(109,40,217,0.2)",
                  transition: "all 0.2s"
                }}
              >
                <div style={{ width: 20, height: 20, background: "white", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                   <img src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" style={{ width: 14 }} alt="Gmail" />
                </div>
                Open in Gmail
              </button>
            </form>
          )}
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
