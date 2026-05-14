"use client";

import React, { useState } from "react";
import type { MoodboardNodeData } from "@/lib/atlas-types";

interface MoodboardExpandedProps {
  data: MoodboardNodeData;
  onClose: () => void;
  onUngroup: () => void;
}

export function MoodboardExpanded({ data, onClose, onUngroup }: MoodboardExpandedProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
              style={{ backgroundColor: "#a855f720" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                {data.label || "Moodboard"}
              </h2>
              <p className="text-sm text-gray-400" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                {data.images?.length || 0} images
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
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

        {/* Masonry Grid */}
        <div className="flex-1 overflow-y-auto p-6">
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
                  className="relative rounded-lg overflow-hidden transition-all duration-200"
                  style={{
                    border: selectedImage === img.id ? "2px solid #a855f7" : "1px solid #333333",
                  }}
                >
                  <img
                    src={img.url}
                    alt={img.fileName}
                    className="w-full h-auto object-cover"
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
        </div>
      </div>
    </div>
  );
}
