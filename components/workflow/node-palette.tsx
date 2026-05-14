"use client";

import React from "react"

import { cn } from "@/lib/utils";
import type { WorkflowNodeType } from "@/lib/workflow-types";
import { NODE_COLORS } from "@/lib/node-styles";
import {
  Sparkles,
  ImageIcon,
  GitBranch,
  Database,
  Github,
  FileOutput,
  Type,
  Merge,
} from "lucide-react";

interface NodePaletteProps {
  onDragStart: (event: React.DragEvent, nodeType: WorkflowNodeType) => void;
}

const NODE_DEFINITIONS: {
  type: WorkflowNodeType;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    type: "textInput",
    label: "Text Input",
    description: "Static text content",
    icon: <Type className="w-4 h-4" />,
  },
  {
    type: "github",
    label: "GitHub",
    description: "Fetch repository context",
    icon: <Github className="w-4 h-4" />,
  },
  {
    type: "memory",
    label: "Memory",
    description: "Persist/retrieve data",
    icon: <Database className="w-4 h-4" />,
  },
  {
    type: "aiText",
    label: "AI Text",
    description: "Generate text with AI",
    icon: <Sparkles className="w-4 h-4" />,
  },
  {
    type: "aiImage",
    label: "AI Image",
    description: "Generate images",
    icon: <ImageIcon className="w-4 h-4" />,
  },
  {
    type: "condition",
    label: "Condition",
    description: "Branch logic flow",
    icon: <GitBranch className="w-4 h-4" />,
  },
  {
    type: "merge",
    label: "Merge",
    description: "Combine multiple inputs",
    icon: <Merge className="w-4 h-4" />,
  },
  {
    type: "output",
    label: "Output",
    description: "Export to document",
    icon: <FileOutput className="w-4 h-4" />,
  },
];

export function NodePalette({ onDragStart }: NodePaletteProps) {
  return (
    <div className="w-64 bg-workflow-bg border-r border-workflow-border flex flex-col h-full transition-colors duration-200">
      <div className="p-4 border-b border-workflow-border">
        <h2 className="text-sm font-semibold text-workflow-text font-mono">Nodes</h2>
        <p className="text-xs text-workflow-text-muted mt-1">Drag to canvas</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {NODE_DEFINITIONS.map((node) => {
          const colors = NODE_COLORS[node.type];
          return (
            <div
              key={node.type}
              draggable
              onDragStart={(e) => onDragStart(e, node.type)}
              className={cn(
                "p-3 rounded-lg border-2 cursor-grab active:cursor-grabbing transition-all duration-200",
                "hover:scale-[1.02] hover:shadow-lg",
                colors.bg,
                colors.border,
                "group"
              )}
            >
              <div className="flex items-center gap-2">
                <div className={cn(colors.accent)}>{node.icon}</div>
                <div>
                  <div className={cn("text-sm font-medium font-mono", colors.accent)}>
                    {node.label}
                  </div>
                  <div className="text-xs text-workflow-text-muted">{node.description}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-workflow-border text-xs text-workflow-text-subtle font-mono">
        <div className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 bg-workflow-node-input rounded transition-colors duration-200">Del</kbd>
          <span>Delete selected</span>
        </div>
      </div>
    </div>
  );
}
