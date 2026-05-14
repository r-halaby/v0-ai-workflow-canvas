"use client";

import React from "react";

interface AtlasToolbarProps {
  onUploadClick: () => void;
  canvasName?: string;
  onBack?: () => void;
}

export function AtlasToolbar({ onUploadClick, canvasName, onBack }: AtlasToolbarProps) {
  return (
    <div
      className="h-14 flex items-center justify-between px-4"
      style={{
        backgroundColor: "#0d0d0d",
        borderBottom: "1px solid #222222",
      }}
    >
      {/* Left: Logo + Back + Canvas Name */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 14L6 9L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        <img 
          src="/atlas-logo.svg" 
          alt="Atlas" 
          className="h-6"
          style={{ width: "auto" }}
        />
        {canvasName && (
          <>
            <div className="w-px h-5" style={{ backgroundColor: "#333333" }} />
            <span
              className="text-sm text-white font-medium truncate max-w-[200px]"
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            >
              {canvasName}
            </span>
          </>
        )}
      </div>

      {/* Right: Upload button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onUploadClick}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ 
            backgroundColor: "#F0FE00", 
            color: "#121212",
            fontFamily: "system-ui, Inter, sans-serif",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 12V3M8 3L4 7M8 3L12 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 13H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Upload
        </button>
      </div>
    </div>
  );
}
