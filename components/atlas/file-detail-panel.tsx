"use client";

import React from "react";
import type { AtlasNode, ProductType, FileStatus, FileExtension } from "@/lib/atlas-types";
import { PRODUCT_LABELS, STATUS_LABELS } from "@/lib/atlas-types";

interface FileDetailPanelProps {
  node: AtlasNode;
  onUpdate: (nodeId: string, data: Partial<AtlasNode["data"]>) => void;
  onClose: () => void;
}

const PRODUCT_OPTIONS: ProductType[] = ["atlas", "synthesis", "sage"];
const STATUS_OPTIONS: FileStatus[] = ["draft", "in-review", "approved"];
const EXTENSION_OPTIONS: FileExtension[] = [".fig", ".psd", ".pdf", ".mp4", ".ai", ".indd", ".pptx"];

export function FileDetailPanel({ node, onUpdate, onClose }: FileDetailPanelProps) {
  const handleChange = (key: keyof AtlasNode["data"], value: string) => {
    onUpdate(node.id, { [key]: value });
  };

  return (
    <div
      className="flex flex-col h-full"
      style={{
        width: 280,
        backgroundColor: "#0a0a0a",
        borderLeft: "1px solid #222222",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid #222222" }}>
        <span className="text-white font-medium text-sm" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
          File Details
        </span>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          aria-label="Close panel"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 4L12 12M4 12L12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* File Name */}
        <div>
          <label className="block text-xs text-gray-500 mb-1.5" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
            File Name
          </label>
          <input
            type="text"
            value={node.data.fileName}
            onChange={(e) => handleChange("fileName", e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/30"
            style={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #333333",
              fontFamily: "system-ui, Inter, sans-serif",
            }}
          />
        </div>

        {/* Product Tag */}
        <div>
          <label className="block text-xs text-gray-500 mb-1.5" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
            Product
          </label>
          <select
            value={node.data.product}
            onChange={(e) => handleChange("product", e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/30"
            style={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #333333",
              fontFamily: "system-ui, Inter, sans-serif",
            }}
          >
            {PRODUCT_OPTIONS.map((product) => (
              <option key={product} value={product}>
                {PRODUCT_LABELS[product]}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs text-gray-500 mb-1.5" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
            Status
          </label>
          <select
            value={node.data.status}
            onChange={(e) => handleChange("status", e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/30"
            style={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #333333",
              fontFamily: "system-ui, Inter, sans-serif",
            }}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        {/* File Type */}
        <div>
          <label className="block text-xs text-gray-500 mb-1.5" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
            File Type
          </label>
          <select
            value={node.data.fileExtension}
            onChange={(e) => handleChange("fileExtension", e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/30"
            style={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #333333",
              fontFamily: "system-ui, Inter, sans-serif",
            }}
          >
            {EXTENSION_OPTIONS.map((ext) => (
              <option key={ext} value={ext}>
                {ext}
              </option>
            ))}
          </select>
        </div>

        {/* Label */}
        <div>
          <label className="block text-xs text-gray-500 mb-1.5" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
            Display Name
          </label>
          <input
            type="text"
            value={node.data.label}
            onChange={(e) => handleChange("label", e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/30"
            style={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #333333",
              fontFamily: "system-ui, Inter, sans-serif",
            }}
          />
        </div>

        {/* Last Modified */}
        <div>
          <label className="block text-xs text-gray-500 mb-1.5" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
            Last Modified
          </label>
          <input
            type="text"
            value={node.data.lastModified}
            onChange={(e) => handleChange("lastModified", e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/30"
            style={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #333333",
              fontFamily: "system-ui, Inter, sans-serif",
            }}
          />
        </div>
      </div>
    </div>
  );
}
