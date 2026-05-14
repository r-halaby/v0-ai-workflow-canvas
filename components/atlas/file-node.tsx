"use client";

import React, { useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { FileNodeData } from "@/lib/atlas-types";
import { PRODUCT_COLORS } from "@/lib/atlas-types";

// Inline SVG icons for file types - larger for the modern design
const FileIcons: Record<string, React.ReactNode> = {
  ".fig": (
    <svg width="32" height="32" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.5 1C4.11929 1 3 2.11929 3 3.5C3 4.88071 4.11929 6 5.5 6H8V1H5.5Z" fill="#F24E1E"/>
      <path d="M8 1V6H10.5C11.8807 6 13 4.88071 13 3.5C13 2.11929 11.8807 1 10.5 1H8Z" fill="#FF7262"/>
      <path d="M8 6V11H5.5C4.11929 11 3 9.88071 3 8.5C3 7.11929 4.11929 6 5.5 6H8Z" fill="#A259FF"/>
      <path d="M3 13.5C3 12.1193 4.11929 11 5.5 11H8V13.5C8 14.8807 6.88071 16 5.5 16C4.11929 16 3 14.8807 3 13.5Z" fill="#0ACF83"/>
      <path d="M8 6H10.5C11.8807 6 13 7.11929 13 8.5C13 9.88071 11.8807 11 10.5 11C9.11929 11 8 9.88071 8 8.5V6Z" fill="#1ABCFE"/>
    </svg>
  ),
  ".psd": (
    <svg width="32" height="32" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="3" fill="#001E36"/>
      <path d="M4 11V5H6.5C7.88071 5 8.5 5.88071 8.5 6.75C8.5 7.61929 7.88071 8.5 6.5 8.5H5.5V11H4ZM5.5 7.25H6.25C6.66421 7.25 7 6.91421 7 6.75C7 6.58579 6.66421 6.25 6.25 6.25H5.5V7.25Z" fill="#31A8FF"/>
      <path d="M9 9.5C9 8.67157 9.67157 8 10.5 8C11.0523 8 11.5 8.22386 11.75 8.5V8H13V11H11.75V10.5C11.5 10.7761 11.0523 11 10.5 11C9.67157 11 9 10.3284 9 9.5ZM10.5 10C10.7761 10 11 9.77614 11 9.5C11 9.22386 10.7761 9 10.5 9C10.2239 9 10 9.22386 10 9.5C10 9.77614 10.2239 10 10.5 10Z" fill="#31A8FF"/>
    </svg>
  ),
  ".pdf": (
    <svg width="32" height="32" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="3" fill="#FF0000"/>
      <path d="M3 11V5H5C5.82843 5 6.5 5.67157 6.5 6.5C6.5 7.32843 5.82843 8 5 8H4V11H3ZM4 7H4.75C5.02614 7 5.25 6.77614 5.25 6.5C5.25 6.22386 5.02614 6 4.75 6H4V7Z" fill="white"/>
      <path d="M7 11V5H8.5C9.88071 5 11 6.11929 11 7.5V8.5C11 9.88071 9.88071 11 8.5 11H7ZM8.25 10H8.5C9.32843 10 10 9.32843 10 8.5V7.5C10 6.67157 9.32843 6 8.5 6H8.25V10Z" fill="white"/>
      <path d="M12 11V5H14V6H13V7.5H14V8.5H13V11H12Z" fill="white"/>
    </svg>
  ),
  ".mp4": (
    <svg width="32" height="32" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="3" fill="#7C3AED"/>
      <path d="M6 5L11 8L6 11V5Z" fill="white"/>
    </svg>
  ),
  ".ai": (
    <svg width="32" height="32" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="3" fill="#FF9A00"/>
      <path d="M4 11L5.5 5H7L8.5 11H7.25L7 10H5.5L5.25 11H4ZM5.75 9H6.75L6.25 7L5.75 9Z" fill="#300"/>
      <path d="M9 11V5H10.25V11H9Z" fill="#300"/>
    </svg>
  ),
  ".indd": (
    <svg width="32" height="32" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="3" fill="#FF3366"/>
      <path d="M5 11V5H6.25V11H5Z" fill="white"/>
      <path d="M7.5 11V5H9C10.3807 5 11.5 6.11929 11.5 7.5V8.5C11.5 9.88071 10.3807 11 9 11H7.5ZM8.75 10H9C9.82843 10 10.5 9.32843 10.5 8.5V7.5C10.5 6.67157 9.82843 6 9 6H8.75V10Z" fill="white"/>
    </svg>
  ),
  ".pptx": (
    <svg width="32" height="32" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="3" fill="#D24726"/>
      <path d="M4 11V5H6.5C7.60457 5 8.5 5.89543 8.5 7C8.5 8.10457 7.60457 9 6.5 9H5.25V11H4ZM5.25 8H6.25C6.66421 8 7 7.66421 7 7C7 6.33579 6.66421 6 6.25 6H5.25V8Z" fill="white"/>
      <path d="M9 11V5H10.25V11H9Z" fill="white"/>
    </svg>
  ),
  ".sketch": (
    <svg width="32" height="32" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 1L1 6L8 15L15 6L8 1Z" fill="#FDB300"/>
      <path d="M8 1L1 6H15L8 1Z" fill="#EA6C00"/>
      <path d="M8 1V15L1 6L8 1Z" fill="#FDAD00"/>
      <path d="M8 1V15L15 6L8 1Z" fill="#FDD231"/>
    </svg>
  ),
  ".xd": (
    <svg width="32" height="32" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="3" fill="#FF61F6"/>
      <path d="M4 11L6 8L4 5H5.5L6.75 7L8 5H9.5L7.5 8L9.5 11H8L6.75 9L5.5 11H4Z" fill="white"/>
      <path d="M10 11V5H11.5C12.88 5 14 6.12 14 7.5V8.5C14 9.88 12.88 11 11.5 11H10ZM11.25 10H11.5C12.33 10 13 9.33 13 8.5V7.5C13 6.67 12.33 6 11.5 6H11.25V10Z" fill="white"/>
    </svg>
  ),
  ".svg": (
    <svg width="32" height="32" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="3" fill="#FFB13B"/>
      <path d="M3 10.5C3 9.67 3.67 9 4.5 9C5.33 9 6 9.67 6 10.5C6 11.33 5.33 12 4.5 12H3V10.5Z" fill="white"/>
      <path d="M7 12L9 8L11 12H7Z" fill="white"/>
      <circle cx="12" cy="6" r="2" fill="white"/>
    </svg>
  ),
  ".png": (
    <svg width="32" height="32" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="3" fill="#0AC963"/>
      <rect x="3" y="3" width="10" height="10" rx="1" stroke="white" strokeWidth="1.5"/>
      <circle cx="6" cy="6" r="1.5" fill="white"/>
      <path d="M3 11L6 8L8 10L11 7L13 9V12C13 12.55 12.55 13 12 13H4C3.45 13 3 12.55 3 12V11Z" fill="white"/>
    </svg>
  ),
  ".jpg": (
    <svg width="32" height="32" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="3" fill="#26C9FF"/>
      <rect x="3" y="3" width="10" height="10" rx="1" stroke="white" strokeWidth="1.5"/>
      <circle cx="6" cy="6" r="1.5" fill="white"/>
      <path d="M3 11L6 8L8 10L11 7L13 9V12C13 12.55 12.55 13 12 13H4C3.45 13 3 12.55 3 12V11Z" fill="white"/>
    </svg>
  ),
  ".jpeg": (
    <svg width="32" height="32" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="3" fill="#26C9FF"/>
      <rect x="3" y="3" width="10" height="10" rx="1" stroke="white" strokeWidth="1.5"/>
      <circle cx="6" cy="6" r="1.5" fill="white"/>
      <path d="M3 11L6 8L8 10L11 7L13 9V12C13 12.55 12.55 13 12 13H4C3.45 13 3 12.55 3 12V11Z" fill="white"/>
    </svg>
  ),
  ".gif": (
    <svg width="32" height="32" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="3" fill="#FF6B6B"/>
      <path d="M5 8.5C5 7.67 5.67 7 6.5 7H7V8H6.5C6.22 8 6 8.22 6 8.5C6 8.78 6.22 9 6.5 9H7V10H6.5C5.67 10 5 9.33 5 8.5Z" fill="white"/>
      <path d="M8 10V7H9V10H8Z" fill="white"/>
      <path d="M10 10V7H13V8H11V8.25H12.5V9.25H11V10H10Z" fill="white"/>
    </svg>
  ),
  ".mov": (
    <svg width="32" height="32" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="3" fill="#9C27B0"/>
      <path d="M6 5L11 8L6 11V5Z" fill="white"/>
    </svg>
  ),
  ".doc": (
    <svg width="32" height="32" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="3" fill="#2B579A"/>
      <path d="M4 11V5H5.5L6.5 9L7.5 5H9V11H8V7L7 11H6L5 7V11H4Z" fill="white"/>
    </svg>
  ),
  ".docx": (
    <svg width="32" height="32" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="3" fill="#2B579A"/>
      <path d="M4 11V5H5.5L6.5 9L7.5 5H9V11H8V7L7 11H6L5 7V11H4Z" fill="white"/>
    </svg>
  ),
  ".afdesign": (
    <svg width="32" height="32" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="3" fill="#1B72E8"/>
      <path d="M8 3L13 13H3L8 3Z" fill="white"/>
    </svg>
  ),
  ".afphoto": (
    <svg width="32" height="32" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="3" fill="#7E4DD2"/>
      <circle cx="8" cy="8" r="4" stroke="white" strokeWidth="1.5"/>
      <circle cx="8" cy="8" r="2" fill="white"/>
    </svg>
  ),
  ".eps": (
    <svg width="32" height="32" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="3" fill="#1C1C1C"/>
      <path d="M3 11V5H6V6H4.25V7.5H5.75V8.5H4.25V10H6V11H3Z" fill="white"/>
      <path d="M7 11V5H9C10.1 5 11 5.9 11 7C11 8.1 10.1 9 9 9H8.25V11H7ZM8.25 8H9C9.41 8 9.75 7.66 9.75 7C9.75 6.34 9.41 6 9 6H8.25V8Z" fill="white"/>
      <path d="M12 8.5C12 7.67 12.67 7 13.5 7C14.05 7 14.5 7.22 14.75 7.5L14 8.25C13.83 8.08 13.67 8 13.5 8C13.22 8 13 8.22 13 8.5C13 8.78 13.22 9 13.5 9C13.67 9 13.83 8.92 14 8.75L14.75 9.5C14.5 9.78 14.05 10 13.5 10C12.67 10 12 9.33 12 8.5Z" fill="white"/>
    </svg>
  ),
  ".webp": (
    <svg width="32" height="32" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="3" fill="#4CAF50"/>
      <rect x="3" y="3" width="10" height="10" rx="1" stroke="white" strokeWidth="1.5"/>
      <circle cx="6" cy="6" r="1.5" fill="white"/>
      <path d="M3 11L6 8L8 10L11 7L13 9V12C13 12.55 12.55 13 12 13H4C3.45 13 3 12.55 3 12V11Z" fill="white"/>
    </svg>
  ),
  default: (
    <svg width="32" height="32" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
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

export function FileNode({ data, selected }: NodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const fileData = data as FileNodeData;
  
  const productColor = PRODUCT_COLORS[fileData.product] || "#666666";
  const fileIcon = FileIcons[fileData.fileExtension] || FileIcons.default;
  const statusStyle = STATUS_BADGE_STYLES[fileData.status] || STATUS_BADGE_STYLES.draft;
  const statusLabel = STATUS_LABELS[fileData.status] || "Draft";
  const taskCount = fileData.tasks?.length || 0;
  const completedTasks = fileData.tasks?.filter(t => t.completed).length || 0;

  return (
    <div
      className="relative group cursor-move"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: isHovered ? 200 : 140,
        transition: "width 0.2s ease, box-shadow 0.2s ease",
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !border-2 !opacity-0 group-hover:!opacity-100 transition-opacity"
        style={{ background: "#52525b", borderColor: "#71717a" }}
      />

      {/* Main Card */}
      <div
        style={{
          background: "#141414",
          borderRadius: 12,
          border: selected ? `2px solid ${productColor}` : "1px solid #2a2a2a",
          boxShadow: isHovered 
            ? "0 8px 32px rgba(0,0,0,0.4)" 
            : "0 2px 8px rgba(0,0,0,0.2)",
          overflow: "hidden",
          transition: "box-shadow 0.2s ease, border 0.2s ease",
        }}
      >
        {/* Default View - Icon and Name */}
        <div className="p-3 flex flex-col items-center text-center">
          {/* File Icon */}
          <div 
            className="mb-2 p-3 rounded-xl"
            style={{ backgroundColor: "#1a1a1a" }}
          >
            {fileIcon}
          </div>
          
          {/* File Name */}
          <h3 
            className="text-white text-sm font-medium truncate w-full"
            style={{ fontFamily: "system-ui, Inter, sans-serif" }}
          >
            {fileData.label}
          </h3>
          
          {/* File Extension - subtle */}
          <span 
            className="text-xs mt-0.5"
            style={{ color: "#666666", fontFamily: "system-ui, Inter, sans-serif" }}
          >
            {fileData.fileExtension.toUpperCase().replace(".", "")}
          </span>
        </div>

        {/* Hover Details Panel */}
        <div
          style={{
            maxHeight: isHovered ? 120 : 0,
            opacity: isHovered ? 1 : 0,
            overflow: "hidden",
            transition: "max-height 0.2s ease, opacity 0.2s ease",
          }}
        >
          <div 
            className="px-3 pb-3 pt-2 space-y-2"
            style={{ borderTop: "1px solid #2a2a2a" }}
          >
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
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !border-2 !opacity-0 group-hover:!opacity-100 transition-opacity"
        style={{ background: "#52525b", borderColor: "#71717a" }}
      />
    </div>
  );
}
