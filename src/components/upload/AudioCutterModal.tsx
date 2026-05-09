"use client";

import { useState, useRef, useEffect } from "react";
import WaveSurfer from "wavesurfer.js";
import { X, Scissors, Save, Play, Pause, MapPin, Trash2, Clock, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { formatTime } from "@/lib/timeUtils";
import { useSession } from "@/hooks/useSession";

interface AudioCutterModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  defaultFolderId: string | null;
}

export default function AudioCutterModal({ isOpen, onClose, file, defaultFolderId }: AudioCutterModalProps) {
  const containerRef = useRef<HTMLDivElement>(null!);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [markers, setMarkers] = useState<{ id: string; time: number }[]>([]);
  const [partNames, setPartNames] = useState<string[]>(["Part 1"]);
  const [isExporting, setIsExporting] = useState(false);
  const [zoom, setZoom] = useState(0); 
  const [saveToFolder, setSaveToFolder] = useState<"current" | "new">("current");
  const [newFolderName, setNewFolderName] = useState("");
  const { createSession, createFolder } = useSession();

  useEffect(() => {
    if (!isOpen || !file || !containerRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#c4b5fd",
      progressColor: "#6d28d9",
      cursorColor: "#6d28d9",
      barWidth: 2,
      barGap: 3,
      height: 100,
      url: URL.createObjectURL(file),
      minPxPerSec: zoom > 0 ? zoom : 0,
    });

    ws.on("ready", () => {
        setDuration(ws.getDuration());
        wavesurfer.current = ws;
    });
    ws.on("play", () => setIsPlaying(true));
    ws.on("pause", () => setIsPlaying(false));
    ws.on("timeupdate", (time) => setCurrentTime(time));

    return () => ws.destroy();
  }, [isOpen, file]);

  // Sync zoom changes to WaveSurfer
  useEffect(() => {
    if (wavesurfer.current) {
        wavesurfer.current.setOptions({ minPxPerSec: zoom });
    }
  }, [zoom]);

  const addMarker = () => {
    // Prevent cutting in the first 0.5s or last 0.5s of the audio track
    const threshold = 0.5;
    if (currentTime < threshold) {
      alert("Cannot split too close to the beginning of the audio track!");
      return;
    }
    if (currentTime > duration - threshold) {
      alert("Cannot split too close to the end of the audio track!");
      return;
    }

    const newMarker = {
      id: Math.random().toString(36).substr(2, 9),
      time: currentTime,
    };
    const newMarkers = [...markers, newMarker].sort((a, b) => a.time - b.time);
    setMarkers(newMarkers);
    
    const newNames = [...partNames];
    while (newNames.length < newMarkers.length + 1) {
        newNames.push(`Part ${newNames.length + 1}`);
    }
    setPartNames(newNames);
  };

  const removeMarker = (id: string) => {
    const idx = markers.findIndex(m => m.id === id);
    const newMarkers = markers.filter(m => m.id !== id);
    setMarkers(newMarkers);
    
    const newNames = [...partNames];
    newNames.splice(idx + 1, 1);
    setPartNames(newNames);
  };

  const updatePartName = (index: number, name: string) => {
    const newNames = [...partNames];
    newNames[index] = name;
    setPartNames(newNames);
  };

  const playPart = (start: number, end: number) => {
    if (!wavesurfer.current) return;
    wavesurfer.current.setTime(start);
    wavesurfer.current.play();
    
    const checkEnd = (time: number) => {
        if (time >= end) {
            wavesurfer.current?.pause();
            wavesurfer.current?.un("timeupdate", checkEnd);
        }
    };
    wavesurfer.current.on("timeupdate", checkEnd);
  };

  const exportCuts = async () => {
    if (!file || markers.length === 0 || !wavesurfer.current) return;
    setIsExporting(true);

    try {
      let targetFolderId = defaultFolderId;

      if (saveToFolder === "new") {
        const folderName = newFolderName.trim() || "New Sessions Folder";
        targetFolderId = await createFolder(folderName, defaultFolderId);
      }

      const arrayBuffer = await file.arrayBuffer();
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);

      const points = [0, ...markers.map(m => m.time), duration];
      
      for (let i = 0; i < points.length - 1; i++) {
          const start = points[i];
          const end = points[i+1];
          if (end - start < 0.1) continue;

          const sliceLength = Math.floor((end - start) * decodedBuffer.sampleRate);
          const offlineCtx = new OfflineAudioContext(
              decodedBuffer.numberOfChannels,
              sliceLength,
              decodedBuffer.sampleRate
          );

          const source = offlineCtx.createBufferSource();
          source.buffer = decodedBuffer;
          source.connect(offlineCtx.destination);
          source.start(0, start, end - start);

          const renderedBuffer = await offlineCtx.startRendering();
          const wavBlob = bufferToWav(renderedBuffer);
          const label = partNames[i]?.trim() || `Part ${i + 1}`;
          await createSession(label, new File([wavBlob], `${label}.wav`, { type: 'audio/wav' }), targetFolderId);
      }

      onClose();
    } catch (e) {
      console.error("Export failed", e);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  const points = [0, ...markers.map(m => m.time), duration];
  const parts = [];
  for (let i = 0; i < points.length - 1; i++) {
    parts.push({
      start: points[i],
      end: points[i+1],
      label: partNames[i] ?? `Part ${i + 1}`,
      markerId: i > 0 ? markers[i-1].id : null
    });
  }

  const isFit = zoom === 0;
  const totalWidth = isFit ? "100%" : `${duration * zoom}px`;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(30,27,75,0.4)",
      backdropFilter: "blur(8px)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        background: "white", borderRadius: 24, width: "100%", maxWidth: 900,
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", overflow: "hidden",
        display: "flex", flexDirection: "column", maxHeight: "95vh"
      }}>
        {/* Header */}
        <div style={{ padding: "16px 24px", borderBottom: "1.5px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: "#6d28d9", padding: 8, borderRadius: 10 }}>
              <Scissors size={20} color="white" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1e1b4b" }}>Audio Cutter</h2>
              <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>Split & Export Sessions</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, minHeight: 0 }}>
          
          <div style={{ 
            background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 20, 
            overflow: "hidden", position: "relative", height: 140, marginBottom: 12,
            width: "100%", minWidth: 0
          }}>
             <div style={{ overflowX: "auto", height: "100%", width: "100%", position: "relative" }}>
                <div style={{ width: totalWidth, minWidth: "100%", height: "100%", position: "relative", display: "flex", alignItems: "center" }}>
                    <div ref={containerRef} style={{ width: "100%", minWidth: "100%" }} />
                    {duration > 0 && markers.map(m => {
                      const leftPos = isFit ? `${(m.time / duration) * 100}%` : `${m.time * zoom}px`;
                      return (
                        <div key={m.id} style={{
                          position: "absolute", top: 0, bottom: 0, left: leftPos,
                          width: 2, background: "#ef4444", zIndex: 10, pointerEvents: "none"
                        }}>
                          <div style={{
                            position: "absolute", top: 4, left: "50%", transform: "translateX(-50%)",
                            width: 8, height: 8, borderRadius: "50%", background: "#ef4444",
                            border: "2px solid white", boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                          }} />
                        </div>
                      );
                    })}
                </div>
             </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
             <button
              onClick={() => wavesurfer.current?.playPause()}
              style={{
                width: 40, height: 40, borderRadius: "50%", background: "#6d28d9", color: "white",
                border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {isPlaying ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" style={{ marginLeft: 2 }} />}
            </button>
            <div style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 16, color: "#1e1b4b", minWidth: 140 }}>
              {formatTime(currentTime)} <span style={{ color: "#9ca3af", fontWeight: 500 }}>/ {formatTime(duration)}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#f3f4f6", padding: 4, borderRadius: 12 }}>
                <button onClick={() => setZoom(Math.max(0, zoom - 50))} style={{ padding: 6, border: "none", background: "none", cursor: "pointer", color: "#6d28d9" }}><ZoomOut size={16}/></button>
                <button onClick={() => setZoom(0)} style={{ padding: "4px 10px", border: "none", background: isFit ? "white" : "none", borderRadius: 8, fontSize: 11, fontWeight: 800, color: "#6d28d9", cursor: "pointer", boxShadow: isFit ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}><RotateCcw size={14}/> Fit</button>
                <button onClick={() => setZoom(zoom === 0 ? 50 : Math.min(600, zoom + 100))} style={{ padding: 6, border: "none", background: "none", cursor: "pointer", color: "#6d28d9" }}><ZoomIn size={16}/></button>
            </div>

            <button
              onClick={addMarker}
              style={{
                marginLeft: "auto", padding: "10px 20px", borderRadius: 12, background: "#6d28d9",
                color: "white", fontWeight: 800, fontSize: 14,
                border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                boxShadow: "0 4px 12px rgba(109,40,217,0.2)"
              }}
            >
              <MapPin size={18} /> Split Here
            </button>
          </div>

          <div style={{ background: "#f9fafb", borderRadius: 20, padding: 4, border: "1.5px solid #e5e7eb" }}>
               <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 4px" }}>
                 <thead>
                   <tr>
                     <th style={{ padding: "8px 16px", fontSize: 10, color: "#9ca3af", textAlign: "left", textTransform: "uppercase" }}>Name</th>
                     <th style={{ padding: "8px 16px", fontSize: 10, color: "#9ca3af", textAlign: "left", textTransform: "uppercase" }}>Interval</th>
                     <th style={{ padding: "8px 16px", fontSize: 10, color: "#9ca3af", textAlign: "right" }}>Preview</th>
                   </tr>
                 </thead>
                 <tbody>
                    {parts.map((p, idx) => (
                      <tr key={idx} style={{ background: "white" }}>
                        <td style={{ padding: "8px 16px", borderRadius: "12px 0 0 12px" }}>
                          <input
                            value={partNames[idx] || ""}
                            placeholder={`Part ${idx + 1}`}
                            onChange={e => updatePartName(idx, e.target.value)}
                            style={{ 
                              border: "none", background: "#f3f4f6", borderRadius: 8,
                              padding: "8px 12px", fontWeight: 800, fontSize: 14, color: "#1e1b4b", 
                              outline: "none", width: "100%"
                            }}
                          />
                        </td>
                        <td style={{ padding: "8px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "#6d28d9" }}>
                            {formatTime(p.start)} → {formatTime(p.end)}
                          </div>
                        </td>
                        <td style={{ padding: "8px 16px", textAlign: "right", borderRadius: "0 12px 12px 0" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                             <button 
                              onClick={() => playPart(p.start, p.end)}
                              style={{ 
                                background: "#ede9fe", color: "#6d28d9", border: "none", 
                                borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 800, cursor: "pointer"
                              }}
                            >
                              Play
                            </button>
                            {p.markerId && (
                                <button 
                                onClick={() => removeMarker(p.markerId!)} 
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#fca5a5", padding: 4 }}
                                >
                                <Trash2 size={18} />
                                </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                 </tbody>
               </table>
          </div>
        </div>

        <div style={{ 
          padding: "16px 24px", background: "#f9fafb", borderTop: "1.5px solid #f3f4f6", 
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" 
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
             <div style={{ display: "flex", background: "#f3f4f6", padding: 4, borderRadius: 12 }}>
                <button 
                  onClick={() => setSaveToFolder("current")}
                  style={{
                    padding: "6px 12px", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700,
                    background: saveToFolder === "current" ? "white" : "transparent",
                    color: saveToFolder === "current" ? "#6d28d9" : "#6b7280",
                    cursor: "pointer", boxShadow: saveToFolder === "current" ? "0 2px 4px rgba(0,0,0,0.05)" : "none"
                  }}
                >
                  Current View
                </button>
                <button 
                  onClick={() => setSaveToFolder("new")}
                  style={{
                    padding: "6px 12px", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700,
                    background: saveToFolder === "new" ? "white" : "transparent",
                    color: saveToFolder === "new" ? "#6d28d9" : "#6b7280",
                    cursor: "pointer", boxShadow: saveToFolder === "new" ? "0 2px 4px rgba(0,0,0,0.05)" : "none"
                  }}
                >
                  In New Folder
                </button>
             </div>
             {saveToFolder === "new" && (
                <input 
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name..."
                  style={{
                    padding: "8px 12px", borderRadius: 10, border: "1.5px solid #e5e7eb",
                    fontSize: 13, fontWeight: 600, outline: "none", width: 180
                  }}
                />
             )}
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={onClose} style={{ padding: "10px 24px", borderRadius: 12, border: "1.5px solid #e5e7eb", background: "white", fontWeight: 700, cursor: "pointer", color: "#6b7280" }}>
              Cancel
            </button>
            <button
              onClick={exportCuts}
              disabled={markers.length === 0 || isExporting}
              style={{
                padding: "10px 24px", borderRadius: 12, border: "none",
                background: isExporting ? "#e5e7eb" : "#6d28d9",
                color: "white", fontWeight: 800, fontSize: 14, cursor: isExporting ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 8,
                boxShadow: "0 4px 12px rgba(109,40,217,0.2)"
              }}
            >
              <Save size={18} /> {isExporting ? "Processing..." : "Create Sessions"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// WAV helper (runs instantaneously inside browser)
function bufferToWav(abuffer: AudioBuffer) {
  let numOfChan = abuffer.numberOfChannels;
  let length = abuffer.length * numOfChan * 2 + 44;
  let buffer = new ArrayBuffer(length);
  let view = new DataView(buffer);
  let channels = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

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
