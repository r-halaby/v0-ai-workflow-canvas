"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import type { MoodboardNodeData, MoodboardImagePosition } from "@/lib/atlas-types";

type LayoutMode = "masonry" | "freeform" | "grid";

interface MoodboardExpandedProps {
  data: MoodboardNodeData;
  onClose: () => void;
  onUngroup: () => void;
  onDataChange?: (data: MoodboardNodeData) => void;
}

export function MoodboardExpanded({ data, onClose, onUngroup, onDataChange }: MoodboardExpandedProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("masonry");
  const [positions, setPositions] = useState<Record<string, MoodboardImagePosition>>(() => {
    return data.freeformPositions || {};
  });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const maxZIndexRef = useRef(data.images?.length || 0);

  // Calculate non-overlapping initial positions for images without saved positions
  const initialPositions = useMemo(() => {
    if (!data.images) return {};
    
    const cols = 4;
    const imageWidth = 220;
    const imageHeight = 180;
    const gap = 24;
    const padding = 24;
    
    const newPositions: Record<string, MoodboardImagePosition> = {};
    
    data.images.forEach((img, index) => {
      // Use saved position if available
      if (positions[img.id]) {
        newPositions[img.id] = positions[img.id];
      } else {
        // Calculate grid position to avoid overlap
        const col = index % cols;
        const row = Math.floor(index / cols);
        newPositions[img.id] = {
          x: padding + col * (imageWidth + gap),
          y: padding + row * (imageHeight + gap),
          zIndex: index + 1,
        };
      }
    });
    
    return newPositions;
  }, [data.images, positions]);

  // Merge saved positions with initial positions
  const currentPositions = useMemo(() => {
    return { ...initialPositions, ...positions };
  }, [initialPositions, positions]);

  // Auto-save positions when they change
  useEffect(() => {
    if (Object.keys(positions).length > 0 && onDataChange) {
      const timeoutId = setTimeout(() => {
        onDataChange({
          ...data,
          freeformPositions: positions,
        });
      }, 300); // Debounce saves
      return () => clearTimeout(timeoutId);
    }
  }, [positions, data, onDataChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent, imageId: string) => {
    if (layoutMode !== "freeform") return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setDraggingId(imageId);
    setSelectedImage(imageId);
    
    // Bring to front
    maxZIndexRef.current += 1;
    setPositions(prev => ({
      ...prev,
      [imageId]: {
        ...currentPositions[imageId],
        zIndex: maxZIndexRef.current,
      },
    }));
  }, [layoutMode, currentPositions]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggingId || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newX = e.clientX - containerRect.left - dragOffset.x;
    const newY = e.clientY - containerRect.top - dragOffset.y;
    
    setPositions(prev => ({
      ...prev,
      [draggingId]: {
        ...prev[draggingId],
        x: Math.max(0, newX),
        y: Math.max(0, newY),
        zIndex: prev[draggingId]?.zIndex || maxZIndexRef.current,
      },
    }));
  }, [draggingId, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setDraggingId(null);
  }, []);

  // Handle mouse leave from container
  const handleMouseLeave = useCallback(() => {
    if (draggingId) {
      setDraggingId(null);
    }
  }, [draggingId]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
    >
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Content */}
      <div 
        className="relative w-full max-w-5xl max-h-[90vh] mx-4 rounded-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: "#1a1a1a", border: "1px solid #333333" }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "#333333" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#ffffff20" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                {data.label || "Moodboard"} ({data.images?.length || 0})
              </h2>
              <p className="text-sm text-gray-400" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                {data.images?.length || 0} images
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Layout Toggle */}
            <div 
              className="flex items-center gap-1 p-1 rounded-lg"
              style={{ backgroundColor: "#ffffff08" }}
            >
              {/* Masonry */}
              <button
                type="button"
                onClick={() => setLayoutMode("masonry")}
                className="p-2 rounded-md transition-colors"
                style={{
                  backgroundColor: layoutMode === "masonry" ? "#ffffff15" : "transparent",
                  color: layoutMode === "masonry" ? "#ffffff" : "#666666",
                }}
                title="Masonry layout"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="1" width="6" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                  <rect x="9" y="1" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                  <rect x="1" y="11" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                  <rect x="9" y="8" width="6" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </button>
              
              {/* Freeform */}
              <button
                type="button"
                onClick={() => setLayoutMode("freeform")}
                className="p-2 rounded-md transition-colors"
                style={{
                  backgroundColor: layoutMode === "freeform" ? "#ffffff15" : "transparent",
                  color: layoutMode === "freeform" ? "#ffffff" : "#666666",
                }}
                title="Freeform layout"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="2" width="5" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.5" transform="rotate(-5 1 2)"/>
                  <rect x="8" y="1" width="6" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.5" transform="rotate(3 8 1)"/>
                  <rect x="2" y="9" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.5" transform="rotate(8 2 9)"/>
                  <rect x="9" y="8" width="5" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.5" transform="rotate(-3 9 8)"/>
                </svg>
              </button>
              
              {/* Grid */}
              <button
                type="button"
                onClick={() => setLayoutMode("grid")}
                className="p-2 rounded-md transition-colors"
                style={{
                  backgroundColor: layoutMode === "grid" ? "#ffffff15" : "transparent",
                  color: layoutMode === "grid" ? "#ffffff" : "#666666",
                }}
                title="Grid layout"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                  <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                  <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                  <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </button>
            </div>

            {/* Ungroup button */}
            <button
              type="button"
              onClick={onUngroup}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-white/10"
              style={{
                backgroundColor: "#ffffff08",
                color: "#888888",
                fontFamily: "system-ui, Inter, sans-serif",
              }}
            >
              Ungroup
            </button>
            
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12 4L4 12M4 4L12 12" stroke="#888888" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Masonry Layout */}
          {layoutMode === "masonry" && (
            <div 
              className="columns-2 md:columns-3 lg:columns-4 gap-4"
              style={{ columnFill: "balance" }}
            >
              {data.images?.map((img) => (
                <div
                  key={img.id}
                  className="mb-4 break-inside-avoid cursor-pointer group"
                  onClick={() => setSelectedImage(img.id === selectedImage ? null : img.id)}
                >
                  <div 
                    className="relative rounded-xl overflow-hidden transition-all duration-200"
                    style={{
                      border: selectedImage === img.id ? "2px solid #ffffff" : "1px solid transparent",
                    }}
                  >
                    <img
                      src={img.url}
                      alt={img.fileName}
                      className="w-full h-auto object-contain"
                      draggable={false}
                    />
                    
                    {/* Hover overlay */}
                    <div 
                      className="absolute inset-0 flex items-end opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "linear-gradient(transparent 50%, rgba(0,0,0,0.8))" }}
                    >
                      <div className="p-3 w-full">
                        <p className="text-sm text-white truncate" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                          {img.fileName}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Freeform Layout */}
          {layoutMode === "freeform" && (
            <div 
              ref={containerRef}
              className="relative w-full select-none"
              style={{ minHeight: "600px", cursor: draggingId ? "grabbing" : "default" }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            >
              {data.images?.map((img) => {
                const pos = currentPositions[img.id] || { x: 0, y: 0, zIndex: 1 };
                const isSelected = selectedImage === img.id;
                const isDragging = draggingId === img.id;
                
                return (
                  <div
                    key={img.id}
                    className="absolute group"
                    style={{
                      left: pos.x,
                      top: pos.y,
                      zIndex: pos.zIndex,
                      cursor: isDragging ? "grabbing" : "grab",
                      transition: isDragging ? "none" : "box-shadow 0.2s ease",
                    }}
                    onMouseDown={(e) => handleMouseDown(e, img.id)}
                  >
                    <div 
                      className="relative rounded-xl overflow-hidden transition-all duration-200"
                      style={{
                        maxWidth: "220px",
                        border: isSelected ? "2px solid #ffffff" : "none",
                        boxShadow: isDragging 
                          ? "0 20px 40px rgba(0,0,0,0.5)" 
                          : "0 4px 12px rgba(0,0,0,0.3)",
                        transform: isDragging ? "scale(1.02)" : "scale(1)",
                      }}
                    >
                      <img
                        src={img.url}
                        alt={img.fileName}
                        className="w-full h-auto object-contain"
                        draggable={false}
                      />
                      
                      {/* Hover overlay */}
                      <div 
                        className="absolute inset-0 flex items-end opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                        style={{ background: "linear-gradient(transparent 50%, rgba(0,0,0,0.8))" }}
                      >
                        <div className="p-3 w-full">
                          <p className="text-sm text-white truncate" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                            {img.fileName}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Grid Layout - 1:1 aspect ratio with object-cover */}
          {layoutMode === "grid" && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data.images?.map((img) => (
                <div
                  key={img.id}
                  className="cursor-pointer group"
                  onClick={() => setSelectedImage(img.id === selectedImage ? null : img.id)}
                >
                  <div 
                    className="relative rounded-xl overflow-hidden transition-all duration-200 aspect-square"
                    style={{
                      border: selectedImage === img.id ? "2px solid #ffffff" : "1px solid #333333",
                    }}
                  >
                    <img
                      src={img.url}
                      alt={img.fileName}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                    
                    {/* Hover overlay */}
                    <div 
                      className="absolute inset-0 flex items-end opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "linear-gradient(transparent 50%, rgba(0,0,0,0.8))" }}
                    >
                      <div className="p-3 w-full">
                        <p className="text-sm text-white truncate" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                          {img.fileName}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
