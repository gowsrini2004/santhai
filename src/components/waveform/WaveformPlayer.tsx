"use client";

import { useRef } from "react";
import { useWaveSurfer } from "@/hooks/useWaveSurfer";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useSessionStore } from "@/store/useSessionStore";
import { formatTime } from "@/lib/timeUtils";
import { ZoomIn, ZoomOut, MapPin, RotateCcw } from "lucide-react";

export default function WaveformPlayer() {
  const containerRef = useRef<HTMLDivElement>(null!);
  const { currentSession, isReady, zoom, setZoom, currentTime, duration, addMarker } = useSessionStore();
  const audioUrl = currentSession?.audioUrl || null;

  const { wavesurfer } = useWaveSurfer(containerRef, audioUrl);
  useAudioEngine(wavesurfer);
  useKeyboardShortcuts(wavesurfer);

  const markers = currentSession?.markers ?? [];

  const isFitToScreen = zoom === 0;
  
  // Important: Calculate total width based on duration and zoom (min pixels per second)
  const totalWidth = isFitToScreen ? "100%" : `${duration * zoom}px`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: "100%" }}>
      {/* 
        The outer Waveform Box is the fixed-width 'porthole'.
        It must have overflow: hidden to keep the scrollable content inside.
      */}
      <div
        style={{
          background: "#f5f3ff",
          border: "1.5px solid #c4b5fd",
          borderRadius: 20,
          position: "relative",
          overflow: "hidden", 
          height: 150,
          width: "100%",
        }}
      >
        {/* Loading overlay */}
        {!isReady && currentSession && (
          <div style={{
            position: "absolute", inset: 0, display: "flex",
            flexDirection: "column", alignItems: "center", justifyContent: "center",
            background: "rgba(245,243,255,0.9)", zIndex: 50,
          }}>
            <div className="animate-spin" style={{
              width: 28, height: 28, border: "3px solid #c4b5fd",
              borderTop: "3px solid #6d28d9", borderRadius: "50%",
            }} />
          </div>
        )}

        {/* 
            Scrollable Layer: This is the container that actually scrolls.
            Its child (the content) can be as wide as it wants.
        */}
        <div 
            style={{ 
                width: "100%",
                height: "100%",
                overflowX: "auto", 
                overflowY: "hidden",
                position: "relative"
            }}
        >
            {/* 
                The Content: This is the div that scales. 
                We use min-width: 100% to ensure it fills the box when fit-to-screen.
            */}
            <div 
                style={{ 
                    position: "relative", 
                    width: isFitToScreen ? "100%" : totalWidth,
                    minWidth: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center"
                }}
            >
                {/* 
                    WaveSurfer Container: We MUST tell WaveSurfer to be 100% of this parent.
                    If the parent is 120,000px, WaveSurfer will render at that width.
                */}
                <div ref={containerRef} style={{ width: "100%", minWidth: "100%" }} />

                {/* Markers: Positioned relative to this scaled content */}
                {isReady && duration > 0 && markers.map((marker) => {
                    const leftPos = isFitToScreen 
                        ? `${(marker.time / duration) * 100}%` 
                        : `${marker.time * zoom}px`;
                    
                    return (
                        <div
                            key={marker.id}
                            style={{
                                position: "absolute",
                                top: 0,
                                bottom: 0,
                                left: leftPos,
                                width: 2,
                                background: "#6d28d9",
                                zIndex: 10,
                                pointerEvents: "none",
                            }}
                        >
                            <div style={{
                                position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
                                width: 10, height: 10, borderRadius: "50%", background: "#6d28d9",
                                border: "2px solid white", boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                                pointerEvents: "none", cursor: "default",
                            }} title={marker.label} />
                            
                            <div style={{
                                position: "absolute", top: 22, left: 6,
                                background: "#6d28d9", color: "white",
                                fontSize: 10, fontWeight: 800, padding: "2px 6px",
                                borderRadius: 5, whiteSpace: "nowrap",
                                boxShadow: "0 4px 8px rgba(109,40,217,0.2)",
                            }}>
                                {marker.label}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>

      {/* Control Bar */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", padding: "0 4px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: "monospace", fontSize: 14, color: "#1e1b4b", fontWeight: 800 }}>
                {formatTime(currentTime)}
            </span>
            <button
              onClick={() => addMarker({ id: Math.random().toString(36).slice(2,9), time: currentTime, label: `M${markers.length + 1}` })}
              disabled={!isReady}
              style={{
                  background: !isReady ? "#e5e7eb" : "#6d28d9", 
                  color: !isReady ? "#9ca3af" : "white", 
                  borderRadius: 10, padding: "6px 14px", fontSize: 12, fontWeight: 800,
                  border: "none", 
                  cursor: !isReady ? "not-allowed" : "pointer", 
                  display: "flex", alignItems: "center", gap: 6,
                  boxShadow: !isReady ? "none" : "0 4px 10px rgba(109,40,217,0.2)",
              }}
            >
                <MapPin size={14} /> Add Marker
            </button>
        </div>

        {/* Zoom Controls */}
        <div style={{ 
            display: "flex", alignItems: "center", gap: 4, 
            background: "#f3f4f6", borderRadius: 12, padding: "3px" 
        }}>
          <button
            onClick={() => setZoom(Math.max(0, zoom - 20))}
            disabled={zoom === 0}
            style={{
              background: "none", border: "none", padding: "6px", 
              cursor: zoom === 0 ? "not-allowed" : "pointer",
              color: zoom === 0 ? "#9ca3af" : "#6d28d9",
            }}
          >
            <ZoomOut size={16} />
          </button>
          
          <button
            onClick={() => setZoom(0)}
            style={{
              background: isFitToScreen ? "white" : "transparent",
              border: "none", borderRadius: 8, padding: "6px 12px",
              cursor: "pointer", color: "#6d28d9", fontSize: 11, fontWeight: 800,
              display: "flex", alignItems: "center", gap: 4,
              boxShadow: isFitToScreen ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
            }}
          >
            <RotateCcw size={14} /> Fit
          </button>

          <button
            onClick={() => setZoom(zoom === 0 ? 20 : Math.min(400, zoom + 20))}
            style={{
              background: "none", border: "none", padding: "6px", 
              cursor: "pointer", color: "#6d28d9",
            }}
          >
            <ZoomIn size={16} />
          </button>
        </div>

        <span style={{ fontFamily: "monospace", fontSize: 13, color: "#6b7280", fontWeight: 700 }}>
          {formatTime(duration)}
        </span>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
