"use client";

import React, { useState, useRef, useEffect } from "react";
import type { FilterState, FileExtension } from "@/lib/atlas-types";

interface AtlasToolbarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onAddNode: (extension: FileExtension) => void;
  onUploadClick: () => void;
}

const FILE_TYPE_OPTIONS: { label: string; extension: FileExtension }[] = [
  { label: "Design File", extension: ".fig" },
  { label: "Document", extension: ".pdf" },
  { label: "Video", extension: ".mp4" },
  { label: "Image", extension: ".psd" },
  { label: "Brand Asset", extension: ".ai" },
];

export function AtlasToolbar({ filters, onFiltersChange, onAddNode, onUploadClick }: AtlasToolbarProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setShowAddMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className="h-14 flex items-center justify-between px-4"
      style={{
        backgroundColor: "#0d0d0d",
        borderBottom: "1px solid #222222",
      }}
    >
      {/* Left: Logo */}
      <div className="flex items-center">
        <img 
          src="/atlas-logo.svg" 
          alt="Atlas" 
          className="h-6"
          style={{ width: "auto" }}
        />
      </div>

      {/* Center: Controls */}
      <div className="flex items-center gap-3">
        {/* Add node button */}
        <div className="relative" ref={addMenuRef}>
          <button
            type="button"
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/10 transition-colors"
            style={{ backgroundColor: showAddMenu ? "rgba(255,255,255,0.1)" : "transparent" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 3V13M3 8H13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          {showAddMenu && (
            <div
              className="absolute top-full left-0 mt-2 py-1 rounded-lg shadow-lg z-50"
              style={{ backgroundColor: "#1a1a1a", border: "1px solid #333333", minWidth: 160 }}
            >
              {FILE_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.extension}
                  type="button"
                  onClick={() => {
                    onAddNode(option.extension);
                    setShowAddMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                  style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-6" style={{ backgroundColor: "#333333" }} />

        {/* Product filter */}
        <div className="flex items-center gap-1 rounded-lg p-1" style={{ backgroundColor: "#1a1a1a" }}>
          {(["all", "atlas", "synthesis", "sage"] as const).map((product) => (
            <button
              key={product}
              type="button"
              onClick={() => onFiltersChange({ ...filters, product })}
              className="px-3 py-1 rounded text-xs font-medium transition-colors"
              style={{
                fontFamily: "system-ui, Inter, sans-serif",
                backgroundColor: filters.product === product ? "#333333" : "transparent",
                color: filters.product === product ? "white" : "#888888",
              }}
            >
              {product === "all" ? "All" : product.charAt(0).toUpperCase() + product.slice(1)}
            </button>
          ))}
        </div>

        <div className="w-px h-6" style={{ backgroundColor: "#333333" }} />

        {/* Status filter */}
        <div className="flex items-center gap-1 rounded-lg p-1" style={{ backgroundColor: "#1a1a1a" }}>
          {(["all", "draft", "in-review", "approved"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => onFiltersChange({ ...filters, status })}
              className="px-3 py-1 rounded text-xs font-medium transition-colors"
              style={{
                fontFamily: "system-ui, Inter, sans-serif",
                backgroundColor: filters.status === status ? "#333333" : "transparent",
                color: filters.status === status ? "white" : "#888888",
              }}
            >
              {status === "all" ? "All" : status === "in-review" ? "In Review" : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Upload button */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={onUploadClick}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ 
            backgroundColor: "#534AB7", 
            color: "white",
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
