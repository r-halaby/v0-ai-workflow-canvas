"use client";

import React, { useRef, useState, useCallback } from "react";

interface AddNodeMenuProps {
  onAddStatusPill: () => void;
  onAddTextNode: (textType: "brief" | "note" | "description") => void;
  onAddSageNode: (sageType: "chatbot" | "overview" | "stakeholder") => void;
  onAddOperationalNode: (opType: "capacity" | "financial" | "projectHealth" | "pipeline" | "teamHealth") => void;
  onUploadFile: (files: FileList) => void;
  onClose: () => void;
  position?: { x: number; y: number };
  sourceNodeId?: string;
  sourceHandlePosition?: "left" | "right";
}

export function AddNodeMenu({
  onAddStatusPill,
  onAddTextNode,
  onAddSageNode,
  onAddOperationalNode,
  onUploadFile,
  onClose,
  position,
  sourceHandlePosition,
}: AddNodeMenuProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [menuPosition, setMenuPosition] = useState(position || { x: 200, y: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.menu-content')) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - menuPosition.x,
      y: e.clientY - menuPosition.y,
    });
  }, [menuPosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setMenuPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y,
    });
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const fontStyle = { fontFamily: "system-ui, Inter, sans-serif" };

  const menuItemStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    textAlign: "left",
    fontSize: 14,
    color: "#d1d5db",
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
    ...fontStyle,
  };

  const submenuItemStyle: React.CSSProperties = {
    ...menuItemStyle,
    fontSize: 13,
    padding: "8px 12px",
  };

  return (
    <>
      {/* Backdrop to close menu */}
      <div 
        style={{ position: "fixed", inset: 0, zIndex: 40 }}
        onClick={onClose}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
      
      {/* Menu */}
      <div
        style={{ 
          backgroundColor: "#1a1a1a", 
          border: "1px solid #333333",
          borderRadius: 8,
          width: 180,
          position: "fixed",
          left: menuPosition.x,
          top: menuPosition.y,
          transform: sourceHandlePosition === "left" ? "translateX(-100%)" : "translateX(0)",
          cursor: isDragging ? "grabbing" : "default",
          maxHeight: "80vh",
          overflowY: "auto",
          zIndex: 50,
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Drag Handle */}
        <div 
          style={{ 
            padding: "8px 12px", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between",
            borderBottom: "1px solid #333333",
            cursor: isDragging ? "grabbing" : "grab",
          }}
          onMouseDown={handleMouseDown}
        >
          <span style={{ fontSize: 12, fontWeight: 500, color: "#9ca3af", ...fontStyle }}>
            Add Node
          </span>
          <div style={{ display: "flex", gap: 2 }}>
            <div style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "#666" }} />
            <div style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "#666" }} />
            <div style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "#666" }} />
          </div>
        </div>

        <div className="menu-content" style={{ padding: "4px 0" }}>
          {/* Text - with submenu */}
          <div 
            style={{ position: "relative" }}
            onMouseEnter={() => setOpenSubmenu("text")}
            onMouseLeave={() => setOpenSubmenu(null)}
          >
            <div
              style={{
                ...menuItemStyle,
                justifyContent: "space-between",
                backgroundColor: openSubmenu === "text" ? "rgba(255,255,255,0.1)" : "transparent",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: "#3B82F620", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                    <path d="M2 4H12M2 7H10M2 10H8" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                Text
              </span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4.5 3L7.5 6L4.5 9" stroke="#888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            
            {/* Text Submenu */}
            {openSubmenu === "text" && (
              <div 
                style={{ 
                  position: "absolute", 
                  left: "100%", 
                  top: 0, 
                  marginLeft: 4,
                  backgroundColor: "#1a1a1a", 
                  border: "1px solid #333333",
                  borderRadius: 8,
                  padding: "4px 0",
                  width: 150,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                  zIndex: 60,
                }}
              >
                <button 
                  type="button" 
                  onClick={() => { onAddTextNode("brief"); onClose(); }} 
                  style={submenuItemStyle}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  Creative Brief
                </button>
                <button 
                  type="button" 
                  onClick={() => { onAddTextNode("note"); onClose(); }} 
                  style={submenuItemStyle}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  Note
                </button>
                <button 
                  type="button" 
                  onClick={() => { onAddTextNode("description"); onClose(); }} 
                  style={submenuItemStyle}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  Description
                </button>
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: 1, margin: "4px 8px", backgroundColor: "#333333" }} />

          {/* Status Pill */}
          <button
            type="button"
            onClick={() => { onAddStatusPill(); onClose(); }}
            style={menuItemStyle}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"; setOpenSubmenu(null); }}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            <div style={{ width: 16, height: 10, borderRadius: 5, backgroundColor: "#e5e5e5" }} />
            Status Pill
          </button>
          
          {/* Divider */}
          <div style={{ height: 1, margin: "4px 8px", backgroundColor: "#333333" }} />
          
          {/* Sage - with submenu */}
          <div 
            style={{ position: "relative" }}
            onMouseEnter={() => setOpenSubmenu("sage")}
            onMouseLeave={() => setOpenSubmenu(null)}
          >
            <div
              style={{
                ...menuItemStyle,
                justifyContent: "space-between",
                backgroundColor: openSubmenu === "sage" ? "rgba(255,255,255,0.1)" : "transparent",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <img src="/sage-logo.svg" alt="Sage" style={{ width: 16, height: 16 }} />
                Sage
              </span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4.5 3L7.5 6L4.5 9" stroke="#888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            
            {/* Sage Submenu */}
            {openSubmenu === "sage" && (
              <div 
                style={{ 
                  position: "absolute", 
                  left: "100%", 
                  top: 0, 
                  marginLeft: 4,
                  backgroundColor: "#1a1a1a", 
                  border: "1px solid #333333",
                  borderRadius: 8,
                  padding: "4px 0",
                  width: 150,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                  zIndex: 60,
                }}
              >
                <button 
                  type="button" 
                  onClick={() => { onAddSageNode("chatbot"); onClose(); }} 
                  style={submenuItemStyle}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  Sage Chat
                </button>
                <button 
                  type="button" 
                  onClick={() => { onAddSageNode("overview"); onClose(); }} 
                  style={submenuItemStyle}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  Overview
                </button>
                <button 
                  type="button" 
                  onClick={() => { onAddSageNode("stakeholder"); onClose(); }} 
                  style={submenuItemStyle}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  Stakeholder
                </button>
              </div>
            )}
          </div>
          
          {/* Divider */}
          <div style={{ height: 1, margin: "4px 8px", backgroundColor: "#333333" }} />
          
          {/* Ops Data - with submenu */}
          <div 
            style={{ position: "relative" }}
            onMouseEnter={() => setOpenSubmenu("ops")}
            onMouseLeave={() => setOpenSubmenu(null)}
          >
            <div
              style={{
                ...menuItemStyle,
                justifyContent: "space-between",
                backgroundColor: openSubmenu === "ops" ? "rgba(255,255,255,0.1)" : "transparent",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: "#8b5cf620", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                    <path d="M3 3v18h18" />
                    <path d="M7 16l4-8 4 4 6-6" />
                  </svg>
                </div>
                Ops Data
              </span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4.5 3L7.5 6L4.5 9" stroke="#888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            
            {/* Ops Data Submenu */}
            {openSubmenu === "ops" && (
              <div 
                style={{ 
                  position: "absolute", 
                  left: "100%", 
                  top: 0, 
                  marginLeft: 4,
                  backgroundColor: "#1a1a1a", 
                  border: "1px solid #333333",
                  borderRadius: 8,
                  padding: "4px 0",
                  width: 150,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                  zIndex: 60,
                }}
              >
                <button 
                  type="button" 
                  onClick={() => { onAddOperationalNode("capacity"); onClose(); }} 
                  style={submenuItemStyle}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  Capacity
                </button>
                <button 
                  type="button" 
                  onClick={() => { onAddOperationalNode("financial"); onClose(); }} 
                  style={submenuItemStyle}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  Financial
                </button>
                <button 
                  type="button" 
                  onClick={() => { onAddOperationalNode("projectHealth"); onClose(); }} 
                  style={submenuItemStyle}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  Project Health
                </button>
                <button 
                  type="button" 
                  onClick={() => { onAddOperationalNode("pipeline"); onClose(); }} 
                  style={submenuItemStyle}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  Pipeline
                </button>
                <button 
                  type="button" 
                  onClick={() => { onAddOperationalNode("teamHealth"); onClose(); }} 
                  style={submenuItemStyle}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  Team Health
                </button>
              </div>
            )}
          </div>
          
          {/* Divider */}
          <div style={{ height: 1, margin: "4px 8px", backgroundColor: "#333333" }} />
          
          {/* File Upload */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onUploadFile(e.target.files);
                onClose();
              }
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={menuItemStyle}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"; setOpenSubmenu(null); }}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            <div style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: "#52525b20", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                <path d="M7 2V12M2 7H12" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            Upload File
          </button>
        </div>
      </div>
    </>
  );
}
