import type { Node, Edge } from "@xyflow/react";

// Node Data Types
export interface BaseNodeData {
  label: string;
  [key: string]: unknown;
}

export interface AITextNodeData extends BaseNodeData {
  provider: "openai" | "google" | "xai";
  model: string;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
}

export interface AIImageNodeData extends BaseNodeData {
  provider: "google";
  prompt: string;
  size?: string;
}

export interface ConditionNodeData extends BaseNodeData {
  condition: string;
  operator: "contains" | "equals" | "notEquals" | "greaterThan" | "lessThan" | "isEmpty" | "isNotEmpty";
  value: string;
}

export interface MemoryNodeData extends BaseNodeData {
  memoryKey: string;
  operation: "read" | "write";
  dataType: "url" | "text" | "json";
  defaultValue?: string;
}

export interface GitHubNodeData extends BaseNodeData {
  githubUrl: string;
  owner?: string;
  repo?: string;
  branch?: string;
  fetchReadme: boolean;
  fetchStructure: boolean;
  fetchKeyFiles: boolean;
}

export interface OutputNodeData extends BaseNodeData {
  outputType: "github-wiki" | "agents-md" | "readme-md" | "custom";
  agentType?: "cursor" | "claude" | "warp" | "windsurf";
  customFilename?: string;
  customTemplate?: string;
}

export interface TextInputNodeData extends BaseNodeData {
  text: string;
}

export interface MergeNodeData extends BaseNodeData {
  separator: string;
}

// Union type for all node data
export type WorkflowNodeData =
  | AITextNodeData
  | AIImageNodeData
  | ConditionNodeData
  | MemoryNodeData
  | GitHubNodeData
  | OutputNodeData
  | TextInputNodeData
  | MergeNodeData;

// Node types enum
export type WorkflowNodeType =
  | "aiText"
  | "aiImage"
  | "condition"
  | "memory"
  | "github"
  | "output"
  | "textInput"
  | "merge";

// Workflow Node with typed data
export type WorkflowNode = Node<WorkflowNodeData, WorkflowNodeType>;

// Workflow definition
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: Edge[];
  createdAt: Date;
  updatedAt: Date;
}

// Execution result
export interface ExecutionResult {
  nodeId: string;
  nodeType: WorkflowNodeType;
  output: string | null;
  error?: string;
  timestamp: Date;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: "pending" | "running" | "completed" | "failed";
  results: ExecutionResult[];
  finalOutput?: string;
  startedAt: Date;
  completedAt?: Date;
}

// Agent templates
export const AGENT_TEMPLATES = {
  cursor: {
    name: "Cursor Agent",
    header: `# Cursor Agent Configuration

This document defines the AI assistant behavior for Cursor IDE.

## Role and Capabilities
`,
    sections: ["context", "rules", "examples", "constraints"],
  },
  claude: {
    name: "Claude Agent",
    header: `# Claude Agent System Prompt

This document configures Claude's behavior and capabilities.

## System Instructions
`,
    sections: ["personality", "capabilities", "guidelines", "limitations"],
  },
  warp: {
    name: "Warp Agent",
    header: `# Warp AI Agent Configuration

Configuration for Warp terminal AI assistant.

## Agent Definition
`,
    sections: ["commands", "workflows", "shortcuts", "integrations"],
  },
  windsurf: {
    name: "Windsurf Agent",
    header: `# Windsurf Agent Rules

AI coding assistant configuration for Windsurf IDE.

## Behavior Rules
`,
    sections: ["codeStyle", "patterns", "bestPractices", "avoidPatterns"],
  },
} as const;

// Provider models
export const AI_MODELS = {
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "o1", "o1-mini"],
  google: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
  xai: ["grok-3", "grok-3-mini"],
} as const;
