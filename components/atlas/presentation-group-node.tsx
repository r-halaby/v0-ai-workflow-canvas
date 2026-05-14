"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import type { PresentationGroupNodeData } from "@/lib/atlas-types";

export function PresentationGroupNode({
  data,
  selected,
  id,
}: NodeProps<PresentationGroupNodeData>) {
  const { thumbnails = [], nodeIds = [], label } = data;
  const count = nodeIds.length;
  const { setNodes } = useReactFlow();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(label || `Slide Group (${count})`);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);
  
  // Handle saving the label
  const handleSave = useCallback(() => {
    const newLabel = editValue.trim() || `Slide Group (${count})`;
    setNodes(nds => nds.map(n => 
      n.id === id 
        ? { ...n, data: { ...n.data, label: newLabel } }
        : n
    ));
    setIsEditing(false);
  }, [editValue, count, id, setNodes]);
  
  // Handle key events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(label || `Slide Group (${count})`);
      setIsEditing(false);
    }
    e.stopPropagation();
  }, [handleSave, label, count]);
  
  const displayLabel = label || `Slide Group (${count})`;

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
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F0FE00" strokeWidth="2" className="flex-shrink-0">
          <rect x="2" y="2" width="9" height="9" rx="1" />
          <rect x="13" y="2" width="9" height="5" rx="1" />
          <rect x="13" y="9" width="9" height="6" rx="1" />
          <rect x="2" y="13" width="9" height="9" rx="1" />
          <rect x="13" y="17" width="9" height="5" rx="1" />
        </svg>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="flex-1 text-xs font-medium bg-transparent border-none outline-none min-w-0"
            style={{ 
              color: "#F0FE00", 
              fontFamily: "system-ui, Inter, sans-serif",
              caretColor: "#F0FE00",
            }}
          />
        ) : (
          <span
            className="text-xs font-medium truncate cursor-text hover:opacity-80 flex-1"
            style={{ color: "#F0FE00", fontFamily: "system-ui, Inter, sans-serif" }}
            onDoubleClick={() => setIsEditing(true)}
            title="Double-click to rename"
          >
            {displayLabel}
          </span>
        )}
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
              <img
                src={url}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover"
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
