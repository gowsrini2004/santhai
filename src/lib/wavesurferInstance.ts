/**
 * Module-level singleton for the WaveSurfer instance.
 * This allows any component to call play/pause/seek without prop drilling.
 */
import WaveSurfer from "wavesurfer.js";

let _instance: WaveSurfer | null = null;

export const setWaveSurferInstance = (ws: WaveSurfer | null) => {
  _instance = ws;
};

export const getWaveSurferInstance = () => _instance;
