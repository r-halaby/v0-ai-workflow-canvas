"use client";

import React from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useReactFlow } from "@xyflow/react";
import type { FileNodeData, FileExtension } from "@/lib/atlas-types";
import { PRODUCT_COLORS, STATUS_COLORS, PRODUCT_LABELS, STATUS_LABELS } from "@/lib/atlas-types";

// Inline SVG icons for file types
const FileIcons: Record<FileExtension | "default", React.ReactNode> = {
  ".fig": (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.5 1C4.11929 1 3 2.11929 3 3.5C3 4.88071 4.11929 6 5.5 6H8V1H5.5Z" fill="#F24E1E"/>
      <path d="M8 1V6H10.5C11.8807 6 13 4.88071 13 3.5C13 2.11929 11.8807 1 10.5 1H8Z" fill="#FF7262"/>
      <path d="M8 6V11H5.5C4.11929 11 3 9.88071 3 8.5C3 7.11929 4.11929 6 5.5 6H8Z" fill="#A259FF"/>
      <path d="M3 13.5C3 12.1193 4.11929 11 5.5 11H8V13.5C8 14.8807 6.88071 16 5.5 16C4.11929 16 3 14.8807 3 13.5Z" fill="#0ACF83"/>
      <path d="M8 6H10.5C11.8807 6 13 7.11929 13 8.5C13 9.88071 11.8807 11 10.5 11C9.11929 11 8 9.88071 8 8.5V6Z" fill="#1ABCFE"/>
    </svg>
  ),
  ".psd": (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="2" fill="#001E36"/>
      <path d="M4 11V5H6.5C7.88071 5 8.5 5.88071 8.5 6.75C8.5 7.61929 7.88071 8.5 6.5 8.5H5.5V11H4ZM5.5 7.25H6.25C6.66421 7.25 7 6.91421 7 6.75C7 6.58579 6.66421 6.25 6.25 6.25H5.5V7.25Z" fill="#31A8FF"/>
      <path d="M9 9.5C9 8.67157 9.67157 8 10.5 8C11.0523 8 11.5 8.22386 11.75 8.5V8H13V11H11.75V10.5C11.5 10.7761 11.0523 11 10.5 11C9.67157 11 9 10.3284 9 9.5ZM10.5 10C10.7761 10 11 9.77614 11 9.5C11 9.22386 10.7761 9 10.5 9C10.2239 9 10 9.22386 10 9.5C10 9.77614 10.2239 10 10.5 10Z" fill="#31A8FF"/>
    </svg>
  ),
  ".pdf": (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="2" fill="#FF0000"/>
      <path d="M3 11V5H5C5.82843 5 6.5 5.67157 6.5 6.5C6.5 7.32843 5.82843 8 5 8H4V11H3ZM4 7H4.75C5.02614 7 5.25 6.77614 5.25 6.5C5.25 6.22386 5.02614 6 4.75 6H4V7Z" fill="white"/>
      <path d="M7 11V5H8.5C9.88071 5 11 6.11929 11 7.5V8.5C11 9.88071 9.88071 11 8.5 11H7ZM8.25 10H8.5C9.32843 10 10 9.32843 10 8.5V7.5C10 6.67157 9.32843 6 8.5 6H8.25V10Z" fill="white"/>
      <path d="M12 11V5H14V6H13V7.5H14V8.5H13V11H12Z" fill="white"/>
    </svg>
  ),
  ".mp4": (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="2" fill="#7C3AED"/>
      <path d="M6 5L11 8L6 11V5Z" fill="white"/>
    </svg>
  ),
  ".ai": (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="2" fill="#FF9A00"/>
      <path d="M4 11L5.5 5H7L8.5 11H7.25L7 10H5.5L5.25 11H4ZM5.75 9H6.75L6.25 7L5.75 9Z" fill="#300"/>
      <path d="M9 11V5H10.25V11H9Z" fill="#300"/>
    </svg>
  ),
  ".indd": (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="2" fill="#FF3366"/>
      <path d="M5 11V5H6.25V11H5Z" fill="white"/>
      <path d="M7.5 11V5H9C10.3807 5 11.5 6.11929 11.5 7.5V8.5C11.5 9.88071 10.3807 11 9 11H7.5ZM8.75 10H9C9.82843 10 10.5 9.32843 10.5 8.5V7.5C10.5 6.67157 9.82843 6 9 6H8.75V10Z" fill="white"/>
    </svg>
  ),
  ".pptx": (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="2" fill="#D24726"/>
      <path d="M4 11V5H6.5C7.60457 5 8.5 5.89543 8.5 7C8.5 8.10457 7.60457 9 6.5 9H5.25V11H4ZM5.25 8H6.25C6.66421 8 7 7.66421 7 7C7 6.33579 6.66421 6 6.25 6H5.25V8Z" fill="white"/>
      <path d="M9 11V5H10.25V11H9Z" fill="white"/>
    </svg>
  ),
  default: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 2C3 1.44772 3.44772 1 4 1H9L13 5V14C13 14.5523 12.5523 15 12 15H4C3.44772 15 3 14.5523 3 14V2Z" fill="#52525b"/>
      <path d="M9 1L13 5H10C9.44772 5 9 4.55228 9 4V1Z" fill="#71717a"/>
    </svg>
  ),
};

