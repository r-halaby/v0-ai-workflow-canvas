"use client";

import { useState, useCallback, useEffect } from "react";
import type { 
  SageProjectState, 
  SageHealthStatus, 
  FeedbackType,
  ProjectType,
  Decision,
  FeedbackRecord,
  ProjectIntent,
} from "./atlas-types";
import { HEALTH_STATUS_COLORS } from "./atlas-types";

// ============================================================================
// SAGE CLIENT API - Fetch project state and call tools
// ============================================================================

interface SageToolResult {
  action: string;
  summary?: string;
  error?: string;
  [key: string]: unknown;
}

interface UseSageOptions {
  projectId: string;
  autoFetch?: boolean;
}

interface UseSageReturn {
  // State
  state: SageProjectState | null;
  loading: boolean;
  error: string | null;
  
  // Health indicators
  healthStatus: SageHealthStatus;
  healthColor: string;
  driftScore: number;
  
  // Actions
  fetchState: () => Promise<void>;
  classifyFeedback: (feedback: string, reviewerRole: string, source?: string) => Promise<SageToolResult>;
  updateIntent: (statement: string, reason?: string) => Promise<SageToolResult>;
  logDecision: (decision: string, rationale: string, feedbackIds?: string[], tags?: string[]) => Promise<SageToolResult>;
  resolveFeedback: (feedbackId: string, resolution: string, decisionId?: string) => Promise<SageToolResult>;
  generateBrief: (options?: { includeDecisions?: boolean; includeFeedback?: boolean; includeMetrics?: boolean; format?: "markdown" | "structured" }) => Promise<SageToolResult>;
  getDriftReport: () => Promise<SageToolResult>;
}

// Default empty state
const defaultState: SageProjectState = {
  projectId: "",
  intent: null,
  decisions: [],
  feedback: [],
  driftHistory: [],
  statusSet: null,
  currentDriftScore: 85,
  unresolvedFeedbackCount: 0,
  conflictCount: 0,
  lastUpdated: new Date().toISOString(),
};

/**
 * Hook to interact with Sage project intelligence
 */
