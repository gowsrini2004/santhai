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
  const lastProcessedEnd = useRef<string | null>(null); // To prevent double-triggering same end
  
  const { loopGap, setWaiting, setPracticeProgress } = useSessionStore();

  const handleTimeUpdate = useCallback((currentTime: number) => {
    const ws = getWaveSurferInstance();
    if (!ws || !currentSession || isWaiting.current) return;

    if (playMode === "looping") {
      const selectedRegions = currentSession.regions
        .filter(r => selectedRegionIds.includes(r.id))
        .sort((a, b) => a.start - b.start);

      if (selectedRegions.length === 0) return;

      const active = selectedRegions[currentRegionIndex.current];
      if (!active) {
          currentRegionIndex.current = 0;
          return;
      }

      // 1. Update progress state in store if changed
      const currentRepeat = (regionRepeatCounts.current[active.id] || 0) + 1;
      const currentPass = globalLoopIteration.current + 1;
      
      // Update store only if values changed to avoid re-renders
      const progress = useSessionStore.getState().practiceProgress;
      if (progress.regionId !== active.id || progress.regionRepeat !== currentRepeat || progress.globalPass !== currentPass) {
        setPracticeProgress({
          regionId: active.id,
          regionRepeat: currentRepeat,
          globalPass: currentPass
        });
      }


      // 1. Handle initial seek to first region if we are far away
      if (currentTime < active.start - 0.5 || currentTime > active.end + 0.5) {
          // If we are way outside the active region, seek to start
          // but ONLY if we aren't already waiting or processing
          ws.setTime(active.start);
          return;
      }

      // 2. Detect end of region
      const endThreshold = active.end - 0.05;
      const isAtEnd = currentTime >= endThreshold;
      const triggerId = `${active.id}_${currentRegionIndex.current}_${globalLoopIteration.current}_${regionRepeatCounts.current[active.id] || 0}`;

      if (isAtEnd && lastProcessedEnd.current !== triggerId) {
        lastProcessedEnd.current = triggerId;
        
        const repeatsNeeded = active.repeatCount === "infinite" ? Infinity : Number(active.repeatCount);
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
                    if (useSessionStore.getState().isPlaying) ws.play();
                    isWaiting.current = false;
                }, loopGap);
            } else {
                ws.setTime(targetTime);
                if (useSessionStore.getState().isPlaying) ws.play();
            }
        };

        if (currentRepeats < repeatsNeeded - 1) {
          // Inner Repeat
          regionRepeatCounts.current[active.id] = currentRepeats + 1;
          executeSeek(active.start);
        } else {
          // Move to next
          regionRepeatCounts.current[active.id] = 0;
          const nextIdx = currentRegionIndex.current + 1;

          if (nextIdx < selectedRegions.length) {
            currentRegionIndex.current = nextIdx;
            executeSeek(selectedRegions[nextIdx].start);
          } else {
            // Global increment
            globalLoopIteration.current += 1;
            const globalLimit = globalLoopCount === "infinite" ? Infinity : Number(globalLoopCount);

            if (globalLoopIteration.current < globalLimit) {
              currentRegionIndex.current = 0;
              // IMPORTANT: Reset all counts for the new pass
              regionRepeatCounts.current = {};
              executeSeek(selectedRegions[0].start);
            } else {
              // TERMINATE
              ws.pause();
              useSessionStore.getState().setIsPlaying(false);
              globalLoopIteration.current = 0;
              currentRegionIndex.current = 0;
              regionRepeatCounts.current = {};
              lastProcessedEnd.current = null;
            }
          }
        }
      }
    } else {
      // STANDARD MODE
      if (currentTime >= ws.getDuration() - 0.05) {
        if (loopMode === "infinite") {
           ws.setTime(0);
           ws.play();
        } else {
          ws.pause();
          useSessionStore.getState().setIsPlaying(false);
        }
      }
    }
  }, [currentSession, loopMode, globalLoopCount, selectedRegionIds, playMode, loopGap, setWaiting]);

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
