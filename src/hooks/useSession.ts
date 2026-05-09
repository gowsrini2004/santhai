"use client";

import { useCallback } from "react";
import { db } from "@/lib/db";
import { useSessionStore } from "@/store/useSessionStore";
import { Session, Folder } from "@/types";
import { useLiveQuery } from "dexie-react-hooks";
import JSZip from "jszip";

export const useSession = () => {
  const { setSession, currentSession } = useSessionStore();

  // Use live query to automatically update the list whenever the DB changes
  const sessions = useLiveQuery(() => db.sessions.toArray());
  const folders = useLiveQuery(() => db.folders.toArray());

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
  }, []);

  const createSession = useCallback(async (name: string, audioBlob: Blob, folderId: string | null = null) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newSession: Session = {
      id,
      name,
      folderId,
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
    await db.sessions.delete(id);
  }, []);

  const createFolder = useCallback(async (name: string, parentId: string | null = null) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newFolder: Folder = {
      id,
      name,
      parentId,
      createdAt: Date.now(),
    };
    await db.folders.add(newFolder);
    return id;
  }, []);

  const deleteFolder = useCallback(async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // Recursively delete subfolders and sessions
    const deleteRecursive = async (folderId: string) => {
      // Delete sessions in this folder
      await db.sessions.where("folderId").equals(folderId).delete();
      
      // Find subfolders
      const subfolders = await db.folders.where("parentId").equals(folderId).toArray();
      for (const sub of subfolders) {
        await deleteRecursive(sub.id);
      }
      
      // Delete the folder itself
      await db.folders.delete(folderId);
    };
    
    await deleteRecursive(id);
  }, []);

  const exportSession = useCallback(async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const session = await db.sessions.get(id);
    if (!session || !session.audioBlob) return;

    const url = URL.createObjectURL(session.audioBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${session.name}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const exportFolder = useCallback(async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const folder = await db.folders.get(id);
    if (!folder) return;

    const zip = new JSZip();

    const addFolderToZip = async (folderId: string, currentZip: JSZip) => {
      // Add sessions in this folder
      const sessionsInFolder = await db.sessions.where("folderId").equals(folderId).toArray();
      for (const session of sessionsInFolder) {
        if (session.audioBlob) {
          currentZip.file(`${session.name}.wav`, session.audioBlob);
        }
      }

      // Add subfolders
      const subfolders = await db.folders.where("parentId").equals(folderId).toArray();
      for (const sub of subfolders) {
        const subZip = currentZip.folder(sub.name);
        if (subZip) {
          await addFolderToZip(sub.id, subZip);
        }
      }
    };

    const rootZip = zip.folder(folder.name) || zip;
    await addFolderToZip(id, rootZip);

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${folder.name}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const moveSession = useCallback(async (sessionId: string, targetFolderId: string | null) => {
    await db.sessions.update(sessionId, { folderId: targetFolderId, updatedAt: Date.now() });
  }, []);

  const moveFolder = useCallback(async (folderId: string, targetParentId: string | null) => {
    if (folderId === targetParentId) return;
    
    const isDescendant = async (parent: string, child: string): Promise<boolean> => {
      const folder = await db.folders.get(child);
      if (!folder || !folder.parentId) return false;
      if (folder.parentId === parent) return true;
      return isDescendant(parent, folder.parentId);
    };

    if (targetParentId && await isDescendant(folderId, targetParentId)) {
      throw new Error("Cannot move a folder into its own subfolder.");
    }

    await db.folders.update(folderId, { parentId: targetParentId });
  }, []);

  const exportBackup = useCallback(async () => {
    const zip = new JSZip();
    const allFolders = await db.folders.toArray();
    const allSessions = await db.sessions.toArray();

    const sessionMetadata: any[] = [];

    for (const session of allSessions) {
      const audioFileName = `audio_${session.id}.wav`;
      if (session.audioBlob) {
        zip.file(audioFileName, session.audioBlob);
      }
      sessionMetadata.push({
        id: session.id,
        name: session.name,
        folderId: session.folderId,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        markers: session.markers,
        regions: session.regions,
        playbackSpeed: session.playbackSpeed,
        volume: session.volume,
        zoom: session.zoom,
        audioFileName: session.audioBlob ? audioFileName : null
      });
    }

    const backupData = {
      version: 1,
      folders: allFolders,
      sessions: sessionMetadata
    };

    zip.file("backup.json", JSON.stringify(backupData));

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = `santhai_backup_${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const importBackup = useCallback(async (file: File) => {
    try {
      const zip = await JSZip.loadAsync(file);
      const backupJsonFile = zip.file("backup.json");
      if (!backupJsonFile) {
        throw new Error("Invalid backup file. Could not find backup.json metadata.");
      }
      const backupJsonText = await backupJsonFile.async("text");
      const backupData = JSON.parse(backupJsonText);

      // Restore folders
      for (const folder of backupData.folders) {
        await db.folders.put(folder);
      }

      // Restore sessions
      for (const s of backupData.sessions) {
        let audioBlob: Blob | undefined;
        if (s.audioFileName) {
          const audioFile = zip.file(s.audioFileName);
          if (audioFile) {
            audioBlob = await audioFile.async("blob");
          }
        }

        const restoredSession: Session = {
          id: s.id,
          name: s.name,
          folderId: s.folderId,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          markers: s.markers || [],
          regions: s.regions || [],
          playbackSpeed: s.playbackSpeed || 1,
          volume: s.volume || 1,
          zoom: s.zoom || 0,
          audioBlob: audioBlob
        };
        await db.sessions.put(restoredSession);
      }

    } catch (err) {
      console.error("Backup restoration failed:", err);
      throw new Error("Failed to restore backup. Please ensure you uploaded a valid Santhai backup ZIP file.");
    }
  }, []);

  return { 
    sessions, 
    folders,
    loadSession, 
    saveSession, 
    createSession, 
    deleteSession,
    createFolder,
    deleteFolder,
    exportSession,
    exportFolder,
    moveSession,
    moveFolder,
    exportBackup,
    importBackup,
    currentSession 
  };
};
