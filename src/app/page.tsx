"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { motion, AnimatePresence } from "framer-motion";
import { Music2, Play, Trash2, Search, Clock, Headphones, Scissors, Plus, Upload, Maximize2, Download, MoveHorizontal, FolderInput, X } from "lucide-react";
import AudioCutterModal from "@/components/upload/AudioCutterModal";

import { Folder as FolderIcon, ChevronRight, Home as HomeIcon, FolderPlus, ChevronLeft } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isCutterOpen, setIsCutterOpen] = useState(false);
  const [cutterFile, setCutterFile] = useState<File | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [movingItem, setMovingItem] = useState<{ id: string, type: 'session' | 'folder' } | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [newFolderInputName, setNewFolderInputName] = useState("");
  const [showBackupReminder, setShowBackupReminder] = useState(true);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{ id: string, type: 'session' | 'folder', name: string } | null>(null);
  const [toastNotification, setToastNotification] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (toastNotification) {
      const timer = setTimeout(() => setToastNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastNotification]);

  const { 
    sessions, folders, createSession, deleteSession, 
    createFolder, deleteFolder, exportSession, exportFolder,
    moveSession, moveFolder, exportBackup, importBackup
  } = useSession();

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleMobileView = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        if (screen.orientation && (screen.orientation as any).lock) {
            await (screen.orientation as any).lock("landscape").catch(() => {});
        }
      } else {
        await document.exitFullscreen();
        if (screen.orientation && (screen.orientation as any).unlock) {
            (screen.orientation as any).unlock();
        }
      }
    } catch (e) {
      console.error("Mobile view error", e);
    }
  };

  const currentFolder = useMemo(() => {
    if (!currentFolderId || !folders) return null;
    return folders.find(f => f.id === currentFolderId);
  }, [currentFolderId, folders]);

  const breadcrumbs = useMemo(() => {
    const crumbs: { id: string | null; name: string }[] = [{ id: null, name: "Home" }];
    if (!currentFolderId || !folders) return crumbs;

    const buildCrumbs = (id: string) => {
      const folder = folders.find(f => f.id === id);
      if (folder) {
        if (folder.parentId) buildCrumbs(folder.parentId);
        crumbs.push({ id: folder.id, name: folder.name });
      }
    };
    buildCrumbs(currentFolderId);
    return crumbs;
  }, [currentFolderId, folders]);

  const filteredFolders = useMemo(() => {
    if (!folders) return [];
    return folders
      .filter(f => {
        if (searchQuery.trim() !== "") {
          return f.name.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return f.parentId === currentFolderId;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [folders, currentFolderId, searchQuery]);

  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    return sessions
      .filter(s => {
        if (searchQuery.trim() !== "") {
          return s.name.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return s.folderId === currentFolderId;
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [sessions, currentFolderId, searchQuery]);

  const handleImportBackup = async (file: File) => {
    try {
      await importBackup(file);
      setToastNotification({ message: "Backup successfully restored! Your library has been updated.", type: "success" });
    } catch (err: any) {
      setToastNotification({ message: err.message || "Failed to restore backup.", type: "error" });
    }
  };

  const handleUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "audio/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setIsUploading(true);
        try {
          const id = await createSession(file.name.replace(/\.[^/.]+$/, ""), file, currentFolderId);
          router.push(`/session/${id}`);
        } catch (e) {
          console.error("Upload failed", e);
          setIsUploading(false);
        }
      }
    };
    input.click();
  };

  const handleTryDemo = async () => {
    setIsUploading(true);
    try {
      const response = await fetch("/demo-chant.mp3");
      if (!response.ok) throw new Error("Could not find demo-chant.mp3 in public folder");
      const blob = await response.blob();
      const file = new File([blob], "Om_Sthapakaya_Cha_Dharmasya.mp3", { type: "audio/mp3" });
      const id = await createSession("Vedic Chant - Sample Session", file, currentFolderId);
      router.push(`/session/${id}`);
    } catch (e) {
      console.error("Demo failed", e);
      alert("Demo file not found. Please ensure 'demo-chant.mp3' is in your public folder.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateFolder = () => {
    setNewFolderInputName("");
    setIsCreateFolderModalOpen(true);
  };

  const submitCreateFolder = async () => {
    const name = newFolderInputName.trim();
    if (name) {
      await createFolder(name, currentFolderId);
      setIsCreateFolderModalOpen(false);
    }
  };

  const handleCutterClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "audio/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setCutterFile(file);
        setIsCutterOpen(true);
      }
    };
    input.click();
  };

  const handleDragStart = (e: React.DragEvent, id: string, type: 'session' | 'folder') => {
    e.dataTransfer.setData("id", id);
    e.dataTransfer.setData("type", type);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    setDragOverFolderId(null);
    const id = e.dataTransfer.getData("id");
    const type = e.dataTransfer.getData("type") as 'session' | 'folder';

    if (!id) return;

    if (type === 'session') {
      await moveSession(id, targetFolderId);
    } else {
      try {
        await moveFolder(id, targetFolderId);
      } catch (err: any) {
        setToastNotification({ message: err.message || "Failed to move folder.", type: "error" });
      }
    }
  };

  const isEmpty = filteredSessions.length === 0 && filteredFolders.length === 0;

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      {/* ... styles ... */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } } 
        .animate-spin { animation: spin 0.8s linear infinite; }
        .mobile-view-btn { 
           position: fixed; bottom: 30px; right: 20px; z-index: 100;
           background: #6d28d9; color: white; border: none; border-radius: 50%;
           width: 56px; height: 56px; display: flex; align-items: center; justify-content: center;
           box-shadow: 0 8px 20px rgba(109,40,217,0.4); cursor: pointer; transition: all 0.2s;
        }
        .mobile-view-btn:active { transform: scale(0.9); }
        @media (min-width: 769px) { .mobile-view-btn { display: none; } }
      `}</style>

      {/* Floating Button for Full Screen */}
      <button className="mobile-view-btn" onClick={toggleMobileView} title="Full Screen">
        <Maximize2 size={24} />
      </button>

      {/* ── Header ── */}
      <header style={{
        background: "white", borderBottom: "1.5px solid #e5e7eb",
        padding: "0 24px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36,
            background: "linear-gradient(135deg, #6d28d9 0%, #2563eb 100%)",
            borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Headphones size={18} color="white" />
          </div>
          <div onClick={() => setCurrentFolderId(null)} style={{ cursor: "pointer" }}>
            <span style={{ fontWeight: 900, fontSize: 20, color: "#1e1b4b" }}>SANTHAI</span>
            <span style={{ fontWeight: 500, fontSize: 14, color: "#6d28d9", marginLeft: 4, letterSpacing: 1, verticalAlign: "top" }}>STUDIO</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={exportBackup}
            title="Download full library backup"
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 12px", borderRadius: 10,
              background: "#ede9fe", color: "#6d28d9",
              border: "1.5px solid #c4b5fd", fontWeight: 700, fontSize: 13, cursor: "pointer"
            }}
          >
            <Download size={15} /> Backup
          </button>
          <label
            title="Restore library from backup file"
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 12px", borderRadius: 10,
              background: "#ede9fe", color: "#6d28d9",
              border: "1.5px solid #c4b5fd", fontWeight: 700, fontSize: 13, cursor: "pointer"
            }}
          >
            <Upload size={15} /> Restore
            <input
              type="file"
              accept=".zip"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImportBackup(file);
              }}
              style={{ display: "none" }}
            />
          </label>
          <button
            onClick={handleCreateFolder}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 16px", borderRadius: 10,
              background: "#ede9fe", color: "#6d28d9",
              border: "1.5px solid #c4b5fd", fontWeight: 700, fontSize: 13, cursor: "pointer"
            }}
          >
            <FolderPlus size={16} /> New Folder
          </button>
          <button
            onClick={handleUpload}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 16px", borderRadius: 10,
              background: "#6d28d9", color: "white",
              border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer"
            }}
          >
            <Plus size={16} /> New Session
          </button>
          <button
            onClick={handleCutterClick}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 16px", borderRadius: 10,
              background: "#ede9fe", color: "#6d28d9",
              border: "1.5px solid #c4b5fd", fontWeight: 700, fontSize: 13, cursor: "pointer"
            }}
          >
            <Scissors size={16} /> Audio Cutter
          </button>
          <button
            onClick={toggleMobileView}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 16px", borderRadius: 10,
              background: isFullscreen ? "#10b981" : "#ede9fe", color: isFullscreen ? "white" : "#6d28d9",
              border: isFullscreen ? "none" : "1.5px solid #c4b5fd", fontWeight: 700, fontSize: 13, cursor: "pointer"
            }}
          >
            <Maximize2 size={16} /> {isFullscreen ? "Exit Full" : "Full Screen"}
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
        {/* Backup Reminder Banner */}
        <AnimatePresence>
          {showBackupReminder && ((sessions && sessions.length > 0) || (folders && folders.length > 0)) && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{
                background: "linear-gradient(135deg, #ede9fe 0%, #fae8ff 100%)",
                border: "1.5px solid #c4b5fd",
                borderRadius: 16,
                padding: "16px 24px",
                marginBottom: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 16,
                boxShadow: "0 4px 20px rgba(109,40,217,0.05)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: "280px" }}>
                <span style={{ fontSize: 24 }}>💾</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1e1b4b" }}>
                    Don't lose your practice sessions!
                  </h4>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#6d28d9", marginTop: 2 }}>
                    Your library is stored locally on this device. Back up your files regularly to keep them safe.
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button
                  onClick={exportBackup}
                  style={{
                    padding: "8px 16px", borderRadius: 10, background: "#6d28d9", color: "white",
                    fontWeight: 800, fontSize: 12, border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s"
                  }}
                >
                  <Download size={14} /> Backup Now
                </button>
                <label
                  style={{
                    padding: "8px 16px", borderRadius: 10, background: "white", color: "#6d28d9",
                    fontWeight: 800, fontSize: 12, border: "1.5px solid #c4b5fd", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s"
                  }}
                >
                  <Upload size={14} /> Restore
                  <input
                    type="file"
                    accept=".zip"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImportBackup(file);
                    }}
                    style={{ display: "none" }}
                  />
                </label>
                <button
                  onClick={() => setShowBackupReminder(false)}
                  style={{
                    background: "none", border: "none", cursor: "pointer", color: "#6b7280",
                    display: "flex", alignItems: "center", justifyContent: "center", padding: 4
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {currentFolderId === null && (
          <div style={{ marginBottom: 40, textAlign: "left" }}>
            <h1 style={{ margin: 0, fontSize: 36, fontWeight: 900, letterSpacing: "-0.05em", color: "#1e1b4b", marginBottom: 8 }}>
              Master Your Audio Practice
            </h1>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 500, color: "#6b7280" }}>
              The ultimate tool for precision looping, speed adjustment, and audio segmentation.
            </p>
          </div>
        )}
        
        {/* ── Breadcrumbs & Search ── */}
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {breadcrumbs.map((crumb, i) => (
                <React.Fragment key={crumb.id || "root"}>
                  <button 
                    onClick={() => setCurrentFolderId(crumb.id)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: 14, fontWeight: i === breadcrumbs.length - 1 ? 800 : 500,
                      color: i === breadcrumbs.length - 1 ? "#1e1b4b" : "#6b7280",
                      display: "flex", alignItems: "center", gap: 4, padding: 0
                    }}
                  >
                    {i === 0 && <HomeIcon size={14} />}
                    {crumb.name}
                  </button>
                  {i < breadcrumbs.length - 1 && <ChevronRight size={14} color="#d1d5db" />}
                </React.Fragment>
              ))}
            </div>
            
            <div style={{ position: "relative" }}>
              <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
              <input
                type="text"
                placeholder="Search library…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  padding: "10px 14px 10px 36px", border: "1.5px solid #e5e7eb",
                  borderRadius: 12, fontSize: 14, outline: "none", width: 280,
                }}
              />
            </div>
          </div>
        </section>

        {/* ── Library Grid ── */}
        <section>
          {!isEmpty && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              {currentFolderId !== null && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    onClick={() => setCurrentFolderId(null)}
                    title="Go to Home"
                    style={{
                      width: 32, height: 32, borderRadius: 8, background: "white", border: "1.5px solid #e5e7eb",
                      display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                      color: "#6b7280", transition: "all 0.2s"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#6d28d9"; e.currentTarget.style.color = "#6d28d9"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#6b7280"; }}
                  >
                    <HomeIcon size={14} />
                  </button>
                  <button
                    onClick={() => setCurrentFolderId(currentFolder?.parentId || null)}
                    title="Go to Parent Folder"
                    style={{
                      width: 32, height: 32, borderRadius: 8, background: "white", border: "1.5px solid #e5e7eb",
                      display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                      color: "#6b7280", transition: "all 0.2s"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#6d28d9"; e.currentTarget.style.color = "#6d28d9"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#6b7280"; }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                </div>
              )}
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1e1b4b", margin: 0 }}>
                {currentFolderId ? `${currentFolder?.name || "Folder"} Contents` : "My Sessions"}
              </h2>
            </div>
          )}
          {isEmpty ? (
            <div style={{
              textAlign: "center", padding: "80px 32px", border: "2px dashed #e5e7eb", borderRadius: 24, background: "white"
            }}>
              <div style={{ width: 64, height: 64, background: "#f5f3ff", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <Upload size={32} style={{ color: "#c4b5fd" }} />
              </div>
              <h3 style={{ margin: 0, fontWeight: 800, color: "#1e1b4b", fontSize: 18 }}>
                {currentFolderId ? `Folder "${currentFolder?.name}" is empty` : "Ready to start?"}
              </h3>
              <p style={{ margin: "8px 0 24px", color: "#6b7280" }}>
                {currentFolderId ? "Start adding sessions or subfolders here." : "Generate a demo or upload your own file."}
              </p>
              
              <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
                <button
                    onClick={handleUpload}
                    style={{ padding: "12px 24px", borderRadius: 12, background: "#6d28d9", color: "white", border: "none", fontWeight: 700, cursor: "pointer" }}
                >
                    Upload File
                </button>
                {!currentFolderId && (
                  <button
                      onClick={handleTryDemo}
                      disabled={isUploading}
                      style={{ padding: "12px 24px", borderRadius: 12, background: "#ede9fe", color: "#6d28d9", border: "1.5px solid #c4b5fd", fontWeight: 700, cursor: "pointer" }}
                  >
                      {isUploading ? "Generating Demo..." : "Try Demo Audio"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
              <AnimatePresence mode="popLayout">
                {/* Folders First */}
                {filteredFolders.map((folder, i) => (
                  <motion.div
                    key={folder.id}
                    layout
                    draggable
                    onDragStart={(e: any) => handleDragStart(e, folder.id, 'folder')}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dragOverFolderId !== folder.id) setDragOverFolderId(folder.id);
                    }}
                    onDragLeave={() => setDragOverFolderId(null)}
                    onDrop={(e) => handleDrop(e, folder.id)}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setCurrentFolderId(folder.id)}
                    style={{
                      background: dragOverFolderId === folder.id ? "#f5f3ff" : "white", 
                      border: dragOverFolderId === folder.id ? "1.5px solid #6d28d9" : "1.5px solid #e5e7eb", 
                      borderRadius: 20,
                      padding: "20px 24px", cursor: "pointer", position: "relative",
                      display: "flex", alignItems: "center", gap: 16,
                      boxShadow: dragOverFolderId === folder.id ? "0 0 0 2px rgba(109,40,217,0.1)" : "none",
                      transition: "all 0.2s"
                    }}
                    whileHover={{ borderColor: "#6d28d9", translateY: -4 }}
                  >
                    <div style={{ 
                      width: 48, height: 48, borderRadius: 14, background: "#f5f3ff", 
                      color: "#6d28d9", display: "flex", alignItems: "center", justifyContent: "center" 
                    }}>
                      <FolderIcon size={24} fill="currentColor" opacity={0.2} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ margin: 0, fontWeight: 800, fontSize: 15, color: "#1e1b4b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {folder.name}
                      </h3>
                      <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>Folder</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button 
                        onClick={e => { e.stopPropagation(); setMovingItem({ id: folder.id, type: 'folder' }); }} 
                        title="Move Folder"
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}
                      >
                        <MoveHorizontal size={16} />
                      </button>
                      <button 
                        onClick={e => exportFolder(folder.id, e)} 
                        title="Download Folder (ZIP)"
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}
                      >
                        <Download size={16} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); setDeleteConfirmItem({ id: folder.id, type: 'folder', name: folder.name }); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#d1d5db", padding: 4 }} title="Delete Folder">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}

                {/* Sessions */}
                {filteredSessions.map((session, i) => (
                  <motion.div
                    key={session.id}
                    layout
                    draggable
                    onDragStart={(e: any) => handleDragStart(e, session.id, 'session')}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: (filteredFolders.length + i) * 0.05 }}
                    onClick={() => router.push(`/session/${session.id}`)}
                    style={{
                      background: "white", border: "1.5px solid #e5e7eb", borderRadius: 20,
                      padding: 24, cursor: "pointer", position: "relative",
                    }}
                    whileHover={{ borderColor: "#6d28d9", translateY: -4 }}
                  >
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: "#6d28d9", borderTopLeftRadius: 20, borderBottomLeftRadius: 20 }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ margin: 0, fontWeight: 800, fontSize: 16, color: "#1e1b4b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {session.name}
                        </h3>
                        <span style={{ fontSize: 12, color: "#9ca3af" }}>{new Date(session.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button 
                          onClick={e => { e.stopPropagation(); setMovingItem({ id: session.id, type: 'session' }); }} 
                          title="Move Session"
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}
                        >
                          <MoveHorizontal size={16} />
                        </button>
                        <button 
                          onClick={e => exportSession(session.id, e)} 
                          title="Download Original Audio"
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}
                        >
                          <Download size={16} />
                        </button>
                        <button onClick={e => { e.stopPropagation(); setDeleteConfirmItem({ id: session.id, type: 'session', name: session.name }); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#d1d5db", padding: 4 }} title="Delete Session">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: 8 }}>
                            <span style={{ background: "#f5f3ff", color: "#6d28d9", fontSize: 11, fontWeight: 700, padding: "4px 8px", borderRadius: 6 }}>{session.markers.length} Markers</span>
                            <span style={{ background: "#eff6ff", color: "#2563eb", fontSize: 11, fontWeight: 700, padding: "4px 8px", borderRadius: 6 }}>{session.regions.length} Regions</span>
                        </div>
                        <div style={{ width: 32, height: 32, background: "#6d28d9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Play size={14} fill="white" color="white" style={{ marginLeft: 2 }} />
                        </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </div>

      <AudioCutterModal 
        isOpen={isCutterOpen} 
        onClose={() => { setIsCutterOpen(false); setCutterFile(null); }} 
        file={cutterFile} 
        defaultFolderId={currentFolderId}
      />

      {/* Move Modal */}
      <AnimatePresence>
        {movingItem && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(30,27,75,0.4)",
            backdropFilter: "blur(8px)", zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{
                background: "white", borderRadius: 24, width: "100%", maxWidth: 450,
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", overflow: "hidden"
              }}
            >
              <div style={{ padding: "20px 24px", borderBottom: "1.5px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <FolderInput size={20} color="#6d28d9" />
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#1e1b4b" }}>Move to Folder</h3>
                </div>
                <button onClick={() => setMovingItem(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}><Maximize2 size={20} style={{ transform: "rotate(45deg)" }} /></button>
              </div>

              <div style={{ padding: "16px 24px", maxHeight: 300, overflowY: "auto" }}>
                <div 
                  onClick={() => {
                    if (movingItem.type === 'session') moveSession(movingItem.id, null);
                    else moveFolder(movingItem.id, null);
                    setMovingItem(null);
                  }}
                  style={{ 
                    padding: "12px 16px", borderRadius: 12, cursor: "pointer", 
                    display: "flex", alignItems: "center", gap: 12,
                    background: "#f9fafb", border: "1.5px solid #e5e7eb", marginBottom: 12
                  }}
                >
                  <HomeIcon size={18} color="#6d28d9" />
                  <span style={{ fontWeight: 700, fontSize: 14, color: "#1e1b4b" }}>Move to Home (Root)</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {folders?.filter(f => f.id !== movingItem.id).map(f => (
                    <div 
                      key={f.id}
                      onClick={() => {
                        if (movingItem.type === 'session') moveSession(movingItem.id, f.id);
                        else moveFolder(movingItem.id, f.id);
                        setMovingItem(null);
                      }}
                      style={{ 
                        padding: "10px 16px", borderRadius: 12, cursor: "pointer", 
                        display: "flex", alignItems: "center", gap: 12,
                        background: "white", border: "1px solid #f3f4f6",
                      }}
                    >
                      <FolderIcon size={16} color="#c4b5fd" />
                      <span style={{ fontWeight: 600, fontSize: 13, color: "#4b5563" }}>{f.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ padding: "16px 24px", background: "#f9fafb", display: "flex", justifyContent: "flex-end" }}>
                 <button onClick={() => setMovingItem(null)} style={{ padding: "8px 20px", borderRadius: 10, background: "white", border: "1.5px solid #e5e7eb", fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#6b7280" }}>
                   Cancel
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Folder Modal */}
      <AnimatePresence>
        {isCreateFolderModalOpen && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(30,27,75,0.4)",
            backdropFilter: "blur(8px)", zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{
                background: "white", borderRadius: 24, width: "100%", maxWidth: 400,
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", overflow: "hidden"
              }}
            >
              <div style={{ padding: "20px 24px", borderBottom: "1.5px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <FolderPlus size={20} color="#6d28d9" />
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#1e1b4b" }}>Create New Folder</h3>
                </div>
                <button onClick={() => setIsCreateFolderModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}><X size={20} /></button>
              </div>

              <div style={{ padding: "24px" }}>
                <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 700, color: "#4b5563" }}>Folder Name</label>
                <input 
                  autoFocus
                  type="text"
                  placeholder="e.g., Vedic Chants"
                  value={newFolderInputName}
                  onChange={e => setNewFolderInputName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') submitCreateFolder(); }}
                  style={{
                    width: "100%", boxSizing: "border-box", padding: "12px 16px", borderRadius: 12, border: "1.5px solid #e5e7eb",
                    fontSize: 14, fontWeight: 600, outline: "none", color: "#1e1b4b"
                  }}
                />
              </div>

              <div style={{ padding: "16px 24px", background: "#f9fafb", display: "flex", justifyContent: "flex-end", gap: 12 }}>
                 <button onClick={() => setIsCreateFolderModalOpen(false)} style={{ padding: "10px 20px", borderRadius: 12, background: "white", border: "1.5px solid #e5e7eb", fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#6b7280" }}>
                   Cancel
                 </button>
                 <button 
                  onClick={submitCreateFolder} 
                  disabled={!newFolderInputName.trim()}
                  style={{ 
                    padding: "10px 20px", borderRadius: 12, background: "#6d28d9", border: "none", 
                    fontWeight: 700, fontSize: 13, cursor: newFolderInputName.trim() ? "pointer" : "not-allowed", color: "white",
                    opacity: newFolderInputName.trim() ? 1 : 0.6
                  }}
                 >
                   Create Folder
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmItem && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(30,27,75,0.4)",
            backdropFilter: "blur(8px)", zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              style={{
                background: "white", borderRadius: 24, padding: "32px 32px 24px", maxWidth: 440, width: "100%",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                border: "1.5px solid #e5e7eb"
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 18, background: "#fee2e2", color: "#ef4444",
                  display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20
                }}>
                  <Trash2 size={24} />
                </div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#1e1b4b" }}>
                  Delete {deleteConfirmItem.type === "folder" ? "Folder" : "Session"}?
                </h3>
                <p style={{ margin: "8px 0 24px", fontSize: 14, color: "#6b7280", fontWeight: 500, lineHeight: 1.5 }}>
                  Are you sure you want to delete <strong style={{ color: "#1e1b4b" }}>"{deleteConfirmItem.name}"</strong>?
                  {deleteConfirmItem.type === "folder" ? " This will permanently delete the folder and all nested practice sessions inside it." : " This action cannot be undone."}
                </p>
                
                <div style={{ display: "flex", gap: 12, width: "100%" }}>
                  <button
                    onClick={() => setDeleteConfirmItem(null)}
                    style={{
                      flex: 1, padding: "12px", borderRadius: 12, border: "1.5px solid #e5e7eb",
                      background: "white", color: "#6b7280", fontWeight: 700, fontSize: 14, cursor: "pointer"
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (deleteConfirmItem.type === "folder") {
                        await deleteFolder(deleteConfirmItem.id);
                      } else {
                        await deleteSession(deleteConfirmItem.id);
                      }
                      setDeleteConfirmItem(null);
                    }}
                    style={{
                      flex: 1, padding: "12px", borderRadius: 12, border: "none",
                      background: "#ef4444", color: "white", fontWeight: 800, fontSize: 14, cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(239,68,68,0.2)"
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            style={{
              position: "fixed", bottom: 40, left: "50%", transform: "translateX(-50%)", zIndex: 2000,
              background: toastNotification.type === "success" ? "#10b981" : toastNotification.type === "error" ? "#ef4444" : "#3b82f6",
              color: "white", padding: "14px 28px", borderRadius: 16, display: "flex", alignItems: "center", gap: 10,
              boxShadow: "0 10px 25px rgba(0,0,0,0.15)", fontWeight: 700, fontSize: 14, cursor: "pointer"
            }}
            onClick={() => setToastNotification(null)}
          >
            <span style={{ fontSize: 16 }}>{toastNotification.type === "success" ? "✓" : toastNotification.type === "error" ? "⚠" : "ℹ"}</span>
            <span>{toastNotification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
