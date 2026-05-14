"use client";

import React, { useRef } from "react";

interface AddNodeMenuProps {
  onAddStatusPill: () => void;
  onAddTextNode: (textType: "brief" | "note" | "description") => void;
  onUploadFile: (files: FileList) => void;
  onClose: () => void;
  position?: { x: number; y: number };
  sourceNodeId?: string;
  sourceHandlePosition?: "left" | "right";
}

export function AddNodeMenu({
  onAddStatusPill,
  onAddTextNode,
  onUploadFile,
  onClose,
  position,
  sourceHandlePosition,
}: AddNodeMenuProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Calculate position styles
  const positionStyles = position
    ? {
        position: "fixed" as const,
        left: position.x,
        top: position.y,
        transform: sourceHandlePosition === "left" ? "translateX(-100%)" : "translateX(0)",
      }
    : {};

  return (
    <>
      {/* Backdrop to close menu */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Menu */}
      <div
        className="py-1 rounded-lg shadow-lg z-50"
        style={{ 
          backgroundColor: "#1a1a1a", 
          border: "1px solid #333333", 
          width: 160,
          ...positionStyles,
        }}
      >
        {/* Text Nodes Section */}
        <div className="px-3 py-1 text-xs text-gray-500 uppercase tracking-wide" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
          Text
        </div>
        <button
          type="button"
          onClick={() => {
            onAddTextNode("brief");
            onClose();
          }}
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
          onClick={() => {
            onAddTextNode("note");
            onClose();
          }}
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
          onClick={() => {
            onAddTextNode("description");
            onClose();
          }}
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
        
        {/* Divider */}
        <div className="h-px mx-2 my-1" style={{ backgroundColor: "#333333" }} />
        
        {/* Status Pill Option */}
        <div className="px-3 py-1 text-xs text-gray-500 uppercase tracking-wide" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
          Elements
        </div>
        <button
          type="button"
          onClick={() => {
            onAddStatusPill();
            onClose();
          }}
          className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
          style={{ fontFamily: "system-ui, Inter, sans-serif" }}
        >
          <div className="w-4 h-2.5 rounded-full" style={{ backgroundColor: "#e5e5e5" }} />
          Status Pill
        </button>
        
        {/* Divider */}
        <div className="h-px mx-2 my-1" style={{ backgroundColor: "#333333" }} />
        
        {/* File Upload Section */}
        <div className="px-3 py-1 text-xs text-gray-500 uppercase tracking-wide" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
          Files
        </div>
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
    </>
  );
}
