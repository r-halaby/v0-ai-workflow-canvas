"use client";

import React, { useRef, useEffect } from "react";
import type { WorkflowNodeType } from "@/lib/workflow-types";
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

interface AddNodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddNode: (nodeType: WorkflowNodeType) => void;
}

export function AddNodeDialog({ isOpen, onClose, onAddNode }: AddNodeDialogProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute top-full left-2 mt-2 z-50 bg-workflow-surface border border-workflow-border rounded-lg shadow-xl w-[260px] transition-colors duration-200"
    >
      <div className="px-4 py-2 border-b border-workflow-border">
        <span className="text-[10px] font-mono uppercase tracking-wider text-workflow-text-muted">
          Add Node
        </span>
      </div>

      <div className="py-1">
        {NODE_DEFINITIONS.map((node) => (
          <button
            key={node.type}
            type="button"
            onClick={() => {
              onAddNode(node.type);
              onClose();
            }}
            className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-workflow-surface-hover transition-colors duration-200 text-left"
          >
            <div className="text-workflow-text-muted mt-0.5">{node.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-workflow-text">
                {node.label}
              </div>
              <div className="text-xs text-workflow-text-muted mt-0.5">{node.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
