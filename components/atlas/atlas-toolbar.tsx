"use client";

import React, { useState, useRef, useEffect } from "react";

interface AtlasToolbarProps {
  canvasName?: string;
  onBack?: () => void;
  onCanvasNameChange?: (name: string) => void;
}

export function AtlasToolbar({ canvasName, onBack, onCanvasNameChange }: AtlasToolbarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(canvasName || "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(canvasName || "");
  }, [canvasName]);

  const handleSave = () => {
    if (editValue.trim() && onCanvasNameChange) {
      onCanvasNameChange(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(canvasName || "");
      setIsEditing(false);
    }
  };

  return (
    <div className="fixed top-4 left-4 z-50 flex items-center gap-3">
      {/* Atlas Logo - clickable to go home */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center opacity-80 hover:opacity-100 transition-opacity"
      >
        <img 
          src="/atlas-logo.svg" 
          alt="Atlas" 
          className="h-5"
          style={{ width: "auto" }}
        />
      </button>

      {/* Separator and Canvas Name */}
      {canvasName && (
        <>
          <span className="text-gray-600">|</span>
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              className="text-sm text-white bg-transparent border-b border-gray-500 focus:border-white focus:outline-none px-0 py-0.5 min-w-[100px]"
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-sm text-gray-400 hover:text-white transition-colors cursor-text"
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            >
              {canvasName}
            </button>
          )}
        </>
      )}
    </div>
  );
}
