"use client";

import React, { createContext, useContext, useCallback, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";

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

interface SageChatState {
  messages: UIMessage[];
  status: "ready" | "submitted" | "streaming" | "error";
  sendMessage: (message: { text: string }) => void;
  pendingSuggestion: Array<{ label: string; color: string }> | null;
  setPendingSuggestion: (suggestion: Array<{ label: string; color: string }> | null) => void;
}

interface SageChatsContextValue {
  getOrCreateChat: (nodeId: string, position: { x: number; y: number }) => SageChatState;
}

const SageChatsContext = createContext<SageChatsContextValue | null>(null);

// Individual chat hook component that manages a single chat instance
function useSageChatInstance(nodeId: string, position: { x: number; y: number }) {
  const [pendingSuggestion, setPendingSuggestion] = useState<Array<{ label: string; color: string }> | null>(null);
  
  const emitSageAction = useCallback((action: SageAction) => {
    window.dispatchEvent(new CustomEvent("sage:action", {
      detail: {
        action,
        nodeId,
        position,
      },
    }));
  }, [nodeId, position]);

  const { messages, sendMessage, status } = useChat({
    id: `sage-${nodeId}`,
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
  React.useEffect(() => {
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

  return {
    messages,
    status,
    sendMessage,
    pendingSuggestion,
    setPendingSuggestion,
  };
}

// Store for chat instances
const chatInstances = new Map<string, SageChatState>();

export function SageChatsProvider({ children }: { children: React.ReactNode }) {
  const getOrCreateChat = useCallback((nodeId: string, position: { x: number; y: number }): SageChatState => {
    // This is a placeholder - actual state comes from useSageChat hook
    // The provider just ensures context is available
    return chatInstances.get(nodeId) || {
      messages: [],
      status: "ready" as const,
      sendMessage: () => {},
      pendingSuggestion: null,
      setPendingSuggestion: () => {},
    };
  }, []);

  return (
    <SageChatsContext.Provider value={{ getOrCreateChat }}>
      {children}
    </SageChatsContext.Provider>
  );
}

// Hook to use a Sage chat - this is what components actually use
export function useSageChat(nodeId: string, position: { x: number; y: number }) {
  const chat = useSageChatInstance(nodeId, position);
  
  // Update the shared instance
  React.useEffect(() => {
    chatInstances.set(nodeId, chat);
    return () => {
      // Don't remove on unmount - keep the chat state
    };
  }, [nodeId, chat]);
  
  return chat;
}
