"use client";

import { useEffect } from "react";
import { useSessionStore } from "@/store/useSessionStore";
import { AlertCircle, CheckCircle, X } from "lucide-react";

export default function NotificationToast() {
  const { notification, setNotification } = useSessionStore();

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification, setNotification]);

  if (!notification) return null;

  const isError = notification.type === "error";

  return (
    <div style={{
      position: "fixed",
      top: 24,
      right: 24,
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 16px",
      borderRadius: 12,
      background: isError ? "#fef2f2" : "#f0fdf4",
      border: `1.5px solid ${isError ? "#fee2e2" : "#dcfce7"}`,
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      minWidth: 300,
      maxWidth: 400,
      animation: "slideIn 0.3s ease-out",
    }}>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      
      {isError ? (
        <AlertCircle size={20} color="#ef4444" />
      ) : (
        <CheckCircle size={20} color="#22c55e" />
      )}
      
      <div style={{ flex: 1 }}>
        <p style={{ 
          margin: 0, 
          fontSize: 13, 
          fontWeight: 700, 
          color: isError ? "#991b1b" : "#166534" 
        }}>
          {isError ? "Invalid Action" : "Success"}
        </p>
        <p style={{ 
          margin: 0, 
          fontSize: 12, 
          color: isError ? "#b91c1c" : "#15803d",
          opacity: 0.9 
        }}>
          {notification.message}
        </p>
      </div>

      <button 
        onClick={() => setNotification(null)}
        style={{ 
          background: "none", 
          border: "none", 
          cursor: "pointer", 
          padding: 4,
          display: "flex",
          color: isError ? "#ef4444" : "#22c55e",
          opacity: 0.7
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
