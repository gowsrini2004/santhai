import { create } from "zustand";
import { Marker, Region, Session, LoopMode } from "@/types";

interface SessionState {
  currentSession: Session | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackSpeed: number;
  volume: number;
  zoom: number;
  isReady: boolean;
  loopMode: LoopMode;
  globalLoopCount: number | "infinite";
  selectedRegionIds: string[];
  playMode: "standard" | "looping";
  loopGap: number; // in milliseconds
  
  // Actions
  setIsReady: (ready: boolean) => void;
  setSession: (session: Session | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  setVolume: (volume: number) => void;
  setZoom: (zoom: number) => void;
  setLoopMode: (mode: LoopMode) => void;
  setGlobalLoopCount: (count: number | "infinite") => void;
  setSelectedRegionIds: (ids: string[]) => void;
  setPlayMode: (mode: "standard" | "looping") => void;
  setLoopGap: (gap: number) => void;
  
  // Marker/Region actions
  addMarker: (marker: Marker) => void;
  removeMarker: (id: string) => void;
  updateMarker: (id: string, updates: Partial<Marker>) => void;
  updateRegion: (id: string, updates: Partial<Region>) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  currentSession: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  playbackSpeed: 1,
  volume: 0.8,
  zoom: 0,
  isReady: false,
  loopMode: "multi",
  globalLoopCount: "infinite",
  selectedRegionIds: [],
  playMode: "looping",
  loopGap: 0,

  setIsReady: (isReady) => set({ isReady }),
  setSession: (session) => set({ currentSession: session, zoom: 0 }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),
  setVolume: (volume) => set({ volume }),
  setZoom: (zoom) => set({ zoom }),
  setLoopMode: (loopMode) => set({ loopMode }),
  setGlobalLoopCount: (globalLoopCount) => set({ globalLoopCount }),
  setSelectedRegionIds: (selectedRegionIds) => set({ selectedRegionIds }),
  setPlayMode: (mode) => set({ playMode: mode }),
  setLoopGap: (gap) => set({ loopGap: gap }),

  addMarker: (marker) => set((state) => {
    if (!state.currentSession) return state;
    let markers = [...state.currentSession.markers, marker].sort((a, b) => a.time - b.time);
    markers = markers.map((m, i) => ({ ...m, label: `M${i + 1}` }));
    
    // Recalculate regions
    const regions: Region[] = [];
    for (let i = 0; i <= markers.length; i++) {
      const start = i === 0 ? 0 : markers[i - 1].time;
      const end = i === markers.length ? state.duration : markers[i].time;
      if (end <= start) continue;
      
      const existingRegion = state.currentSession.regions.find(r => r.start === start && r.end === end);
      regions.push({
        id: existingRegion?.id || Math.random().toString(36).substr(2, 9),
        start,
        end,
        label: existingRegion?.label || `Region ${regions.length + 1}`,
        repeatCount: existingRegion?.repeatCount || "infinite",
      });
    }

    return {
      currentSession: {
        ...state.currentSession,
        markers,
        regions,
      }
    };
  }),

  removeMarker: (id) => set((state) => {
    if (!state.currentSession) return state;
    let markers = state.currentSession.markers.filter(m => m.id !== id);
    markers = markers.map((m, i) => ({ ...m, label: `M${i + 1}` }));
    
    // Recalculate regions
    const regions: Region[] = [];
    for (let i = 0; i <= markers.length; i++) {
      const start = i === 0 ? 0 : markers[i - 1].time;
      const end = i === markers.length ? state.duration : markers[i].time;
      if (end <= start) continue;
      
      const existingRegion = state.currentSession.regions.find(r => r.start === start && r.end === end);
      regions.push({
        id: existingRegion?.id || Math.random().toString(36).substr(2, 9),
        start,
        end,
        label: existingRegion?.label || `Region ${regions.length + 1}`,
        repeatCount: existingRegion?.repeatCount || 1,
      });
    }

    return {
      currentSession: {
        ...state.currentSession,
        markers,
        regions,
      }
    };
  }),

  updateMarker: (id, updates) => set((state) => {
    if (!state.currentSession) return state;
    let markers = state.currentSession.markers.map(m => m.id === id ? { ...m, ...updates } : m).sort((a, b) => a.time - b.time);
    markers = markers.map((m, i) => ({ ...m, label: `M${i + 1}` }));
    
    // Recalculate regions
    const regions: Region[] = [];
    for (let i = 0; i <= markers.length; i++) {
      const start = i === 0 ? 0 : markers[i - 1].time;
      const end = i === markers.length ? state.duration : markers[i].time;
      if (end <= start) continue;
      
      const existingRegion = state.currentSession.regions.find(r => r.start === start && r.end === end);
      regions.push({
        id: existingRegion?.id || Math.random().toString(36).substr(2, 9),
        start,
        end,
        label: existingRegion?.label || `Region ${regions.length + 1}`,
        repeatCount: existingRegion?.repeatCount || 1,
      });
    }

    return {
      currentSession: {
        ...state.currentSession,
        markers,
        regions,
      }
    };
  }),

  updateRegion: (id, updates) => set((state) => {
    if (!state.currentSession) return state;
    return {
      currentSession: {
        ...state.currentSession,
        regions: state.currentSession.regions.map(r => r.id === id ? { ...r, ...updates } : r),
      }
    };
  }),
}));
