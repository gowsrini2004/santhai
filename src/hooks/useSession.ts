import { useCallback } from "react";
import { db } from "@/lib/db";
import { useSessionStore } from "@/store/useSessionStore";
import { Session } from "@/types";

export const useSession = () => {
  const { setSession, currentSession } = useSessionStore();

  const loadSession = useCallback(async (id: string) => {
    const session = await db.sessions.get(id);
    if (session) {
      // If there's a blob, create a URL
      if (session.audioBlob) {
        session.audioUrl = URL.createObjectURL(session.audioBlob);
      }
      setSession(session);
      return session;
    }
    return null;
  }, [setSession]);

  const saveSession = useCallback(async (session: Session) => {
    const toSave = { ...session };
    // Don't save the URL, it's temporary
    delete toSave.audioUrl;
    
    await db.sessions.put(toSave);
    setSession(session);
  }, [setSession]);

  const createSession = useCallback(async (name: string, audioBlob: Blob) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newSession: Session = {
      id,
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      audioBlob,
      audioUrl: URL.createObjectURL(audioBlob),
      markers: [],
      regions: [],
      playbackSpeed: 1,
      volume: 0.8,
      zoom: 100,
    };
    
    await db.sessions.add({ ...newSession, audioUrl: undefined });
    setSession(newSession);
    return id;
  }, [setSession]);

  return { loadSession, saveSession, createSession, currentSession };
};
