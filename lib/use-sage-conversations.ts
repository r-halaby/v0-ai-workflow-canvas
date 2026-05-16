"use client";

import { useState, useEffect, useCallback } from "react";
import useSWR, { mutate } from "swr";

export interface SageConversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface SageMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  parts?: Array<{ type: string; text?: string }>;
  created_at: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useSageConversations() {
  const { data, error, isLoading } = useSWR<{ conversations: SageConversation[] }>(
    "/api/sage/conversations",
    fetcher
  );

  const createConversation = useCallback(async (title?: string): Promise<SageConversation | null> => {
    const res = await fetch("/api/sage/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    
    if (!res.ok) return null;
    
    const { conversation } = await res.json();
    mutate("/api/sage/conversations");
    return conversation;
  }, []);

  const deleteConversation = useCallback(async (id: string): Promise<boolean> => {
    const res = await fetch(`/api/sage/conversations/${id}`, {
      method: "DELETE",
    });
    
    if (res.ok) {
      mutate("/api/sage/conversations");
      return true;
    }
    return false;
  }, []);

  const updateTitle = useCallback(async (id: string, title: string): Promise<boolean> => {
    const res = await fetch(`/api/sage/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    
    if (res.ok) {
      mutate("/api/sage/conversations");
      return true;
    }
    return false;
  }, []);

  return {
    conversations: data?.conversations || [],
    isLoading,
    error,
    createConversation,
    deleteConversation,
    updateTitle,
    refresh: () => mutate("/api/sage/conversations"),
  };
}

export function useSageConversation(conversationId: string | null) {
  const { data, error, isLoading } = useSWR<{ 
    conversation: SageConversation; 
    messages: SageMessage[] 
  }>(
    conversationId ? `/api/sage/conversations/${conversationId}` : null,
    fetcher
  );

  const saveMessages = useCallback(async (messages: Array<{ role: string; content?: string; parts?: unknown[] }>) => {
    if (!conversationId) return false;
    
    const res = await fetch(`/api/sage/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    
    return res.ok;
  }, [conversationId]);

  return {
    conversation: data?.conversation || null,
    messages: data?.messages || [],
    isLoading,
    error,
    saveMessages,
    refresh: () => conversationId && mutate(`/api/sage/conversations/${conversationId}`),
  };
}

// Hook to persist chat state in localStorage for quick restoration
export function useSageChatPersistence(chatId: string) {
  const storageKey = `sage_chat_${chatId}`;
  
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(`${storageKey}_conversation_id`) || null;
  });

  useEffect(() => {
    if (currentConversationId) {
      localStorage.setItem(`${storageKey}_conversation_id`, currentConversationId);
    } else {
      localStorage.removeItem(`${storageKey}_conversation_id`);
    }
  }, [currentConversationId, storageKey]);

  return {
    currentConversationId,
    setCurrentConversationId,
  };
}
