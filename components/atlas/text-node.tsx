"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import type { TextNodeData } from "@/lib/atlas-types";

const TEXT_TYPE_CONFIG = {
  brief: {
    label: "Creative Brief",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="2" y="2" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M4.5 5H9.5M4.5 7H9.5M4.5 9H7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
    accentColor: "#3B82F6",
  },
  note: {
    label: "Note",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M8 2H3C2.44772 2 2 2.44772 2 3V11C2 11.5523 2.44772 12 3 12H11C11.5523 12 12 11.5523 12 11V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M12 2L7 7V9H9L14 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(-2, 0)"/>
      </svg>
    ),
    accentColor: "#F59E0B",
  },
  description: {
    label: "Description",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M2 4H12M2 7H10M2 10H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    accentColor: "#8B5CF6",
  },
};

export function TextNode({ id, data, selected }: NodeProps) {
  const textData = data as TextNodeData;
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(textData.label);
  const [editContent, setEditContent] = useState(textData.content);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const { setNodes } = useReactFlow();

  const config = TEXT_TYPE_CONFIG[textData.textType] || TEXT_TYPE_CONFIG.note;

  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.data === data) {
          return {
            ...node,
            data: {
              ...node.data,
              label: editTitle.trim() || "Untitled",
              content: editContent,
              lastModified: new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
            },
          };
        }
        return node;
      })
    );
    setIsEditing(false);
  }, [data, editTitle, editContent, setNodes]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setEditTitle(textData.label);
      setEditContent(textData.content);
      setIsEditing(false);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.height = "auto";
      contentRef.current.style.height = `${contentRef.current.scrollHeight}px`;
    }
  }, [editContent, isEditing]);

  return (
    <div
      className="group cursor-move"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={() => setIsEditing(true)}
    >
      {/* Connection Handles - visible on hover */}
      <Handle
        type="target"
        position={Position.Left}
        className="transition-all !cursor-pointer"
        style={{
          background: "#1a1a1a",
          border: "2px solid #525252",
          width: 12,
          height: 12,
          opacity: isHovered ? 1 : 0,
        }}
        onClick={(e) => {
          e.stopPropagation();
          const rect = e.currentTarget.getBoundingClientRect();
          window.dispatchEvent(new CustomEvent("atlas:handle-click", {
            detail: { 
              nodeId: id,
              handleType: "target",
              position: { x: rect.left, y: rect.top + rect.height / 2 }
            }
          }));
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="transition-all !cursor-pointer"
        style={{
          background: "#1a1a1a",
          border: "2px solid #525252",
          width: 12,
          height: 12,
          opacity: isHovered ? 1 : 0,
        }}
        onClick={(e) => {
          e.stopPropagation();
          const rect = e.currentTarget.getBoundingClientRect();
          window.dispatchEvent(new CustomEvent("atlas:handle-click", {
            detail: { 
              nodeId: id,
              handleType: "source",
              position: { x: rect.right, y: rect.top + rect.height / 2 }
            }
          }));
        }}
      />

      {/* Main Card */}
      <div
        className="rounded-xl overflow-hidden transition-all duration-200"
        style={{
          backgroundColor: "#141414",
          border: "1px solid #2a2a2a",
          outline: selected ? "2px solid white" : "none",
          outlineOffset: 2,
          width: 280,
          minHeight: isEditing ? 200 : isHovered ? 160 : 100,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2 px-3 py-2"
          style={{ borderBottom: "1px solid #2a2a2a" }}
        >
          <div
            className="w-6 h-6 rounded flex items-center justify-center"
            style={{ backgroundColor: `${config.accentColor}20`, color: config.accentColor }}
          >
            {config.icon}
          </div>
          
          {isEditing ? (
            <input
              ref={titleInputRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="nodrag flex-1 text-sm font-medium text-white bg-transparent border-none focus:outline-none"
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
              placeholder="Title..."
            />
          ) : (
            <span
              className="flex-1 text-sm font-medium text-white truncate"
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            >
              {textData.label}
            </span>
          )}
          
          <span
            className="text-xs px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: `${config.accentColor}20`,
              color: config.accentColor,
              fontFamily: "system-ui, Inter, sans-serif",
            }}
          >
            {config.label}
          </span>
        </div>

        {/* Content */}
        <div className="p-3">
          {isEditing ? (
            <textarea
              ref={contentRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              className="nodrag w-full text-sm text-gray-300 bg-transparent border-none focus:outline-none resize-none"
              style={{
                fontFamily: "system-ui, Inter, sans-serif",
                minHeight: 80,
              }}
              placeholder="Write your content here..."
            />
          ) : (
            <p
              className="text-sm text-gray-400 transition-all duration-200"
              style={{
                fontFamily: "system-ui, Inter, sans-serif",
                display: "-webkit-box",
                WebkitLineClamp: isHovered ? 6 : 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {textData.content || "Double-click to add content..."}
            </p>
          )}
        </div>

        {/* Footer - shows on hover */}
        <div
          className="flex items-center justify-between px-3 py-2 transition-all duration-200"
          style={{
            borderTop: "1px solid #2a2a2a",
            opacity: isHovered || isEditing ? 1 : 0,
            height: isHovered || isEditing ? "auto" : 0,
            padding: isHovered || isEditing ? undefined : 0,
            overflow: "hidden",
          }}
        >
          <span
            className="text-xs text-gray-500"
            style={{ fontFamily: "system-ui, Inter, sans-serif" }}
          >
            {textData.lastModified}
          </span>
          
          {textData.author && (
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium text-white"
              style={{ backgroundColor: textData.author.avatarColor || "#666666" }}
              title={textData.author.name}
            >
              {textData.author.name.split(" ").map(n => n[0]).join("")}
            </div>
          )}
        </div>

        {/* Edit hint */}
        {isEditing && (
          <div
            className="px-3 py-1.5 text-xs text-gray-500 text-center"
            style={{
              backgroundColor: "#1a1a1a",
              fontFamily: "system-ui, Inter, sans-serif",
            }}
          >
            Click outside to save, Esc to cancel
          </div>
        )}
      </div>
    </div>
  );
}
