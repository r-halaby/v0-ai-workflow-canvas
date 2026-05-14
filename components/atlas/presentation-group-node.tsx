"use client";

import React from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import Image from "next/image";
import type { PresentationGroupNodeData } from "@/lib/atlas-types";

export function PresentationGroupNode({
  data,
  selected,
}: NodeProps<PresentationGroupNodeData>) {
  const { thumbnails = [], nodeIds = [] } = data;
  const count = nodeIds.length;

  // Get grid layout based on count
  const getGridClass = () => {
    if (count <= 2) return "grid-cols-2";
    if (count <= 4) return "grid-cols-2 grid-rows-2";
    return "grid-cols-3 grid-rows-2";
  };

  return (
    <div
      className="group relative"
      style={{
        width: 220,
        minHeight: 160,
        backgroundColor: "#1a1a1a",
        borderRadius: 12,
        outline: selected ? "2px solid #F0FE00" : "none",
        outlineOffset: 2,
        border: "2px dashed #F0FE00",
      }}
    >
      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!opacity-0 group-hover:!opacity-100 transition-all !cursor-pointer"
        style={{
          background: "#F0FE00",
          width: 10,
          height: 10,
          border: "2px solid #000",
          left: -5,
        }}
      />

      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{ borderBottom: "1px solid #333" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F0FE00" strokeWidth="2">
          <rect x="2" y="2" width="9" height="9" rx="1" />
          <rect x="13" y="2" width="9" height="5" rx="1" />
          <rect x="13" y="9" width="9" height="6" rx="1" />
          <rect x="2" y="13" width="9" height="9" rx="1" />
          <rect x="13" y="17" width="9" height="5" rx="1" />
        </svg>
        <span
          className="text-xs font-medium truncate"
          style={{ color: "#F0FE00", fontFamily: "system-ui, Inter, sans-serif" }}
        >
          Slide Group ({count} images)
        </span>
      </div>

      {/* Thumbnail Grid Preview */}
      <div className={`grid ${getGridClass()} gap-1 p-2`}>
        {thumbnails.slice(0, 6).map((url, index) => (
          <div
            key={index}
            className="relative aspect-square rounded overflow-hidden"
            style={{ backgroundColor: "#0a0a0a" }}
          >
            {url ? (
              <Image
                src={url}
                alt={`Preview ${index + 1}`}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-[10px] text-gray-600">{index + 1}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Show +N if more than 6 */}
      {count > 6 && (
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] bg-black/60 text-gray-400">
          +{count - 6}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!opacity-0 group-hover:!opacity-100 transition-all !cursor-pointer"
        style={{
          background: "#F0FE00",
          width: 10,
          height: 10,
          border: "2px solid #000",
          right: -5,
        }}
      />
    </div>
  );
}