interface FileNodeProps extends NodeProps<FileNodeData> {
  data: FileNodeData;
  selected?: boolean;
}

export function FileNode({ data, selected, id }: FileNodeProps) {
  const { deleteElements } = useReactFlow();
  const productColor = PRODUCT_COLORS[data.product];
  const statusColor = STATUS_COLORS[data.status];
  const fileIcon = FileIcons[data.fileExtension] || FileIcons.default;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteElements({ nodes: [{ id }] });
  };

  return (
    <div
      className="relative"
      style={{
        width: 220,
        background: "#111111",
        borderRadius: 8,
        border: `1px solid ${productColor}66`,
        padding: 12,
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !border-2"
        style={{ background: "#52525b", borderColor: "#71717a" }}
      />

      {/* Top row: icon + file name + close button */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-shrink-0">{fileIcon}</div>
        <span className="flex-1 text-white text-sm font-medium truncate" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
          {data.fileName}
        </span>
        <button
          type="button"
          onClick={handleDelete}
          className="flex-shrink-0 p-0.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          aria-label="Remove node"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3L11 11M3 11L11 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Product tag pill */}
      <div className="mb-2">
        <span
          className="inline-block px-2 py-0.5 rounded text-xs font-medium text-white"
          style={{ backgroundColor: productColor, fontFamily: "system-ui, Inter, sans-serif" }}
        >
          {PRODUCT_LABELS[data.product]}
        </span>
      </div>

      {/* Status badge */}
      <div className="mb-2">
        <span
          className="inline-block px-2 py-0.5 rounded text-xs font-medium text-white"
          style={{ backgroundColor: statusColor, fontFamily: "system-ui, Inter, sans-serif" }}
        >
          {STATUS_LABELS[data.status]}
        </span>
      </div>

      {/* Bottom row: extension + last modified */}
      <div className="flex items-center justify-between">
        <span
          className="inline-block px-1.5 py-0.5 rounded text-xs font-mono text-gray-300"
          style={{ backgroundColor: "#222222" }}
        >
          {data.fileExtension}
        </span>
        <span className="text-xs text-gray-500" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
          {data.lastModified}
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !border-2"
        style={{ background: "#52525b", borderColor: "#71717a" }}
      />

      {/* Selection ring */}
      {selected && (
        <div
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            border: `2px solid ${productColor}`,
            borderRadius: 8,
            margin: -1,
          }}
        />
      )}
    </div>
  );
}
