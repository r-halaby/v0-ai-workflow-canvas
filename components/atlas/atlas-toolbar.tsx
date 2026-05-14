"use client";

import React, { useState } from "react";

interface AtlasToolbarProps {
  canvasName?: string;
  onBack?: () => void;
}

export function AtlasToolbar({ canvasName, onBack }: AtlasToolbarProps) {
  const [showCanvasName, setShowCanvasName] = useState(false);

  return (
    <>
      {/* Floating Logo - Top Left */}
      <div 
        className="fixed top-4 left-4 z-50 cursor-pointer"
        onClick={onBack}
        onMouseEnter={() => setShowCanvasName(true)}
        onMouseLeave={() => setShowCanvasName(false)}
      >
        <img 
          src="/atlas-logo.svg" 
          alt="Atlas" 
          className="h-5 opacity-80 hover:opacity-100 transition-opacity"
          style={{ width: "auto" }}
        />
      </div>

      {/* Floating Canvas Name - appears on hover near logo */}
      {canvasName && (
        <div 
          className={`fixed top-4 left-14 z-50 transition-all duration-200 ${
            showCanvasName ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none"
          }`}
        >
          <span
            className="text-sm text-gray-400"
            style={{ fontFamily: "system-ui, Inter, sans-serif" }}
          >
            {canvasName}
          </span>
        </div>
      )}
    </>
  );
}
