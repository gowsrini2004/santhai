import { useCallback, useEffect, useRef } from "react";
import { useSessionStore } from "@/store/useSessionStore";
import { getWaveSurferInstance } from "@/lib/wavesurferInstance";
import WaveSurfer from "wavesurfer.js";

export const useAudioEngine = (_wavesurfer: React.MutableRefObject<WaveSurfer | null>) => {
  const {
    currentSession,
    loopMode,
    globalLoopCount,
    selectedRegionIds,
    playMode,
  } = useSessionStore();

  const regionRepeatCounts = useRef<Record<string, number>>({});
  const globalLoopIteration = useRef(0);
  const currentRegionIndex = useRef(0);
  const isWaiting = useRef(false);
  const { loopGap, setWaiting } = useSessionStore();

  const handleTimeUpdate = useCallback((currentTime: number) => {
    const ws = getWaveSurferInstance();
    if (!ws || !currentSession || isWaiting.current) return;

    // ... (rest of the logic remains similar but uses setWaiting)

    // STANDARD PLAYBACK MODE
    if (playMode === "standard") {
      if (currentTime >= ws.getDuration() - 0.05) {
        if (loopMode === "infinite") {
          if (loopGap > 0) {
              isWaiting.current = true;
              ws.pause();
              setTimeout(() => {
                  ws.setTime(0);
                  ws.play();
                  isWaiting.current = false;
              }, loopGap);
          } else {
              ws.setTime(0);
              ws.play();
          }
        } else {
          ws.pause();
        }
      }
      return;
    }

    // LOOPING MODE
    if (playMode === "looping") {
      const regions = currentSession.regions.filter(r => selectedRegionIds.includes(r.id));
      if (regions.length === 0) return;

      const active = regions[currentRegionIndex.current];
      if (!active) {
          currentRegionIndex.current = 0;
          return;
      }

      if (currentTime >= active.end - 0.02) { // Tiny buffer to ensure we catch it
        const repeatsNeeded = active.repeatCount === "infinite" ? Infinity : active.repeatCount;
        const currentRepeats = regionRepeatCounts.current[active.id] || 0;

        const executeSeek = (targetTime: number) => {
            if (loopGap > 0) {
                isWaiting.current = true;
                ws.pause();
                ws.setTime(targetTime);

                let remaining = loopGap;
                setWaiting(remaining);
                const interval = setInterval(() => {
                    remaining -= 100;
                    setWaiting(Math.max(0, remaining));
                }, 100);

                setTimeout(() => {
                    clearInterval(interval);
                    setWaiting(0);
                    ws.play();
                    isWaiting.current = false;
                }, loopGap);
            } else {
                ws.setTime(targetTime);
                ws.play();
            }
        };

        if (currentRepeats < repeatsNeeded - 1) {
          regionRepeatCounts.current[active.id] = currentRepeats + 1;
          executeSeek(active.start);
        } else {
          regionRepeatCounts.current[active.id] = 0;
          const nextIdx = currentRegionIndex.current + 1;

          if (nextIdx < regions.length) {
            currentRegionIndex.current = nextIdx;
            executeSeek(regions[nextIdx].start);
          } else {
            globalLoopIteration.current += 1;
            const globalLimit = globalLoopCount === "infinite" ? Infinity : globalLoopCount;

            if (globalLoopIteration.current < globalLimit) {
              currentRegionIndex.current = 0;
              executeSeek(regions[0].start);
            } else {
              // Finished all loops
              ws.pause();
              globalLoopIteration.current = 0;
              currentRegionIndex.current = 0;
            }
          }
        }
      }
    }
  }, [currentSession, loopMode, globalLoopCount, selectedRegionIds, playMode, loopGap]);

  useEffect(() => {
    const ws = getWaveSurferInstance();
    if (!ws) return;
    ws.on("timeupdate", handleTimeUpdate);
    return () => ws.un("timeupdate", handleTimeUpdate);
  }, [handleTimeUpdate]);

  // Reset counters when selection or mode changes
  useEffect(() => {
    regionRepeatCounts.current = {};
    globalLoopIteration.current = 0;
    currentRegionIndex.current = 0;
    
    // If switching to looping mode, jump to start of first region
    if (playMode === "looping" && currentSession) {
        const ws = getWaveSurferInstance();
        const regions = currentSession.regions.filter(r => selectedRegionIds.includes(r.id));
        if (ws && regions.length > 0) {
            ws.setTime(regions[0].start);
        }
    }
  }, [loopMode, selectedRegionIds, playMode, currentSession]);
};
