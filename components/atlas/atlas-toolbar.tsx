"use client";

import React from "react";

interface AtlasToolbarProps {
  onUploadClick: () => void;
  canvasName?: string;
  onBack?: () => void;
}

export function AtlasToolbar({ onUploadClick, canvasName, onBack }: AtlasToolbarProps) {
  return (
    <>
      {/* Floating Logo - Top Left */}
      <div className="fixed top-4 left-4 z-50">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:bg-white/10"
          style={{ backgroundColor: "#141414", border: "1px solid #2a2a2a" }}
        >
          <img 
            src="/atlas-logo.svg" 
            alt="Atlas" 
            className="h-5"
            style={{ width: "auto" }}
          />
        </button>
      </div>

      {/* Floating Canvas Name - Top Center */}
      {canvasName && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div
            className="px-4 py-2 rounded-lg"
            style={{ 
              backgroundColor: "#141414", 
              border: "1px solid #2a2a2a",
            }}
          >
            <span
              className="text-sm text-white font-medium"
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            >
              {canvasName}
            </span>
          </div>
        </div>
      )}

      {/* Floating Upload Button - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <button
          type="button"
          onClick={onUploadClick}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
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
    </>
  );
}
