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
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState(position || { x: 200, y: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

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

  return (
    <>
      {/* Backdrop to close menu */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
      
      {/* Menu */}
      <div
        ref={menuRef}
        className="rounded-lg shadow-lg z-50 select-none"
        style={{ 
          backgroundColor: "#1a1a1a", 
          border: "1px solid #333333", 
          width: 180,
          position: "fixed",
          left: menuPosition.x,
          top: menuPosition.y,
          transform: sourceHandlePosition === "left" ? "translateX(-100%)" : "translateX(0)",
          cursor: isDragging ? "grabbing" : "default",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Drag Handle */}
        <div 
          className="px-3 py-2 flex items-center justify-between border-b cursor-grab active:cursor-grabbing"
          style={{ borderColor: "#333333" }}
          onMouseDown={handleMouseDown}
        >
          <span className="text-xs font-medium text-gray-400" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
            Add Node
          </span>
          <div className="flex gap-0.5">
            <div className="w-1 h-1 rounded-full bg-gray-600" />
            <div className="w-1 h-1 rounded-full bg-gray-600" />
            <div className="w-1 h-1 rounded-full bg-gray-600" />
          </div>
        </div>

        <div className="menu-content py-1">
          {/* Text - with hover submenu */}
          <div 
            className="relative"
            onMouseEnter={() => setHoveredSection("text")}
            onMouseLeave={() => setHoveredSection(null)}
          >
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-between"
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            >
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: "#3B82F620", color: "#3B82F6" }}>
                  <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                    <path d="M2 4H12M2 7H10M2 10H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                Text
              </span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-gray-500">
                <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
            {/* Text Submenu */}
            {hoveredSection === "text" && (
              <div 
                className="absolute left-full top-0 ml-1 py-1 rounded-lg shadow-lg"
                style={{ backgroundColor: "#1a1a1a", border: "1px solid #333333", width: 150 }}
              >
                <button
                  type="button"
                  onClick={() => { onAddTextNode("brief"); onClose(); }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                  style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                >
                  <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: "#3B82F620", color: "#3B82F6" }}>
                    <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                      <rect x="2" y="2" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  </div>
                  Creative Brief
                </button>
                <button
                  type="button"
                  onClick={() => { onAddTextNode("note"); onClose(); }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                  style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                >
                  <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: "#F59E0B20", color: "#F59E0B" }}>
                    <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                      <path d="M2 4H12M2 7H10M2 10H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  Note
                </button>
                <button
                  type="button"
                  onClick={() => { onAddTextNode("description"); onClose(); }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                  style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                >
                  <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: "#8B5CF620", color: "#8B5CF6" }}>
                    <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                      <path d="M2 4H12M2 7H10M2 10H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  Description
                </button>
              </div>
            )}
          </div>

          {/* Status Pill */}
          <button
            type="button"
            onClick={() => { onAddStatusPill(); onClose(); }}
            className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
            style={{ fontFamily: "system-ui, Inter, sans-serif" }}
          >
            <div className="w-4 h-2.5 rounded-full" style={{ backgroundColor: "#e5e5e5" }} />
            Status Pill
          </button>
          
          {/* Divider */}
          <div className="h-px mx-2 my-1" style={{ backgroundColor: "#333333" }} />
          
          {/* Sage - with hover submenu */}
          <div 
            className="relative"
            onMouseEnter={() => setHoveredSection("sage")}
            onMouseLeave={() => setHoveredSection(null)}
          >
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-between"
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            >
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: "#F0FE0020", color: "#F0FE00" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z" />
                  </svg>
                </div>
                Sage
              </span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-gray-500">
                <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
            {/* Sage Submenu */}
            {hoveredSection === "sage" && (
              <div 
                className="absolute left-full top-0 ml-1 py-1 rounded-lg shadow-lg"
                style={{ backgroundColor: "#1a1a1a", border: "1px solid #333333", width: 150 }}
              >
                <button
                  type="button"
                  onClick={() => { onAddSageNode("chatbot"); onClose(); }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                  style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                >
                  <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: "#F0FE0020", color: "#F0FE00" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  Sage Chat
                </button>
                <button
                  type="button"
                  onClick={() => { onAddSageNode("overview"); onClose(); }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                  style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                >
                  <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: "#F0FE0020", color: "#F0FE00" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 3v18h18" />
                      <path d="M18 17l-5-5-4 4-3-3" />
                    </svg>
                  </div>
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => { onAddSageNode("stakeholder"); onClose(); }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                  style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                >
                  <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: "#F0FE0020", color: "#F0FE00" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="7" r="4" />
                      <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
                    </svg>
                  </div>
                  Stakeholder
                </button>
              </div>
            )}
          </div>
          
          {/* Divider */}
          <div className="h-px mx-2 my-1" style={{ backgroundColor: "#333333" }} />
          
          {/* Operations - with hover submenu */}
          <div 
            className="relative"
            onMouseEnter={() => setHoveredSection("operations")}
            onMouseLeave={() => setHoveredSection(null)}
          >
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-between"
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            >
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: "#3b82f620", color: "#3b82f6" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3v18h18" />
                    <path d="M7 16l4-8 4 4 6-6" />
                  </svg>
                </div>
                Operations
              </span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-gray-500">
                <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
            {/* Operations Submenu */}
            {hoveredSection === "operations" && (
              <div 
                className="absolute left-full top-0 ml-1 py-1 rounded-lg shadow-lg"
                style={{ backgroundColor: "#1a1a1a", border: "1px solid #333333", width: 150 }}
              >
                <button
                  type="button"
                  onClick={() => { onAddOperationalNode("capacity"); onClose(); }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                  style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                >
                  <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: "#3b82f620", color: "#3b82f6" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                    </svg>
                  </div>
                  Capacity
                </button>
                <button
                  type="button"
                  onClick={() => { onAddOperationalNode("financial"); onClose(); }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                  style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                >
                  <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: "#10b98120", color: "#10b981" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </div>
                  Financial
                </button>
                <button
                  type="button"
                  onClick={() => { onAddOperationalNode("projectHealth"); onClose(); }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                  style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                >
                  <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: "#8b5cf620", color: "#8b5cf6" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  </div>
                  Project Health
                </button>
                <button
                  type="button"
                  onClick={() => { onAddOperationalNode("pipeline"); onClose(); }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                  style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                >
                  <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: "#f59e0b20", color: "#f59e0b" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 3v18h18" />
                      <path d="M7 16l4-8 4 4 6-6" />
                    </svg>
                  </div>
                  Pipeline
                </button>
                <button
                  type="button"
                  onClick={() => { onAddOperationalNode("teamHealth"); onClose(); }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                  style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                >
                  <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: "#ec489920", color: "#ec4899" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                  </div>
                  Team Health
                </button>
              </div>
            )}
          </div>
          
          {/* Divider */}
          <div className="h-px mx-2 my-1" style={{ backgroundColor: "#333333" }} />
          
          {/* File Upload */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
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
            className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
            style={{ fontFamily: "system-ui, Inter, sans-serif" }}
          >
            <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: "#52525b20", color: "#a1a1aa" }}>
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                <path d="M7 2V12M2 7H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            Upload File
          </button>
        </div>
      </div>
    </>
  );
}
