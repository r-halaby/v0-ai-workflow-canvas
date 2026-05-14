"use client";

import React, { useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { MoodboardNodeData } from "@/lib/atlas-types";

export function MoodboardNode({ data, selected }: NodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const nodeData = data as MoodboardNodeData;
  const imageCount = nodeData.images?.length || 0;
  
  // Show up to 4 preview images in the collapsed view
  const previewImages = nodeData.images?.slice(0, 4) || [];

  return (
    <div
      className="group rounded-xl transition-all duration-200"
      style={{
        backgroundColor: "#1a1a1a",
        border: selected ? "2px solid #a855f7" : "1px solid #a855f730",
        width: 200,
        minHeight: 160,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          width: 8,
          height: 8,
          backgroundColor: "#a855f7",
          border: "2px solid #1a1a1a",
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          width: 8,
          height: 8,
          backgroundColor: "#a855f7",
          border: "2px solid #1a1a1a",
        }}
      />

      {/* Header */}
      <div
        className="px-3 py-2 flex items-center gap-2 border-b"
        style={{ borderColor: "#a855f720" }}
      >
        <div
          className="w-6 h-6 rounded flex items-center justify-center"
          style={{ backgroundColor: "#a855f720" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </div>
        <span className="text-sm font-medium text-white flex-1 truncate" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
          {nodeData.label || "Moodboard"}
        </span>
        <span className="text-xs text-gray-500" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
          {imageCount} {imageCount === 1 ? "image" : "images"}
        </span>
      </div>

      {/* Image Grid Preview */}
      <div className="p-2">
        <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
          {previewImages.map((img, idx) => (
            <div
              key={img.id}
              className="aspect-square bg-black/20 overflow-hidden"
              style={{
                borderRadius: idx === 0 ? "4px 0 0 0" : idx === 1 ? "0 4px 0 0" : idx === 2 ? "0 0 0 4px" : "0 0 4px 0",
              }}
            >
              <img
                src={img.thumbnail || img.url}
                alt={img.fileName}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          {/* Fill empty slots */}
          {Array.from({ length: Math.max(0, 4 - previewImages.length) }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="aspect-square"
              style={{ backgroundColor: "#ffffff08" }}
            />
          ))}
        </div>
        
        {/* More indicator */}
        {imageCount > 4 && (
          <div 
            className="text-xs text-gray-400 text-center mt-2"
            style={{ fontFamily: "system-ui, Inter, sans-serif" }}
          >
            +{imageCount - 4} more
          </div>
        )}
      </div>

      {/* Hover hint */}
      <div
        className="px-3 py-2 border-t text-center transition-all duration-200"
        style={{
          borderColor: "#a855f720",
          opacity: isHovered ? 1 : 0,
          maxHeight: isHovered ? 40 : 0,
          overflow: "hidden",
        }}
      >
        <span className="text-xs text-gray-400" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
          Click to expand
        </span>
      </div>
    </div>
  );
}
