export interface Marker {
  id: string;
  time: number;
  label: string;
  color?: string;
}

export interface Region {
  id: string;
  start: number;
  end: number;
  label: string;
  repeatCount: number | "infinite";
}

export interface Session {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  audioBlob?: Blob;
  audioUrl?: string;
  markers: Marker[];
  regions: Region[];
  playbackSpeed: number;
  volume: number;
  zoom: number;
}

export type LoopMode = "single" | "multi" | "ab" | "infinite" | "off";
