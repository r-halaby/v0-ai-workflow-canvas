"use client";

import React from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { SageOverviewNodeData } from "@/lib/atlas-types";

export function SageOverviewNode({ id, data, selected }: NodeProps) {
  const nodeData = data as SageOverviewNodeData;

  const getProgressColor = (value: number) => {
    if (value >= 75) return "#22c55e";
    if (value >= 50) return "#eab308";
    return "#ef4444";
  };

  return (
    <div
      className={`group rounded-xl transition-all duration-200 ${
        selected ? "ring-2 ring-amber-500/50" : ""
      }`}
      style={{
        backgroundColor: "#1a1a1a",
        border: "1px solid #BA751730",
        width: 260,
      }}
    >
      {/* Header */}
      <div
        className="px-3 py-2 flex items-center gap-2 border-b"
        style={{ borderColor: "#BA751720" }}
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "#BA751720" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#BA7517" strokeWidth="2">
            <path d="M3 3v18h18" />
            <path d="M18 17l-5-5-4 4-3-3" />
          </svg>
        </div>
        <span className="text-sm font-medium text-white" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
          Project Overview
        </span>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
              Project Progress
            </span>
            <span className="text-xs font-medium" style={{ color: getProgressColor(nodeData.projectProgress), fontFamily: "system-ui, Inter, sans-serif" }}>
              {nodeData.projectProgress}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${nodeData.projectProgress}%`, backgroundColor: getProgressColor(nodeData.projectProgress) }}
            />
          </div>
        </div>

        {/* Alignment */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
              Stakeholder Alignment
            </span>
            <span className="text-xs font-medium" style={{ color: getProgressColor(nodeData.alignmentScore), fontFamily: "system-ui, Inter, sans-serif" }}>
              {nodeData.alignmentScore}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${nodeData.alignmentScore}%`, backgroundColor: getProgressColor(nodeData.alignmentScore) }}
            />
          </div>
        </div>

        {/* Summary */}
        <div className="pt-2 border-t" style={{ borderColor: "#333333" }}>
          <p className="text-xs text-gray-400 leading-relaxed" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
            {nodeData.summary || "Sage will provide a summary of your project status and recommendations."}
          </p>
        </div>

        {/* Last Updated */}
        <div className="text-[10px] text-gray-500" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
          Updated {nodeData.lastUpdated || "just now"}
        </div>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!opacity-0 group-hover:!opacity-100 transition-all !cursor-pointer"
        style={{ background: "#1a1a1a", border: "2px solid #BA7517", width: 12, height: 12 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!opacity-0 group-hover:!opacity-100 transition-all !cursor-pointer"
        style={{ background: "#1a1a1a", border: "2px solid #BA7517", width: 12, height: 12 }}
      />
    </div>
  );
}
