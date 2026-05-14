"use client";

import React from "react";
import type { NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";
import type { ProjectHealthNodeData } from "@/lib/atlas-types";

export function ProjectHealthNode({ id, data, selected }: NodeProps) {
  const nodeData = data as ProjectHealthNodeData;
  
  const statusColor = nodeData.healthStatus === "on-track" ? "#22c55e" : nodeData.healthStatus === "needs-attention" ? "#f59e0b" : "#ef4444";
  const touchpointColor = nodeData.daysSinceClientTouchpoint <= 3 ? "#22c55e" : nodeData.daysSinceClientTouchpoint <= 7 ? "#f59e0b" : "#ef4444";

  const phases = ["discovery", "design", "development", "review", "delivery"];
  const currentPhaseIndex = phases.indexOf(nodeData.projectPhase);

  return (
    <div
      className="group rounded-xl transition-all duration-200"
      style={{
        backgroundColor: "#1a1a1a",
        border: selected ? "2px solid #8b5cf6" : "1px solid #8b5cf620",
        width: 260,
      }}
    >
      {/* Header */}
      <div
        className="px-3 py-2 flex items-center justify-between border-b"
        style={{ borderColor: "#8b5cf620" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded flex items-center justify-center"
            style={{ backgroundColor: "#8b5cf620" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <span className="text-sm font-medium text-white" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
            {nodeData.label || "Project Health"}
          </span>
        </div>
        <div 
          className="px-2 py-0.5 rounded-full text-[10px] font-medium"
          style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
        >
          {nodeData.healthStatus?.replace("-", " ") || "unknown"}
        </div>
      </div>

      {/* Phase Progress */}
      <div className="px-3 pt-3">
        <div className="flex items-center gap-1 mb-2">
          {phases.map((phase, idx) => (
            <div 
              key={phase}
              className="flex-1 h-1 rounded-full"
              style={{ 
                backgroundColor: idx <= currentPhaseIndex ? "#8b5cf6" : "#ffffff10"
              }}
            />
          ))}
        </div>
        <div className="text-xs text-gray-400 capitalize">{nodeData.projectPhase} Phase</div>
      </div>

      {/* Metrics */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Last Client Touchpoint</span>
          <span className="text-xs font-medium" style={{ color: touchpointColor }}>
            {nodeData.daysSinceClientTouchpoint} days ago
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Open Feedback Cycles</span>
          <span className="text-xs font-medium text-white">
            {nodeData.openFeedbackCycles}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Revision Count</span>
          <span className="text-xs font-medium text-white">
            {nodeData.revisionCount}
          </span>
        </div>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="opacity-0 group-hover:opacity-100 transition-all !cursor-pointer"
        style={{ background: "#1a1a1a", border: "2px solid #8b5cf6", width: 12, height: 12 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="opacity-0 group-hover:opacity-100 transition-all !cursor-pointer"
        style={{ background: "#1a1a1a", border: "2px solid #8b5cf6", width: 12, height: 12 }}
      />
    </div>
  );
}
