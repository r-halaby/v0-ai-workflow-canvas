"use client";

import React, { useState } from "react";
import type { Canvas, CanvasTemplate, TemplateCategory, WorkspaceMember } from "@/lib/atlas-types";
import { TEMPLATE_CATEGORIES } from "@/lib/atlas-types";

interface SaveTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  canvas: Canvas;
  currentUser: WorkspaceMember;
  onSaveTemplate: (template: CanvasTemplate) => void;
}

export function SaveTemplateDialog({
  open,
  onClose,
  canvas,
  currentUser,
  onSaveTemplate,
}: SaveTemplateDialogProps) {
  const [name, setName] = useState(canvas.name);
  const [description, setDescription] = useState(canvas.description || "");
  const [category, setCategory] = useState<TemplateCategory>("workflow");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!open) return null;

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    setIsSaving(true);

    const template: CanvasTemplate = {
      id: `template-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      category,
      previewImage: canvas.previewImage,
      nodes: canvas.nodes,
      edges: canvas.edges,
      createdAt: new Date().toISOString(),
      createdBy: currentUser,
      upvotes: 0,
      upvotedBy: [],
      downloads: 0,
      tags,
    };

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    onSaveTemplate(template);
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Dialog */}
      <div
        className="relative w-full max-w-lg rounded-xl overflow-hidden"
        style={{ backgroundColor: "#1a1a1a", border: "1px solid #333333" }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid #333333" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#F0FE0015" }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="14" height="14" rx="2" stroke="#F0FE00" strokeWidth="1.5"/>
                <path d="M7 10H13M10 7V13" stroke="#F0FE00" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h2
                className="text-lg font-semibold text-white"
                style={{ fontFamily: "system-ui, Inter, sans-serif" }}
              >
                Save as Template
              </h2>
              <p
                className="text-sm text-gray-400"
                style={{ fontFamily: "system-ui, Inter, sans-serif" }}
              >
                Share your canvas with the community
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5">
          {/* Template Name */}
          <div>
            <label
              className="block text-sm font-medium text-gray-300 mb-2"
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            >
              Template Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter template name"
              className="w-full px-4 py-2.5 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F0FE00]/50"
              style={{
                backgroundColor: "#252525",
                border: "1px solid #333333",
                fontFamily: "system-ui, Inter, sans-serif",
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label
              className="block text-sm font-medium text-gray-300 mb-2"
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            >
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this template is for..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F0FE00]/50 resize-none"
              style={{
                backgroundColor: "#252525",
                border: "1px solid #333333",
                fontFamily: "system-ui, Inter, sans-serif",
              }}
            />
          </div>

          {/* Category */}
          <div>
            <label
              className="block text-sm font-medium text-gray-300 mb-2"
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            >
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(TEMPLATE_CATEGORIES) as TemplateCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    category === cat
                      ? "text-[#0a0a0a] font-medium"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                  style={{
                    backgroundColor: category === cat ? "#F0FE00" : "#252525",
                    border: `1px solid ${category === cat ? "#F0FE00" : "#333333"}`,
                    fontFamily: "system-ui, Inter, sans-serif",
                  }}
                >
                  {TEMPLATE_CATEGORIES[cat].label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label
              className="block text-sm font-medium text-gray-300 mb-2"
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            >
              Tags <span className="text-gray-500 font-normal">(up to 5)</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm"
                  style={{
                    backgroundColor: "#252525",
                    border: "1px solid #333333",
                    color: "#F0FE00",
                    fontFamily: "system-ui, Inter, sans-serif",
                  }}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-white transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a tag..."
                disabled={tags.length >= 5}
                className="flex-1 px-4 py-2 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F0FE00]/50 disabled:opacity-50"
                style={{
                  backgroundColor: "#252525",
                  border: "1px solid #333333",
                  fontFamily: "system-ui, Inter, sans-serif",
                }}
              />
              <button
                type="button"
                onClick={handleAddTag}
                disabled={!tagInput.trim() || tags.length >= 5}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: "#252525",
                  border: "1px solid #333333",
                  color: "#F0FE00",
                  fontFamily: "system-ui, Inter, sans-serif",
                }}
              >
                Add
              </button>
            </div>
          </div>

          {/* Preview info */}
          <div
            className="p-3 rounded-lg flex items-center gap-3"
            style={{ backgroundColor: "#252525", border: "1px solid #333333" }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="9" cy="9" r="7" stroke="#888888" strokeWidth="1.5"/>
              <path d="M9 6V9.5" stroke="#888888" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="9" cy="12" r="0.75" fill="#888888"/>
            </svg>
            <p
              className="text-sm text-gray-400"
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            >
              Your template will include {canvas.nodes.length} nodes and be attributed to you in the community.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 flex items-center justify-end gap-3"
          style={{ borderTop: "1px solid #333333" }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            style={{ fontFamily: "system-ui, Inter, sans-serif" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim() || isSaving}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-[#0a0a0a] transition-colors disabled:opacity-50 flex items-center gap-2"
            style={{
              backgroundColor: "#F0FE00",
              fontFamily: "system-ui, Inter, sans-serif",
            }}
          >
            {isSaving ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M14 10V13C14 13.552 13.552 14 13 14H3C2.448 14 2 13.552 2 13V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M8 2V10M8 2L5 5M8 2L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Publish Template
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