export function useSage({ projectId, autoFetch = true }: UseSageOptions): UseSageReturn {
  const [state, setState] = useState<SageProjectState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate derived values
  const driftScore = state?.currentDriftScore ?? 85;
  const healthStatus: SageHealthStatus = 
    driftScore >= 80 ? "healthy" :
    driftScore >= 60 ? "needs-attention" :
    driftScore >= 40 ? "at-risk" : "critical";
  const healthColor = HEALTH_STATUS_COLORS[healthStatus];

  // Generic tool caller
  const callSageTool = useCallback(async (
    toolName: string,
    params: Record<string, unknown>
  ): Promise<SageToolResult> => {
    try {
      // For now, we simulate tool calls by sending a message to the Sage API
      // In production, this would be a direct tool invocation endpoint
      const response = await fetch("/api/sage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `[TOOL_CALL:${toolName}] ${JSON.stringify(params)}`,
          }],
          canvasId: projectId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Sage API error: ${response.status}`);
      }

      // Parse streaming response to get tool result
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      let result = "";
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value);
      }

      // Try to extract tool result from response
      const toolResultMatch = result.match(/\{[^{}]*"action"\s*:\s*"[^"]+"/);
      if (toolResultMatch) {
        try {
          // Find the full JSON object
          const startIdx = result.indexOf(toolResultMatch[0]);
          let braceCount = 0;
          let endIdx = startIdx;
          for (let i = startIdx; i < result.length; i++) {
            if (result[i] === '{') braceCount++;
            if (result[i] === '}') braceCount--;
            if (braceCount === 0) {
              endIdx = i + 1;
              break;
            }
          }
          return JSON.parse(result.substring(startIdx, endIdx));
        } catch {
          // Fall through to default return
        }
      }

      return { action: toolName, summary: "Tool executed" };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      return { action: toolName, error: errorMessage };
    }
  }, [projectId]);

  // Fetch current project state
  const fetchState = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await callSageTool("getProjectState", { projectId });
      
      if (result.error) {
        setError(result.error);
        return;
      }

      // Build state from result
      const newState: SageProjectState = {
        projectId,
        intent: result.intentStatement ? {
          id: `intent-${projectId}`,
          projectId,
          statement: result.intentStatement as string,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          actor: "user",
          revisionHistory: [],
        } : null,
        decisions: [],
        feedback: [],
        driftHistory: [],
        statusSet: null,
        currentDriftScore: (result.driftScore as number) ?? 85,
        unresolvedFeedbackCount: (result.unresolvedFeedbackCount as number) ?? 0,
        conflictCount: (result.conflictCount as number) ?? 0,
        lastUpdated: new Date().toISOString(),
      };
      
      setState(newState);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch state");
    } finally {
      setLoading(false);
    }
  }, [projectId, callSageTool]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch && projectId) {
      fetchState();
    }
  }, [autoFetch, projectId, fetchState]);

  // Tool action wrappers
  const classifyFeedback = useCallback(async (
    feedback: string,
    reviewerRole: string,
    source: string = "stakeholder"
  ) => {
    const result = await callSageTool("classifyFeedback", {
      projectId,
      feedback,
      reviewerRole,
      source,
    });
    
    // Refresh state after classification
    await fetchState();
    return result;
  }, [projectId, callSageTool, fetchState]);

  const updateIntent = useCallback(async (statement: string, reason?: string) => {
    const result = await callSageTool("updateIntent", {
      projectId,
      statement,
      reason,
    });
    
    await fetchState();
    return result;
  }, [projectId, callSageTool, fetchState]);

  const logDecision = useCallback(async (
    decision: string,
    rationale: string,
    relatedFeedbackIds?: string[],
    tags?: string[]
  ) => {
    const result = await callSageTool("logDecision", {
      projectId,
      decision,
      rationale,
      relatedFeedbackIds,
      tags,
    });
    
    await fetchState();
    return result;
  }, [projectId, callSageTool, fetchState]);

  const resolveFeedback = useCallback(async (
    feedbackId: string,
    resolution: string,
    linkedDecisionId?: string
  ) => {
    const result = await callSageTool("resolveFeedback", {
      projectId,
      feedbackId,
      resolution,
      linkedDecisionId,
    });
    
    await fetchState();
    return result;
  }, [projectId, callSageTool, fetchState]);

  const generateBrief = useCallback(async (options?: {
    includeDecisions?: boolean;
    includeFeedback?: boolean;
    includeMetrics?: boolean;
    format?: "markdown" | "structured";
  }) => {
    return callSageTool("generateBrief", {
      projectId,
      ...options,
    });
  }, [projectId, callSageTool]);

  const getDriftReport = useCallback(async () => {
    return callSageTool("getDriftReport", { projectId });
  }, [projectId, callSageTool]);

  return {
    state,
    loading,
    error,
    healthStatus,
    healthColor,
    driftScore,
    fetchState,
    classifyFeedback,
    updateIntent,
    logDecision,
    resolveFeedback,
    generateBrief,
    getDriftReport,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get a human-readable label for health status
 */
export function getHealthLabel(status: SageHealthStatus): string {
  const labels: Record<SageHealthStatus, string> = {
    "healthy": "On Track",
    "needs-attention": "Needs Attention",
    "at-risk": "At Risk",
    "critical": "Critical",
  };
  return labels[status];
}

/**
 * Get a human-readable label for feedback type
 */
export function getFeedbackTypeLabel(type: FeedbackType): string {
  const labels: Record<FeedbackType, string> = {
    "aesthetic-preference": "Aesthetic",
    "functional-requirement": "Functional",
    "strategic-direction": "Strategic",
    "technical-constraint": "Technical",
    "clarification-request": "Clarification",
    "approval": "Approval",
    "revision-request": "Revision",
  };
  return labels[type];
}

/**
 * Format a date relative to now
 */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString();
}
