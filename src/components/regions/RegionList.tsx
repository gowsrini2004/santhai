"use client";

import { useSessionStore } from "@/store/useSessionStore";
import { formatTime, formatDuration } from "@/lib/timeUtils";
import { Check, Repeat, Edit2, Trash2, Play } from "lucide-react";
import { useState } from "react";
import { getWaveSurferInstance } from "@/lib/wavesurferInstance";

const REPEAT_OPTIONS: number[] = [1, 2, 3, 5];

export default function RegionList() {
  const {
    currentSession,
    selectedRegionIds,
    setSelectedRegionIds,
    loopMode,
    setLoopMode,
    updateRegion,
    removeMarker,
  } = useSessionStore();

  const [editingRegionId, setEditingRegionId] = useState<string | null>(null);
  const [editRegionLabel, setEditRegionLabel] = useState("");

  if (!currentSession || currentSession.regions.length === 0) {
    return (
      <div style={{
        border: "1.5px dashed #c4b5fd",
        borderRadius: 16,
        padding: "32px 24px",
        textAlign: "center",
        color: "#9ca3af",
        fontSize: 14,
        background: "#faf9ff",
      }}>
        No regions yet — add markers to create segments
      </div>
    );
  }

  const toggleRegion = (id: string) => {
    if (editingRegionId) return; // Prevent selection when editing
    const next = selectedRegionIds.includes(id)
      ? selectedRegionIds.filter(r => r !== id)
      : [...selectedRegionIds, id];
    setSelectedRegionIds(next);
    if (next.length > 0 && loopMode === "off") setLoopMode("single");
    if (next.length === 0) setLoopMode("off");
  };

  const handleEditSave = (id: string) => {
    if (editRegionLabel.trim()) {
      updateRegion(id, { label: editRegionLabel.trim() });
    }
    setEditingRegionId(null);
  };

  const deleteRegion = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (!currentSession) return;
    const markers = currentSession.markers;
    if (markers.length === 0) return;
    
    // A region is formed between markers (or 0 and duration).
    // To delete a region, we delete the marker that separates it.
    // Usually, this is the marker that ends the region (index).
    // If it's the last region, we delete the marker that starts it (index - 1).
    const markerIndexToDelete = index === currentSession.regions.length - 1 ? index - 1 : index;
    if (markers[markerIndexToDelete]) {
      removeMarker(markers[markerIndexToDelete].id);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 4px",
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1e1b4b" }}>
            Regions
          </h3>
          <p style={{ margin: 0, fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
            {currentSession.regions.length} segment{currentSession.regions.length !== 1 ? "s" : ""} — click to select for looping
          </p>
        </div>
        {selectedRegionIds.length > 0 && (
          <button
            onClick={() => { setSelectedRegionIds([]); setLoopMode("off"); }}
            style={{
              background: "#fee2e2", color: "#dc2626",
              border: "1.5px solid #fca5a5",
              borderRadius: 8, padding: "5px 12px",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}
          >
            Clear selection
          </button>
        )}
      </div>

      {/* Region cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
        {currentSession.regions.map((region, index) => {
          const selected = selectedRegionIds.includes(region.id);
          return (
            <div
              key={region.id}
              onClick={() => toggleRegion(region.id)}
              style={{
                border: `2px solid ${selected ? "#6d28d9" : "#e5e7eb"}`,
                borderRadius: 14,
                padding: "14px 16px",
                background: selected ? "#ede9fe" : "white",
                cursor: "pointer",
                transition: "all 0.15s",
                position: "relative",
                userSelect: "none",
              }}
              onMouseEnter={e => !selected && ((e.currentTarget as HTMLElement).style.borderColor = "#c4b5fd")}
              onMouseLeave={e => !selected && ((e.currentTarget as HTMLElement).style.borderColor = "#e5e7eb")}
            >
              {/* Check badge */}
              {selected && (
                <div style={{
                  position: "absolute", top: 12, right: 12,
                  width: 22, height: 22, borderRadius: "50%",
                  background: "#6d28d9", display: "flex",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <Check size={12} color="white" strokeWidth={3} />
                </div>
              )}

              {/* Region number badge + name */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); getWaveSurferInstance()?.setTime(region.start); getWaveSurferInstance()?.play(); }}
                  style={{
                    background: selected ? "#6d28d9" : "#f3f4f6",
                    color: selected ? "white" : "#6b7280",
                    width: 28, height: 28, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: "none", cursor: "pointer",
                    fontSize: 12, fontWeight: 800, flexShrink: 0,
                    transition: "all 0.15s",
                  }}
                  title="Play this region"
                >
                  <Play size={12} fill="currentColor" />
                </button>

                {editingRegionId === region.id ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }} onClick={e => e.stopPropagation()}>
                    <input 
                      autoFocus
                      value={editRegionLabel}
                      onChange={e => setEditRegionLabel(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleEditSave(region.id)}
                      onBlur={() => handleEditSave(region.id)}
                      style={{
                        width: "100%", padding: "2px 6px", borderRadius: 4, border: "1.5px solid #6d28d9", 
                        fontSize: 14, fontWeight: 700, color: "#1e1b4b", outline: "none",
                      }}
                    />
                  </div>
                ) : (
                  <span style={{
                    fontWeight: 700, fontSize: 14,
                    color: selected ? "#4c1d95" : "#1e1b4b",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    flex: 1,
                  }}>
                    {region.label}
                  </span>
                )}
                
                {/* Actions */}
                {!editingRegionId && (
                  <div style={{ display: "flex", gap: 4 }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditRegionLabel(region.label); setEditingRegionId(region.id); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: selected ? "#6d28d9" : "#9ca3af", padding: 4 }}
                    >
                      <Edit2 size={14} />
                    </button>
                    {currentSession.regions.length > 1 && (
                      <button 
                        onClick={(e) => deleteRegion(e, index)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: selected ? "#6d28d9" : "#9ca3af", padding: 4 }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Time info */}
              <div style={{
                display: "flex", gap: 8,
                fontSize: 12, fontFamily: "monospace", color: "#6b7280",
                flexWrap: "wrap",
              }}>
                <span style={{
                  background: selected ? "#ddd6fe" : "#f3f4f6",
                  padding: "3px 8px", borderRadius: 6, fontWeight: 600,
                }}>
                  {formatTime(region.start)}
                </span>
                <span style={{ lineHeight: "24px", color: "#c4b5fd" }}>→</span>
                <span style={{
                  background: selected ? "#ddd6fe" : "#f3f4f6",
                  padding: "3px 8px", borderRadius: 6, fontWeight: 600,
                }}>
                  {formatTime(region.end)}
                </span>
                <span style={{
                  background: selected ? "#c4b5fd" : "#e5e7eb",
                  color: selected ? "#4c1d95" : "#6b7280",
                  padding: "3px 8px", borderRadius: 6, fontWeight: 700,
                  marginLeft: "auto",
                }}>
                  {formatDuration(region.end - region.start)}
                </span>
              </div>

              {/* Repeat count selector (shown when selected) */}
              {selected && (
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <Repeat size={13} style={{ color: "#6d28d9", flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: "#7c3aed", fontWeight: 600 }}>Repeats:</span>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {REPEAT_OPTIONS.map(opt => (
                      <button
                        key={String(opt)}
                        onClick={e => { e.stopPropagation(); updateRegion(region.id, { repeatCount: opt }); }}
                        style={{
                          padding: "3px 8px",
                          borderRadius: 6,
                          border: "1.5px solid",
                          borderColor: region.repeatCount === opt ? "#6d28d9" : "#c4b5fd",
                          background: region.repeatCount === opt ? "#6d28d9" : "white",
                          color: region.repeatCount === opt ? "white" : "#6d28d9",
                          fontSize: 11, fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {opt}×
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
