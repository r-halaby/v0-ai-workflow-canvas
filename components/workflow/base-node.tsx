"use client";

import React from "react";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { WorkflowNodeType, BaseNodeData } from "@/lib/workflow-types";
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
  X,
} from "lucide-react";
import { useReactFlow } from "@xyflow/react";

const ICONS: Record<WorkflowNodeType, React.ReactNode> = {
  aiText: <Sparkles className="w-4 h-4" />,
  aiImage: <ImageIcon className="w-4 h-4" />,
  condition: <GitBranch className="w-4 h-4" />,
  memory: <Database className="w-4 h-4" />,
  github: <Github className="w-4 h-4" />,
  output: <FileOutput className="w-4 h-4" />,
  textInput: <Type className="w-4 h-4" />,
  merge: <Merge className="w-4 h-4" />,
};

interface BaseNodeProps extends NodeProps {
  nodeType: WorkflowNodeType;
  children: React.ReactNode;
  hasInput?: boolean;
  hasOutput?: boolean;
  hasTrueOutput?: boolean;
  hasFalseOutput?: boolean;
  id: string;
}

export function BaseNode({
  nodeType,
  children,
  hasInput = true,
  hasOutput = true,
  hasTrueOutput = false,
  hasFalseOutput = false,
  selected,
  data,
  id,
}: BaseNodeProps) {
  const colors = NODE_COLORS[nodeType];
  const icon = ICONS[nodeType];
  const { deleteElements } = useReactFlow();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteElements({ nodes: [{ id }] });
  };

  return (
    <div
      className={cn(
        "min-w-[280px] rounded-lg border-2 shadow-lg transition-colors duration-200",
        colors.bg,
        colors.border,
        selected && "ring-2 ring-primary/30"
      )}
    >
      {hasInput && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-workflow-handle !border-2 !border-workflow-handle-border"
        />
      )}

      <div className={cn("flex items-center gap-2 px-3 py-2 border-b border-workflow-border-subtle", colors.accent)}>
        {icon}
        <span className="font-mono text-sm font-medium flex-1 text-workflow-text">{(data as BaseNodeData).label}</span>
        <button
          type="button"
          onClick={handleDelete}
          className="p-1 rounded hover:bg-workflow-surface-hover text-workflow-text-muted hover:text-workflow-text transition-colors duration-200"
          aria-label="Delete node"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-3 space-y-3">{children}</div>

      {hasOutput && !hasTrueOutput && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-workflow-handle !border-2 !border-workflow-handle-border"
        />
      )}

      {hasTrueOutput && (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            style={{ top: "40%" }}
            className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-emerald-300"
          />
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            style={{ top: "70%" }}
            className="!w-3 !h-3 !bg-rose-500 !border-2 !border-rose-300"
          />
          <div className="absolute right-[-40px] top-[35%] text-xs text-emerald-600 dark:text-emerald-400 font-mono">true</div>
          <div className="absolute right-[-40px] top-[65%] text-xs text-rose-600 dark:text-rose-400 font-mono">false</div>
        </>
      )}
    </div>
  );
}
