"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useChat } from "@ai-sdk/react";
import type { SageChatbotNodeData } from "@/lib/atlas-types";

interface SageAction {
  action: string;
  pills?: Array<{ label: string; color: string; index: number }>;
  arrangement?: string;
  title?: string;
  content?: string;
  projectType?: string;
  suggestion?: Array<{ label: string; color: string }>;
}

export function SageChatbotNode({ id, data, selected, positionAbsoluteX, positionAbsoluteY }: NodeProps) {
  const nodeData = data as SageChatbotNodeData;
  const [inputValue, setInputValue] = useState("");
  const [pendingSuggestion, setPendingSuggestion] = useState<Array<{ label: string; color: string }> | null>(null);
  
  // Emit event for parent to handle actions
  const emitSageAction = useCallback((action: SageAction) => {
    window.dispatchEvent(new CustomEvent("sage:action", {
      detail: {
        action,
        nodeId: id,
        position: { x: positionAbsoluteX || 0, y: positionAbsoluteY || 0 },
      },
    }));
  }, [id, positionAbsoluteX, positionAbsoluteY]);
  
  const { messages, append, isLoading } = useChat({
    api: "/api/sage",
    id: `sage-${id}`,
    initialMessages: nodeData.messages?.map(m => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
    })) || [],
    onToolCall: async ({ toolCall }) => {
      // Handle tool results from the AI
      const result = toolCall.args as SageAction;
      
      if (result.action === "createStatusPills") {
        emitSageAction(result);
      } else if (result.action === "suggestWorkflow" && result.suggestion) {
        setPendingSuggestion(result.suggestion);
      } else if (result.action === "createTextNote") {
        emitSageAction(result);
      }
    },
  });

  // Handle creating pills from a suggestion
  const handleCreateFromSuggestion = useCallback(() => {
    if (pendingSuggestion) {
      emitSageAction({
        action: "createStatusPills",
        pills: pendingSuggestion.map((pill, index) => ({ ...pill, index })),
        arrangement: "horizontal",
      });
      setPendingSuggestion(null);
    }
  }, [pendingSuggestion, emitSageAction]);

  const handleSend = useCallback(() => {
    if (!inputValue.trim() || isLoading) return;
    append({ role: "user", content: inputValue });
    setInputValue("");
  }, [inputValue, isLoading, append]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return (
    <div
      className="group rounded-xl transition-all duration-200"
      style={{
        backgroundColor: "#1a1a1a",
        border: selected ? "2px solid #F0FE00" : "1px solid #F0FE0030",
        width: 280,
        minHeight: 200,
      }}
>
      {/* Header */}
      <div
        className="px-3 py-2 flex items-center gap-2 border-b"
        style={{ borderColor: "#F0FE0020" }}
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "#F0FE0020" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F0FE00" strokeWidth="2">
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
      <div className="p-2 space-y-2 max-h-[180px] overflow-y-auto">
        {messages.length > 0 ? (
          messages.slice(-4).map((msg) => (
            <div
              key={msg.id}
              className={`text-xs px-2 py-1.5 rounded-lg ${
                msg.role === "user"
                  ? "bg-white/5 text-gray-300 ml-4"
                  : "text-gray-400 mr-4"
              }`}
              style={{
                backgroundColor: msg.role === "assistant" ? "#F0FE0010" : undefined,
                fontFamily: "system-ui, Inter, sans-serif",
              }}
            >
              {msg.content.length > 120 ? msg.content.slice(0, 120) + "..." : msg.content}
            </div>
          ))
        ) : (
          <div className="text-xs text-gray-500 text-center py-4" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
            Ask Sage to create statuses, suggest workflows, or help organize your project
          </div>
        )}
        {isLoading && (
          <div className="text-xs text-[#F0FE00] px-2 py-1.5 mr-4" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
            Sage is thinking...
          </div>
        )}
        
        {/* Show pending suggestion with action button */}
        {pendingSuggestion && (
          <div className="mt-2 p-2 rounded-lg" style={{ backgroundColor: "#F0FE0015", border: "1px solid #F0FE0030" }}>
            <div className="text-xs text-gray-400 mb-2" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
              Suggested statuses:
            </div>
            <div className="flex flex-wrap gap-1 mb-2">
              {pendingSuggestion.map((pill, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium text-black"
                  style={{ backgroundColor: pill.color }}
                >
                  {pill.label}
                </span>
              ))}
            </div>
            <button
              onClick={handleCreateFromSuggestion}
              className="w-full py-1.5 rounded text-xs font-medium transition-colors"
              style={{ 
                backgroundColor: "#F0FE00", 
                color: "#000",
                fontFamily: "system-ui, Inter, sans-serif",
              }}
            >
              Create these on canvas
            </button>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-2 border-t" style={{ borderColor: "#F0FE0020" }}>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Sage..."
            className="flex-1 bg-white/5 text-xs text-white placeholder-gray-500 px-2 py-1.5 rounded-md outline-none"
            style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !inputValue.trim()}
            className="p-1.5 rounded-md hover:bg-white/10 transition-colors disabled:opacity-50"
            style={{ color: "#F0FE00" }}
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
        style={{ background: "#1a1a1a", border: "2px solid #F0FE00", width: 12, height: 12 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!opacity-0 group-hover:!opacity-100 transition-all !cursor-pointer"
        style={{ background: "#1a1a1a", border: "2px solid #F0FE00", width: 12, height: 12 }}
      />
    </div>
  );
}
