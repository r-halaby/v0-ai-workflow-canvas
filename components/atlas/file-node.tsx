"use client";

import React, { useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { FileNodeData } from "@/lib/atlas-types";
import { PRODUCT_COLORS } from "@/lib/atlas-types";

// Small inline SVG icons for file types
const FileIcons: Record<string, React.ReactNode> = {
  ".fig": (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.5 1C4.11929 1 3 2.11929 3 3.5C3 4.88071 4.11929 6 5.5 6H8V1H5.5Z" fill="#F24E1E"/>
      <path d="M8 1V6H10.5C11.8807 6 13 4.88071 13 3.5C13 2.11929 11.8807 1 10.5 1H8Z" fill="#FF7262"/>
      <path d="M8 6V11H5.5C4.11929 11 3 9.88071 3 8.5C3 7.11929 4.11929 6 5.5 6H8Z" fill="#A259FF"/>
      <path d="M3 13.5C3 12.1193 4.11929 11 5.5 11H8V13.5C8 14.8807 6.88071 16 5.5 16C4.11929 16 3 14.8807 3 13.5Z" fill="#0ACF83"/>
      <path d="M8 6H10.5C11.8807 6 13 7.11929 13 8.5C13 9.88071 11.8807 11 10.5 11C9.11929 11 8 9.88071 8 8.5V6Z" fill="#1ABCFE"/>
    </svg>
  ),
  ".psd": (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="3" fill="#001E36"/>
      <path d="M4 11V5H6.5C7.88071 5 8.5 5.88071 8.5 6.75C8.5 7.61929 7.88071 8.5 6.5 8.5H5.5V11H4Z" fill="#31A8FF"/>
    </svg>
  ),
  ".pdf": (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="3" fill="#FF0000"/>
      <path d="M4 10V6H5.5C6.33 6 7 6.67 7 7.5C7 8.33 6.33 9 5.5 9H5V10H4Z" fill="white"/>
    </svg>
  ),
  ".mp4": (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="3" fill="#7C3AED"/>
      <path d="M6 5L11 8L6 11V5Z" fill="white"/>
    </svg>
  ),
  ".ai": (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="3" fill="#FF9A00"/>
      <path d="M5 10L6 6H7.5L8.5 10H7.5L7.25 9H6.25L6 10H5Z" fill="#300"/>
      <path d="M9 10V6H10V10H9Z" fill="#300"/>
    </svg>
  ),
  ".png": (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="3" fill="#0AC963"/>
      <rect x="3" y="3" width="10" height="10" rx="1" stroke="white" strokeWidth="1.5"/>
      <circle cx="6" cy="6" r="1.5" fill="white"/>
      <path d="M3 11L6 8L8 10L11 7L13 9V12C13 12.55 12.55 13 12 13H4C3.45 13 3 12.55 3 12V11Z" fill="white"/>
    </svg>
  ),
  ".jpg": (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="3" fill="#26C9FF"/>
      <rect x="3" y="3" width="10" height="10" rx="1" stroke="white" strokeWidth="1.5"/>
      <circle cx="6" cy="6" r="1.5" fill="white"/>
      <path d="M3 11L6 8L8 10L11 7L13 9V12C13 12.55 12.55 13 12 13H4C3.45 13 3 12.55 3 12V11Z" fill="white"/>
    </svg>
  ),
  ".jpeg": (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="3" fill="#26C9FF"/>
      <rect x="3" y="3" width="10" height="10" rx="1" stroke="white" strokeWidth="1.5"/>
      <circle cx="6" cy="6" r="1.5" fill="white"/>
    </svg>
  ),
  ".sketch": (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 1L1 6L8 15L15 6L8 1Z" fill="#FDB300"/>
      <path d="M8 1L1 6H15L8 1Z" fill="#EA6C00"/>
    </svg>
  ),
  ".mov": (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="3" fill="#9C27B0"/>
      <path d="M6 5L11 8L6 11V5Z" fill="white"/>
    </svg>
  ),
  ".pptx": (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="3" fill="#D24726"/>
      <path d="M5 10V6H7C7.83 6 8.5 6.67 8.5 7.5C8.5 8.33 7.83 9 7 9H6V10H5Z" fill="white"/>
    </svg>
  ),
  ".indd": (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="3" fill="#FF3366"/>
      <path d="M6 10V6H7V10H6Z" fill="white"/>
    </svg>
  ),
  ".xd": (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="3" fill="#FF61F6"/>
      <path d="M5 10L7 8L5 6H6.5L7.5 7.5L8.5 6H10L8 8L10 10H8.5L7.5 8.5L6.5 10H5Z" fill="white"/>
    </svg>
  ),
  default: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 2C3 1.44772 3.44772 1 4 1H9L13 5V14C13 14.5523 12.5523 15 12 15H4C3.44772 15 3 14.5523 3 14V2Z" fill="#52525b"/>
      <path d="M9 1L13 5H10C9.44772 5 9 4.55228 9 4V1Z" fill="#71717a"/>
    </svg>
  ),
};

