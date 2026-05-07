"use client";

import { useCallback } from "react";
import { db } from "@/lib/db";
import { useSessionStore } from "@/store/useSessionStore";
import { Session } from "@/types";
import { useLiveQuery } from "dexie-react-hooks";

export const useSession = () => {
  const { setSession, currentSession } = useSessionStore();

  // Use live query to automatically update the list whenever the DB changes
  const sessions = useLiveQuery(() => db.sessions.toArray());

  const loadSession = useCallback(async (id: string) => {
    const session = await db.sessions.get(id);
    if (session) {
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
    delete toSave.audioUrl; // Don't persist temporary URLs
    
    await db.sessions.put(toSave);
    // Note: setSession(session) here might cause recursion if called from an effect 
    // that depends on currentSession. Usually we just let the DB be the source of truth.
  }, []);

  const createSession = useCallback(async (name: string, audioBlob: Blob) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newSession: Session = {
      id,
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      audioBlob,
      markers: [],
      regions: [],
      playbackSpeed: 1,
      volume: 0.8,
      zoom: 0,
    };
    
    await db.sessions.add(newSession);
    return id;
  }, []);

  const deleteSession = useCallback(async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm("Are you sure you want to delete this session?")) {
      await db.sessions.delete(id);
    }
  }, []);

  return { 
    sessions, 
    loadSession, 
    saveSession, 
    createSession, 
    deleteSession,
    currentSession 
  };
};
