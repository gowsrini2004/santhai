"use client";

import { useState, useCallback } from "react";
import { Upload, Music, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DropZoneProps {
  onUpload: (file: File) => void;
  isUploading?: boolean;
}

export default function DropZone({ onUpload, isUploading }: DropZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith("audio/") || file.name.endsWith(".m4a"))) {
      onUpload(file);
    }
  }, [onUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  }, [onUpload]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => !isUploading && document.getElementById("audio-upload")?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="cursor-pointer"
      style={{
        border: `2px dashed ${isDragActive ? "#6d28d9" : "#c4b5fd"}`,
        borderRadius: 20,
        background: isDragActive ? "#ede9fe" : "#f5f3ff",
        padding: "48px 32px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
        transition: "all 0.2s",
        userSelect: "none",
      }}
    >
      <input
        type="file"
        id="audio-upload"
        className="hidden"
        accept="audio/*,.m4a"
        onChange={handleFileInput}
      />

      <div style={{
        width: 72,
        height: 72,
        borderRadius: 20,
        background: isDragActive ? "#6d28d9" : "white",
        border: "2px solid #c4b5fd",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s",
        boxShadow: "0 4px 16px rgba(109,40,217,0.1)",
      }}>
        {isUploading
          ? <Loader2 size={32} style={{ color: "#6d28d9", animation: "spin 1s linear infinite" }} />
          : <Music size={32} style={{ color: isDragActive ? "white" : "#6d28d9" }} />
        }
      </div>

      <div style={{ textAlign: "center" }}>
        <p style={{ fontWeight: 700, fontSize: 18, color: "#1e1b4b", margin: 0 }}>
          {isUploading ? "Uploading..." : isDragActive ? "Drop to upload" : "Upload Audio"}
        </p>
        <p style={{ color: "#6b7280", fontSize: 14, marginTop: 6 }}>
          Drag & drop or click to browse — MP3, WAV, M4A
        </p>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {["MP3", "WAV", "M4A"].map(fmt => (
          <span key={fmt} style={{
            background: "white",
            border: "1.5px solid #c4b5fd",
            color: "#6d28d9",
            borderRadius: 8,
            padding: "3px 10px",
            fontSize: 12,
            fontWeight: 600,
          }}>{fmt}</span>
        ))}
      </div>
    </motion.div>
  );
}
