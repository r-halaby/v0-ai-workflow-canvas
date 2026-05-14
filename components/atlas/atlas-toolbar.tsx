"use client";

import React from "react";

interface AtlasToolbarProps {
  canvasName?: string;
  onBack?: () => void;
}

export function AtlasToolbar({ canvasName, onBack }: AtlasToolbarProps) {
  return (
    <div className="fixed top-4 left-4 z-50 flex items-center gap-3">
      {/* Atlas Logo - clickable to go home */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center opacity-80 hover:opacity-100 transition-opacity"
      >
        <img 
          src="/atlas-logo.svg" 
          alt="Atlas" 
          className="h-5"
          style={{ width: "auto" }}
        />
      </button>

      {/* Separator and Canvas Name */}
      {canvasName && (
        <>
          <span className="text-gray-600">|</span>
          <span
            className="text-sm text-gray-400"
            style={{ fontFamily: "system-ui, Inter, sans-serif" }}
          >
            {canvasName}
          </span>
        </>
      )}
    </div>
  );
}
