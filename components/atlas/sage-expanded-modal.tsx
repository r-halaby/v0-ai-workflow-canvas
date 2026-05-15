"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { SageChatbotNodeData, SageOverviewNodeData } from "@/lib/atlas-types";

interface SageAction {
  action: string;
  pills?: Array<{ label: string; color: string; index: number }>;
  arrangement?: string;
  title?: string;
  content?: string;
  projectType?: string;
  suggestion?: Array<{ label: string; color: string }>;
}

function getColorHex(colorName: string): string {
  const colors: Record<string, string> = {
    gray: "#e5e5e5",
    blue: "#93c5fd",
    green: "#86efac",
    yellow: "#fde047",
    orange: "#fdba74",
    red: "#fca5a5",
    purple: "#c4b5fd",
    pink: "#f9a8d4",
  };
  return colors[colorName] || colorName;
}

interface SageExpandedModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeId: string;
  nodeType: "sage-chatbot" | "sage-overview" | "sage-stakeholder";
  nodeData: SageChatbotNodeData | SageOverviewNodeData;
  nodePosition: { x: number; y: number };
}

export function SageExpandedModal({
  isOpen,
  onClose,
  nodeId,
  nodeType,
  nodeData,
  nodePosition,
}: SageExpandedModalProps) {
  const [inputValue, setInputValue] = useState("");
  const [pendingSuggestion, setPendingSuggestion] = useState<Array<{ label: string; color: string }> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Emit event for parent to handle actions
  const emitSageAction = useCallback((action: SageAction) => {
    window.dispatchEvent(new CustomEvent("sage:action", {
      detail: {
        action,
        nodeId,
        position: nodePosition,
      },
    }));
  }, [nodeId, nodePosition]);

  const { messages, sendMessage, status } = useChat({
    id: `sage-expanded-${nodeId}`,
    transport: new DefaultChatTransport({ api: "/api/sage" }),
    onToolCall: async ({ toolCall }) => {
      const args = toolCall.args as Record<string, unknown>;
      
      if (toolCall.toolName === "createStatusPills") {
        const pills = (args.pills as Array<{ label: string; color: string }>).map((pill, index) => ({
          label: pill.label,
          color: getColorHex(pill.color as string),
          index,
        }));
        emitSageAction({
          action: "createStatusPills",
          pills,
          arrangement: (args.arrangement as string) || "horizontal",
        });
      } else if (toolCall.toolName === "createTextNote") {
        emitSageAction({
          action: "createTextNote",
          title: args.title as string,
          content: args.content as string,
        });
      }
    },
  });

  // Process tool results from messages to detect suggestions
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "assistant" && lastMessage.parts) {
      for (const part of lastMessage.parts) {
        if (part.type === "tool-invocation" && part.toolInvocation?.state === "result") {
          const result = part.toolInvocation.result as SageAction;
          if (result?.action === "suggestWorkflow" && result.suggestion) {
            setPendingSuggestion(result.suggestion);
          }
        }
      }
    }
  }, [messages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isLoading = status === "streaming" || status === "submitted";

  const getMessageText = useCallback((msg: typeof messages[0]): string => {
    if (!msg.parts || !Array.isArray(msg.parts)) return "";
    return msg.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("");
  }, []);

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

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;
    const messageToSend = inputValue;
    setInputValue("");
    try {
      await sendMessage({ text: messageToSend });
    } catch (error) {
      console.error("[v0] Error sending message:", error);
      setInputValue(messageToSend);
    }
  }, [inputValue, isLoading, sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  if (!isOpen) return null;

  const getTitle = () => {
    switch (nodeType) {
      case "sage-chatbot": return "Sage Assistant";
      case "sage-overview": return "Project Overview";
      case "sage-stakeholder": return "Stakeholder Analysis";
      default: return "Sage";
    }
  };

  const getIcon = () => {
    switch (nodeType) {
      case "sage-chatbot":
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F0FE00" strokeWidth="2">
            <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z" />
            <circle cx="12" cy="10" r="3" />
            <path d="M7 20.662V19c0-2.21 2.239-4 5-4s5 1.79 5 4v1.662" />
          </svg>
        );
      case "sage-overview":
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F0FE00" strokeWidth="2">
            <path d="M3 3v18h18" />
            <path d="M18 17l-5-5-4 4-3-3" />
          </svg>
        );
      case "sage-stakeholder":
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F0FE00" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl max-h-[80vh] rounded-2xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: "#0a0a0a",
          border: "1px solid #F0FE0030",
          boxShadow: "0 0 60px rgba(240, 254, 0, 0.1)",
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center justify-between border-b shrink-0"
          style={{ borderColor: "#F0FE0020", backgroundColor: "#111111" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#F0FE0015" }}
            >
              {getIcon()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                {getTitle()}
              </h2>
              <p className="text-xs text-gray-500" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                Your creative AI assistant
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5L15 15" stroke="#888888" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[300px]">
          {messages.length > 0 ? (
            messages.map((msg) => {
              const text = getMessageText(msg);
              if (!text) return null;
              return (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                      msg.role === "user"
                        ? "bg-white/10 text-white rounded-br-md"
                        : "text-gray-300 rounded-bl-md"
                    }`}
                    style={{
                      backgroundColor: msg.role === "assistant" ? "#F0FE0010" : undefined,
                      fontFamily: "system-ui, Inter, sans-serif",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {text}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: "#F0FE0015" }}
              >
                {getIcon()}
              </div>
              <h3 className="text-lg font-medium text-white mb-2" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                How can I help?
              </h3>
              <p className="text-sm text-gray-500 max-w-sm" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                Ask me to create status workflows, suggest project structures, add notes, or help organize your creative project.
              </p>
              <div className="flex flex-wrap gap-2 mt-6 justify-center">
                {["Create statuses for my project", "Suggest a workflow", "Add a project note"].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInputValue(suggestion)}
                    className="px-3 py-1.5 rounded-full text-xs text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    style={{ border: "1px solid #333333", fontFamily: "system-ui, Inter, sans-serif" }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div
                className="px-4 py-3 rounded-2xl rounded-bl-md text-sm"
                style={{ backgroundColor: "#F0FE0010" }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#F0FE00] animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-[#F0FE00] animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-[#F0FE00] animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-xs text-[#F0FE00]" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                    Sage is thinking...
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Pending Suggestion */}
          {pendingSuggestion && (
            <div
              className="p-4 rounded-xl"
              style={{ backgroundColor: "#F0FE0015", border: "1px solid #F0FE0040" }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-white font-medium" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                  Suggested Statuses
                </div>
                <button
                  onClick={() => setPendingSuggestion(null)}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M11 3L3 11M3 3L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {pendingSuggestion.map((pill, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: pill.color, color: "#000" }}
                  >
                    {pill.label}
                  </span>
                ))}
              </div>
              <div className="text-xs text-gray-400 mb-3" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                Reply to modify, or click below to add to canvas
              </div>
              <button
                onClick={handleCreateFromSuggestion}
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
                style={{ 
                  backgroundColor: "#F0FE00", 
                  color: "#000",
                  fontFamily: "system-ui, Inter, sans-serif",
                }}
              >
                Add to Canvas
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div
          className="px-5 py-4 border-t shrink-0"
          style={{ borderColor: "#F0FE0020", backgroundColor: "#111111" }}
        >
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Sage anything..."
              className="flex-1 bg-white/5 text-sm text-white placeholder-gray-500 px-4 py-3 rounded-xl outline-none focus:ring-1 focus:ring-[#F0FE00]/30"
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={isLoading || !inputValue.trim()}
              className="p-3 rounded-xl transition-all disabled:opacity-50 hover:brightness-110"
              style={{ backgroundColor: "#F0FE00" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
