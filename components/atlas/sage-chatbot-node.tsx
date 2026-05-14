"use client";

import React, { useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { SageChatbotNodeData } from "@/lib/atlas-types";

export function SageChatbotNode({ id, data, selected }: NodeProps) {
  const nodeData = data as SageChatbotNodeData;
  const [inputValue, setInputValue] = useState("");

  return (
    <div
      className={`group rounded-xl transition-all duration-200 ${
        selected ? "ring-2 ring-amber-500/50" : ""
      }`}
      style={{
        backgroundColor: "#1a1a1a",
        border: "1px solid #BA751730",
        width: 280,
        minHeight: 200,
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
            <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z" />
            <circle cx="12" cy="10" r="3" />
            <path d="M7 20.662V19c0-2.21 2.239-4 5-4s5 1.79 5 4v1.662" />
          </svg>
        </div>
        <span className="text-sm font-medium text-white" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
          Sage Chat
        </span>
      </div>

      {/* Messages */}
      <div className="p-2 space-y-2 max-h-[120px] overflow-y-auto">
        {nodeData.messages && nodeData.messages.length > 0 ? (
          nodeData.messages.slice(-3).map((msg) => (
            <div
              key={msg.id}
              className={`text-xs px-2 py-1.5 rounded-lg ${
                msg.role === "user"
                  ? "bg-white/5 text-gray-300 ml-4"
                  : "text-gray-400 mr-4"
              }`}
              style={{
                backgroundColor: msg.role === "assistant" ? "#BA751710" : undefined,
                fontFamily: "system-ui, Inter, sans-serif",
              }}
            >
              {msg.content.length > 80 ? msg.content.slice(0, 80) + "..." : msg.content}
            </div>
          ))
        ) : (
          <div className="text-xs text-gray-500 text-center py-4" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
            Ask Sage anything about your project
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-2 border-t" style={{ borderColor: "#BA751720" }}>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask Sage..."
            className="flex-1 bg-white/5 text-xs text-white placeholder-gray-500 px-2 py-1.5 rounded-md outline-none focus:ring-1 focus:ring-amber-500/30"
            style={{ fontFamily: "system-ui, Inter, sans-serif" }}
          />
          <button
            className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
            style={{ color: "#BA7517" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
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
