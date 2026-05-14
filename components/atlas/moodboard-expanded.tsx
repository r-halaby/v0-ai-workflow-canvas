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

type PresentationLayout = "list" | "grid" | "columns" | "freeform";

export function MoodboardExpanded({ data, onClose, onUngroup, onDataChange }: MoodboardExpandedProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("masonry");
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [presentationLayout, setPresentationLayout] = useState<PresentationLayout>("columns");
  const [positions, setPositions] = useState<Record<string, MoodboardImagePosition>>(() => {
    return data.freeformPositions || {};
  });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const maxZIndexRef = useRef(data.images?.length || 0);

  // Seeded random number generator for consistent positions
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  // Calculate scattered initial positions for images without saved positions
  const initialPositions = useMemo(() => {
    if (!data.images) return {};
    
    const newPositions: Record<string, MoodboardImagePosition> = {};
    const imageCount = data.images.length;
    
    // Create a scattered layout that clusters toward center with organic spread
    data.images.forEach((img, index) => {
      // Use saved position if available
      if (positions[img.id]) {
        newPositions[img.id] = positions[img.id];
      } else {
        // Generate deterministic but scattered positions
        const seed = img.id.charCodeAt(0) + index * 137;
        
        // Spread across the canvas with some clustering
        const angle = (index / imageCount) * Math.PI * 2 + seededRandom(seed) * 0.8;
        const radius = 150 + seededRandom(seed + 1) * 300 + (index % 3) * 100;
        
        // Center point offset
        const centerX = 450;
        const centerY = 280;
        
        const x = centerX + Math.cos(angle) * radius * 0.9 + seededRandom(seed + 2) * 100 - 50;
        const y = centerY + Math.sin(angle) * radius * 0.6 + seededRandom(seed + 3) * 80 - 40;
        
        // Random rotation between -12 and 12 degrees
        const rotation = (seededRandom(seed + 4) - 0.5) * 24;
        
        // Random scale between 0.7 and 1.1
        const scale = 0.7 + seededRandom(seed + 5) * 0.4;
        
        newPositions[img.id] = {
          x: Math.max(20, Math.min(800, x)),
          y: Math.max(20, Math.min(500, y)),
          zIndex: index + 1,
          rotation,
          scale,
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
    
    // Bring to front and preserve rotation/scale
    maxZIndexRef.current += 1;
    const current = currentPositions[imageId];
    setPositions(prev => ({
      ...prev,
      [imageId]: {
        ...current,
        zIndex: maxZIndexRef.current,
        rotation: current?.rotation ?? 0,
        scale: current?.scale ?? 1,
      },
    }));
  }, [layoutMode, currentPositions]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggingId || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newX = e.clientX - containerRect.left - dragOffset.x;
    const newY = e.clientY - containerRect.top - dragOffset.y;
    
    setPositions(prev => {
      const current = prev[draggingId] || currentPositions[draggingId];
      return {
        ...prev,
        [draggingId]: {
          ...current,
          x: Math.max(0, newX),
          y: Math.max(0, newY),
          zIndex: current?.zIndex || maxZIndexRef.current,
          rotation: current?.rotation ?? 0,
          scale: current?.scale ?? 1,
        },
      };
    });
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
            {/* Presentation Mode Button */}
            <button
              type="button"
              onClick={() => setIsPresentationMode(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ backgroundColor: "#ffffff08" }}
              title="Presentation mode"
            >
              <span className="text-sm font-semibold text-gray-400">P</span>
            </button>

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

          {/* Freeform Layout - Scattered collage style */}
          {layoutMode === "freeform" && (
            <div 
              ref={containerRef}
              className="relative w-full select-none overflow-hidden"
              style={{ 
                minHeight: "650px", 
                cursor: draggingId ? "grabbing" : "default",
                background: "linear-gradient(135deg, #0a0a0a 0%, #151515 100%)",
                borderRadius: "12px",
              }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            >
              {data.images?.map((img) => {
                const pos = currentPositions[img.id] || { x: 0, y: 0, zIndex: 1, rotation: 0, scale: 1 };
                const isSelected = selectedImage === img.id;
                const isDragging = draggingId === img.id;
                const rotation = pos.rotation ?? 0;
                const scale = pos.scale ?? 1;
                
                return (
                  <div
                    key={img.id}
                    className="absolute group"
                    style={{
                      left: pos.x,
                      top: pos.y,
                      zIndex: isDragging ? 9999 : pos.zIndex,
                      cursor: isDragging ? "grabbing" : "grab",
                      transition: isDragging ? "none" : "transform 0.15s ease, box-shadow 0.2s ease",
                      transform: `rotate(${rotation}deg) scale(${isDragging ? scale * 1.05 : scale})`,
                      transformOrigin: "center center",
                    }}
                    onMouseDown={(e) => handleMouseDown(e, img.id)}
                  >
                    <div 
                      className="relative overflow-hidden"
                      style={{
                        maxWidth: "200px",
                        border: isSelected ? "3px solid #ffffff" : "none",
                        boxShadow: isDragging 
                          ? "0 25px 50px rgba(0,0,0,0.6), 0 10px 20px rgba(0,0,0,0.4)" 
                          : "0 8px 24px rgba(0,0,0,0.4), 0 4px 8px rgba(0,0,0,0.3)",
                      }}
                    >
                      <img
                        src={img.url}
                        alt={img.fileName}
                        className="w-full h-auto block"
                        draggable={false}
                      />
                      
                      {/* Hover overlay */}
                      <div 
                        className="absolute inset-0 flex items-end opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                        style={{ background: "linear-gradient(transparent 40%, rgba(0,0,0,0.85))" }}
                      >
                        <div className="p-2.5 w-full">
                          <p className="text-xs text-white truncate font-medium" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
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

      {/* Presentation Mode Fullscreen Overlay */}
      {isPresentationMode && (
        <div 
          className="fixed inset-0 z-[60] flex flex-col"
          style={{ backgroundColor: "#ffffff" }}
        >
          {/* Presentation Header */}
          <div className="flex items-center justify-between px-6 py-4">
            {/* Left - Back button and title */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPresentationMode(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-black/5"
                style={{ backgroundColor: "#f5f5f5" }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M12 4L6 10L12 16" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div 
                className="px-4 py-2 rounded-full"
                style={{ backgroundColor: "#f5f5f5" }}
              >
                <span className="text-sm font-medium text-gray-800" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                  {data.label || "Moodboard"}
                </span>
              </div>
            </div>

            {/* Right - Toolbar */}
            <div className="flex items-center gap-1">
              {/* Layout toggles */}
              <div 
                className="flex items-center gap-1 p-1 rounded-xl"
                style={{ backgroundColor: "#f5f5f5" }}
              >
                {/* List */}
                <button
                  type="button"
                  onClick={() => setPresentationLayout("list")}
                  className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                  style={{
                    backgroundColor: presentationLayout === "list" ? "#ffffff" : "transparent",
                    boxShadow: presentationLayout === "list" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M3 4.5H15M3 9H15M3 13.5H15" stroke={presentationLayout === "list" ? "#333333" : "#999999"} strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>

                {/* Grid */}
                <button
                  type="button"
                  onClick={() => setPresentationLayout("grid")}
                  className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                  style={{
                    backgroundColor: presentationLayout === "grid" ? "#ffffff" : "transparent",
                    boxShadow: presentationLayout === "grid" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect x="2" y="2" width="5.5" height="5.5" rx="1" stroke={presentationLayout === "grid" ? "#333333" : "#999999"} strokeWidth="1.5"/>
                    <rect x="10.5" y="2" width="5.5" height="5.5" rx="1" stroke={presentationLayout === "grid" ? "#333333" : "#999999"} strokeWidth="1.5"/>
                    <rect x="2" y="10.5" width="5.5" height="5.5" rx="1" stroke={presentationLayout === "grid" ? "#333333" : "#999999"} strokeWidth="1.5"/>
                    <rect x="10.5" y="10.5" width="5.5" height="5.5" rx="1" stroke={presentationLayout === "grid" ? "#333333" : "#999999"} strokeWidth="1.5"/>
                  </svg>
                </button>

                {/* Columns/Masonry */}
                <button
                  type="button"
                  onClick={() => setPresentationLayout("columns")}
                  className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                  style={{
                    backgroundColor: presentationLayout === "columns" ? "#ffffff" : "transparent",
                    boxShadow: presentationLayout === "columns" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect x="2" y="2" width="4" height="14" rx="1" stroke={presentationLayout === "columns" ? "#333333" : "#999999"} strokeWidth="1.5"/>
                    <rect x="8" y="2" width="4" height="9" rx="1" stroke={presentationLayout === "columns" ? "#333333" : "#999999"} strokeWidth="1.5"/>
                    <rect x="8" y="13" width="4" height="3" rx="1" stroke={presentationLayout === "columns" ? "#333333" : "#999999"} strokeWidth="1.5"/>
                    <rect x="14" y="2" width="2" height="6" rx="0.5" stroke={presentationLayout === "columns" ? "#333333" : "#999999"} strokeWidth="1.5"/>
                    <rect x="14" y="10" width="2" height="6" rx="0.5" stroke={presentationLayout === "columns" ? "#333333" : "#999999"} strokeWidth="1.5"/>
                  </svg>
                </button>

                {/* Freeform */}
                <button
                  type="button"
                  onClick={() => setPresentationLayout("freeform")}
                  className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                  style={{
                    backgroundColor: presentationLayout === "freeform" ? "#ffffff" : "transparent",
                    boxShadow: presentationLayout === "freeform" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect x="2" y="3" width="5" height="4" stroke={presentationLayout === "freeform" ? "#333333" : "#999999"} strokeWidth="1.5" transform="rotate(-5 2 3)"/>
                    <rect x="9" y="2" width="6" height="5" stroke={presentationLayout === "freeform" ? "#333333" : "#999999"} strokeWidth="1.5" transform="rotate(3 9 2)"/>
                    <rect x="3" y="10" width="5" height="5" stroke={presentationLayout === "freeform" ? "#333333" : "#999999"} strokeWidth="1.5" transform="rotate(5 3 10)"/>
                    <rect x="10" y="9" width="5" height="6" stroke={presentationLayout === "freeform" ? "#333333" : "#999999"} strokeWidth="1.5" transform="rotate(-3 10 9)"/>
                  </svg>
                </button>
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={() => setIsPresentationMode(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-black/5 ml-2"
                style={{ backgroundColor: "#f5f5f5" }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M13 5L5 13M5 5L13 13" stroke="#333333" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Presentation Content */}
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {/* List Layout */}
            {presentationLayout === "list" && (
              <div className="flex flex-col gap-4 max-w-4xl mx-auto">
                {data.images?.map((img) => (
                  <div key={img.id} className="w-full">
                    <img
                      src={img.url}
                      alt={img.fileName}
                      className="w-full h-auto"
                      draggable={false}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Grid Layout - 1:1 */}
            {presentationLayout === "grid" && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
                {data.images?.map((img) => (
                  <div key={img.id} className="aspect-square">
                    <img
                      src={img.url}
                      alt={img.fileName}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Columns/Masonry Layout */}
            {presentationLayout === "columns" && (
              <div 
                className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-1"
                style={{ columnFill: "balance" }}
              >
                {data.images?.map((img) => (
                  <div key={img.id} className="mb-1 break-inside-avoid">
                    <img
                      src={img.url}
                      alt={img.fileName}
                      className="w-full h-auto"
                      draggable={false}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Freeform Layout */}
            {presentationLayout === "freeform" && (
              <div 
                className="relative w-full select-none"
                style={{ minHeight: "calc(100vh - 120px)" }}
              >
                {data.images?.map((img, index) => {
                  const pos = currentPositions[img.id] || { x: 0, y: 0, zIndex: 1, rotation: 0, scale: 1 };
                  const rotation = pos.rotation ?? 0;
                  const scale = (pos.scale ?? 1) * 1.2; // Slightly larger in presentation
                  
                  return (
                    <div
                      key={img.id}
                      className="absolute"
                      style={{
                        left: `${(pos.x / 800) * 70 + 10}%`,
                        top: pos.y * 0.8,
                        zIndex: pos.zIndex || index + 1,
                        transform: `rotate(${rotation}deg) scale(${scale})`,
                        transformOrigin: "center center",
                        maxWidth: "250px",
                      }}
                    >
                      <img
                        src={img.url}
                        alt={img.fileName}
                        className="w-full h-auto"
                        style={{
                          boxShadow: "0 8px 32px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.1)",
                        }}
                        draggable={false}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Presenting Indicator */}
          <div className="absolute bottom-6 right-6 flex items-center gap-2">
            <div 
              className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ backgroundColor: "#f5f5f5" }}
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">1</span>
              </div>
              <span className="text-xs font-semibold tracking-wider text-gray-600" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                PRESENTING
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
