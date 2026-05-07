"use client";

import { useRef, useEffect, useCallback } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.js";
import { useSessionStore } from "@/store/useSessionStore";
import { setWaveSurferInstance } from "@/lib/wavesurferInstance";

export const useWaveSurfer = (containerRef: React.RefObject<HTMLDivElement>, audioUrl: string | null) => {
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const isReadyRef = useRef(false);
  const regionsPlugin = useRef<InstanceType<typeof RegionsPlugin> | null>(null);

  const {
    setIsPlaying,
    setCurrentTime,
    setDuration,
    playbackSpeed,
    volume,
    zoom,
    isReady: isReadyStore,
    setIsReady,
  } = useSessionStore();

  const initWaveSurfer = useCallback(() => {
    if (!containerRef.current || !audioUrl) return;

    // destroy previous
    wavesurfer.current?.destroy();
    isReadyRef.current = false;
    setIsReady(false);

    const regions = RegionsPlugin.create();
    regionsPlugin.current = regions;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#a78bfa",
      progressColor: "#6d28d9",
      cursorColor: "#2563eb",
      cursorWidth: 2,
      barWidth: 3,
      barGap: 2,
      barRadius: 3,
      height: 140,
      normalize: true,
      url: audioUrl,
      minPxPerSec: zoom,
      plugins: [regions],
    });

    ws.on("ready", () => {
      isReadyRef.current = true;
      setIsReady(true);
      setDuration(ws.getDuration());
      ws.setVolume(volume);
      ws.setPlaybackRate(playbackSpeed);
    });

    ws.on("play", () => setIsPlaying(true));
    ws.on("pause", () => setIsPlaying(false));
    ws.on("finish", () => setIsPlaying(false));
    ws.on("timeupdate", (time) => setCurrentTime(time));

    wavesurfer.current = ws;
    setWaveSurferInstance(ws);

    return () => {
      ws.destroy();
      setWaveSurferInstance(null);
      isReadyRef.current = false;
      setIsReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl]);

  useEffect(() => {
    const cleanup = initWaveSurfer();
    return cleanup;
  }, [initWaveSurfer]);

  useEffect(() => {
    if (wavesurfer.current && isReadyRef.current) {
      wavesurfer.current.setPlaybackRate(playbackSpeed);
    }
  }, [playbackSpeed]);

  useEffect(() => {
    if (wavesurfer.current && isReadyRef.current) {
      wavesurfer.current.setVolume(volume);
    }
  }, [volume]);

  useEffect(() => {
    if (wavesurfer.current && isReadyRef.current) {
      wavesurfer.current.setOptions({ minPxPerSec: zoom });
    }
  }, [zoom]);

  return { wavesurfer, regionsPlugin, isReadyRef };
};
