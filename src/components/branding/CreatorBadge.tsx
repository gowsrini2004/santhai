"use client";

import { useState, useEffect, useRef } from "react";
import { Heart, Mail } from "lucide-react";

export default function CreatorBadge() {
  const [isExpanded, setIsExpanded] = useState(false);
  const badgeRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-hide after 5 seconds and click outside
  useEffect(() => {
    if (isExpanded) {
      // Start 5s timer
      timerRef.current = setTimeout(() => {
        setIsExpanded(false);
      }, 3000);

      // Handle click outside
      const handleClickOutside = (e: MouseEvent) => {
        if (badgeRef.current && !badgeRef.current.contains(e.target as Node)) {
          setIsExpanded(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isExpanded]);

  return (
    <div 
      style={{
        position: "fixed",
        left: 0,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 1001,
        pointerEvents: "none", // Click through the container
      }}
    >
      <div 
        ref={badgeRef}
        onClick={(e) => {
          e.stopPropagation();
          if (timerRef.current) clearTimeout(timerRef.current);
          setIsExpanded(!isExpanded);
        }}
        style={{
          pointerEvents: "auto", // Only the tab is clickable
          cursor: "pointer",
          background: "rgba(109, 40, 217, 0.95)",
          backdropFilter: "blur(12px)",
          color: "white",
          padding: "12px 16px",
          borderRadius: "0 20px 20px 0",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          boxShadow: "4px 0 20px rgba(109, 40, 217, 0.3)",
          transform: isExpanded ? "translateX(0)" : "translateX(calc(-100% + 40px))",
          transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          maxWidth: 300,
          border: "1.5px solid rgba(255, 255, 255, 0.2)",
          borderLeft: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, whiteSpace: "nowrap" }}>
          <span style={{ fontWeight: 800, fontSize: 12, letterSpacing: 0.5, flex: 1 }}>
            created with passion by <span style={{ color: "#fbbf24" }}>PANDA</span>
          </span>
          <div style={{
            width: 24, height: 24, background: "white", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
          }}>
            <Heart size={14} fill="#ef4444" color="#ef4444" />
          </div>
        </div>

        {isExpanded && (
          <div style={{
            marginTop: 4, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.1)",
            display: "flex", flexDirection: "column", gap: 6
          }}>
            <a href="mailto:gowsrini2004@gmail.com" style={{
              color: "white", fontSize: 11, textDecoration: "none",
              display: "flex", alignItems: "center", gap: 6, opacity: 0.9
            }}>
              <Mail size={12} /> gowsrini2004@gmail.com
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
