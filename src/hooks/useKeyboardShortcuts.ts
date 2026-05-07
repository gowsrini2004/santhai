import { useEffect } from "react";
import { useSessionStore } from "@/store/useSessionStore";
import { getWaveSurferInstance } from "@/lib/wavesurferInstance";

export const useKeyboardShortcuts = (_: unknown) => {
  const {
    addMarker,
    currentTime,
    playbackSpeed,
    setPlaybackSpeed,
    setLoopMode,
    loopMode,
  } = useSessionStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in inputs/textareas
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) return;

      const ws = getWaveSurferInstance();

      switch (e.key) {
        case " ":
          e.preventDefault();
          ws?.playPause();
          break;
        case "m":
        case "M":
          addMarker({
            id: Math.random().toString(36).slice(2, 10),
            time: currentTime,
            label: `M${Date.now().toString(36).slice(-4)}`,
          });
          break;
        case "l":
        case "L":
          setLoopMode(loopMode === "off" ? "single" : "off");
          break;
        case "ArrowLeft":
          ws?.setTime(Math.max(0, currentTime - 5));
          break;
        case "ArrowRight":
          ws?.setTime(currentTime + 5);
          break;
        case "+":
        case "=":
          setPlaybackSpeed(Math.min(2, playbackSpeed + 0.25));
          break;
        case "-":
        case "_":
          setPlaybackSpeed(Math.max(0.5, playbackSpeed - 0.25));
          break;
        case "Escape":
          ws?.pause();
          ws?.seekTo(0);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [addMarker, currentTime, playbackSpeed, setPlaybackSpeed, setLoopMode, loopMode]);
};