// Status badge colors
const STATUS_BADGE_STYLES: Record<string, { bg: string; text: string }> = {
  draft: { bg: "#374151", text: "#9CA3AF" },
  "in-review": { bg: "#3B82F6", text: "#FFFFFF" },
  approved: { bg: "#10B981", text: "#FFFFFF" },
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  "in-review": "In Review",
  approved: "Approved",
};

// Default placeholder images by file type
const DEFAULT_PREVIEWS: Record<string, string> = {
  ".fig": "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop",
  ".psd": "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&h=300&fit=crop",
  ".ai": "https://images.unsplash.com/photo-1626785774625-ddcddc3445e9?w=400&h=300&fit=crop",
  ".png": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=300&fit=crop",
  ".jpg": "https://images.unsplash.com/photo-1579547621113-e4bb2a19bdd6?w=400&h=300&fit=crop",
  ".jpeg": "https://images.unsplash.com/photo-1579547621113-e4bb2a19bdd6?w=400&h=300&fit=crop",
  ".pdf": "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop",
  ".mp4": "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=400&h=300&fit=crop",
  ".mov": "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=400&h=300&fit=crop",
  ".pptx": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop",
  default: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=300&fit=crop",
};

export function FileNode({ id, data, selected }: NodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const fileData = data as FileNodeData;
  
  const productColor = PRODUCT_COLORS[fileData.product] || "#666666";
  const fileIcon = FileIcons[fileData.fileExtension] || FileIcons.default;
  const statusStyle = STATUS_BADGE_STYLES[fileData.status] || STATUS_BADGE_STYLES.draft;
  const statusLabel = STATUS_LABELS[fileData.status] || "Draft";
  const taskCount = fileData.tasks?.length || 0;
  const completedTasks = fileData.tasks?.filter(t => t.completed).length || 0;

  // Get preview image - use first preview image, uploaded file, or default
  const previewImage = fileData.previewImages?.[0] 
    || fileData.uploadedFile?.url 
    || DEFAULT_PREVIEWS[fileData.fileExtension] 
    || DEFAULT_PREVIEWS.default;

  return (
    <div
      className="relative group cursor-move"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: 220,
        transition: "all 0.2s ease",
        borderRadius: 12,
        outline: selected ? "2px solid white" : "none",
        outlineOffset: 2,
      }}
    >
      {/* Connection Handles - positioned at edge of node, visible on hover */}
      <Handle
        type="target"
        position={Position.Left}
        className="!opacity-0 group-hover:!opacity-100 transition-all !cursor-pointer"
        style={{ 
          background: "#1a1a1a", 
          border: "2px solid #525252", 
          width: 12,
          height: 12,
        }}
        onMouseDownCapture={(e) => {
          (e.currentTarget as HTMLElement).dataset.mouseDownTime = Date.now().toString();
          (e.currentTarget as HTMLElement).dataset.mouseDownX = e.clientX.toString();
          (e.currentTarget as HTMLElement).dataset.mouseDownY = e.clientY.toString();
        }}
        onMouseUpCapture={(e) => {
          const downTime = parseInt((e.currentTarget as HTMLElement).dataset.mouseDownTime || "0");
          const downX = parseInt((e.currentTarget as HTMLElement).dataset.mouseDownX || "0");
          const downY = parseInt((e.currentTarget as HTMLElement).dataset.mouseDownY || "0");
          const elapsed = Date.now() - downTime;
          const distance = Math.sqrt(Math.pow(e.clientX - downX, 2) + Math.pow(e.clientY - downY, 2));
          
          // If quick click (< 200ms) and didn't move much (< 5px), show menu
          if (elapsed < 200 && distance < 5) {
            e.stopPropagation();
            e.preventDefault();
            const rect = e.currentTarget.getBoundingClientRect();
            window.dispatchEvent(new CustomEvent("atlas:handle-click", {
              detail: { 
                nodeId: id,
                handleType: "target",
                position: { x: rect.left, y: rect.top + rect.height / 2 }
              }
            }));
          }
        }}
      />

      {/* Header - File icon and name */}
      <div 
        className="flex items-center gap-2 mb-2 px-1"
        style={{ fontFamily: "system-ui, Inter, sans-serif" }}
      >
        <div className="flex-shrink-0">
          {fileIcon}
        </div>
        <span 
          className="text-sm text-white font-medium truncate flex-1"
        >
          {fileData.label}
        </span>
        <span 
          className="text-xs text-gray-500 flex-shrink-0"
        >
          {fileData.fileExtension.replace(".", "").toUpperCase()}
        </span>
      </div>

      {/* Main Card with Image Preview */}
      <div
        style={{
          background: "#141414",
          borderRadius: 12,
          border: "1px solid #2a2a2a",
          boxShadow: isHovered 
            ? "0 8px 32px rgba(0,0,0,0.4)" 
            : "0 2px 8px rgba(0,0,0,0.2)",
          overflow: "hidden",
          transition: "box-shadow 0.2s ease",
        }}
      >
        {/* Image Preview */}
        <div 
          className="relative w-full overflow-hidden"
          style={{ height: 140 }}
        >
          <img
            src={previewImage}
            alt={fileData.label}
            className="w-full h-full object-cover"
            style={{
              transition: "transform 0.3s ease",
              transform: isHovered ? "scale(1.05)" : "scale(1)",
            }}
          />
          
          {/* Gradient overlay on hover */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: isHovered 
                ? "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)" 
                : "transparent",
              transition: "background 0.2s ease",
            }}
          />
        </div>

        {/* Hover Details Panel */}
        <div
          style={{
            maxHeight: isHovered ? 160 : 0,
            opacity: isHovered ? 1 : 0,
            overflow: "hidden",
            transition: "max-height 0.2s ease, opacity 0.2s ease",
          }}
        >
          <div className="px-3 py-3 space-y-2">
            {/* Status Badge */}
            <div className="flex items-center justify-between">
              <span 
                className="text-xs"
                style={{ color: "#666666", fontFamily: "system-ui, Inter, sans-serif" }}
              >
                Status
              </span>
              <div
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ 
                  backgroundColor: statusStyle.bg, 
                  color: statusStyle.text,
                  fontFamily: "system-ui, Inter, sans-serif",
                }}
              >
                {statusLabel}
              </div>
            </div>

            {/* Tasks */}
            <div className="flex items-center justify-between">
              <span 
                className="text-xs"
                style={{ color: "#666666", fontFamily: "system-ui, Inter, sans-serif" }}
              >
                Tasks
              </span>
              <div className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <rect x="2" y="2" width="10" height="10" rx="2" stroke="#666666" strokeWidth="1.25"/>
                  <path d="M5 7L6.5 8.5L9 5.5" stroke="#666666" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span 
                  className="text-xs"
                  style={{ color: "#999999", fontFamily: "system-ui, Inter, sans-serif" }}
                >
                  {completedTasks}/{taskCount}
                </span>
              </div>
            </div>

            {/* Last Modified */}
            <div className="flex items-center justify-between">
              <span 
                className="text-xs"
                style={{ color: "#666666", fontFamily: "system-ui, Inter, sans-serif" }}
              >
                Modified
              </span>
              <span 
                className="text-xs"
                style={{ color: "#999999", fontFamily: "system-ui, Inter, sans-serif" }}
              >
                {fileData.lastModified}
              </span>
            </div>

            {/* Generate Mockups Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                // Dispatch custom event to trigger mockup generator
                window.dispatchEvent(new CustomEvent("atlas:generate-mockup", {
                  detail: { nodeId: data.label, fileData }
                }));
              }}
              className="nodrag w-full mt-2 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors hover:bg-white/10"
              style={{
                backgroundColor: "#1f1f1f",
                color: "#cccccc",
                border: "1px solid #333333",
                fontFamily: "system-ui, Inter, sans-serif",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L10 6L14 6.5L11 9.5L12 14L8 11.5L4 14L5 9.5L2 6.5L6 6L8 2Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Generate Mockups
            </button>
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!opacity-0 group-hover:!opacity-100 transition-all !cursor-pointer"
        style={{ 
          background: "#1a1a1a", 
          border: "2px solid #525252", 
          width: 12,
          height: 12,
        }}
        onMouseDownCapture={(e) => {
          (e.currentTarget as HTMLElement).dataset.mouseDownTime = Date.now().toString();
          (e.currentTarget as HTMLElement).dataset.mouseDownX = e.clientX.toString();
          (e.currentTarget as HTMLElement).dataset.mouseDownY = e.clientY.toString();
        }}
        onMouseUpCapture={(e) => {
          const downTime = parseInt((e.currentTarget as HTMLElement).dataset.mouseDownTime || "0");
          const downX = parseInt((e.currentTarget as HTMLElement).dataset.mouseDownX || "0");
          const downY = parseInt((e.currentTarget as HTMLElement).dataset.mouseDownY || "0");
          const elapsed = Date.now() - downTime;
          const distance = Math.sqrt(Math.pow(e.clientX - downX, 2) + Math.pow(e.clientY - downY, 2));
          
          // If quick click (< 200ms) and didn't move much (< 5px), show menu
          if (elapsed < 200 && distance < 5) {
            e.stopPropagation();
            e.preventDefault();
            const rect = e.currentTarget.getBoundingClientRect();
            window.dispatchEvent(new CustomEvent("atlas:handle-click", {
              detail: { 
                nodeId: id,
                handleType: "source",
                position: { x: rect.right, y: rect.top + rect.height / 2 }
              }
            }));
          }
        }}
      />
    </div>
  );
}
