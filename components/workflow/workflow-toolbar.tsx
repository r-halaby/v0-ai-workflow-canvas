"use client";

import React from "react"

import { useState, useEffect } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  Trash2,
  Sun,
  Moon,
  Clock,
  Code2,
  Play,
  Loader2,
  Save,
  FolderOpen,
  Monitor,
  Plus,
} from "lucide-react";
import { TemplatesDialog } from "./templates-dialog";
import { AddNodeDialog } from "./add-node-dialog";
import type { WorkflowNode, WorkflowNodeType } from "@/lib/workflow-types";
import type { Edge } from "@xyflow/react";

interface WorkflowToolbarProps {
  workflowName: string;
  onWorkflowNameChange: (name: string) => void;
  onExecute: () => void;
  onSave: () => void;
  onLoad: () => void;
  onNew: () => void;
  onClear: () => void;
  onOpenHistory: () => void;
  onToggleOutput: () => void;
  onSelectTemplate: (nodes: WorkflowNode[], edges: Edge[], name: string) => void;
  onAddNode: (nodeType: WorkflowNodeType) => void;
  isExecuting: boolean;
  isSaving: boolean;
  hasChanges: boolean;
  showOutput: boolean;
}

function ButtonGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center bg-workflow-surface border border-workflow-border rounded-lg overflow-hidden">
      {children}
    </div>
  );
}

function IconButton({
  icon,
  onClick,
  title,
  active,
  disabled,
  variant = "default",
}: {
  icon: React.ReactNode;
  onClick: () => void;
  title: string;
  active?: boolean;
  disabled?: boolean;
  variant?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "p-2.5 transition-colors duration-200 border-r border-workflow-border last:border-r-0",
        disabled && "opacity-40 cursor-not-allowed",
        active && "bg-workflow-surface-hover text-workflow-text",
        !active && !disabled && variant === "default" && "text-workflow-text-muted hover:text-workflow-text hover:bg-workflow-surface-hover",
        !active && !disabled && variant === "danger" && "text-workflow-text-muted hover:text-rose-400 hover:bg-workflow-surface-hover"
      )}
    >
      {icon}
    </button>
  );
}

export function WorkflowToolbar({
  workflowName,
  onWorkflowNameChange,
  onExecute,
  onSave,
  onLoad,
  onClear,
  onOpenHistory,
  onToggleOutput,
  onSelectTemplate,
  onAddNode,
  isExecuting,
  isSaving,
  hasChanges,
  showOutput,
}: WorkflowToolbarProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAddNode, setShowAddNode] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const onOpenTemplates = () => setShowTemplates(true);

  return (
    <div className="h-14 bg-workflow-bg border-b border-workflow-border flex items-center justify-between px-4 transition-colors duration-200">
      {/* Left: Logo and workflow name */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <Image
            src="/flowforge-logo.png"
            alt="FlowForge"
            width={28}
            height={28}
            className="rounded-md"
          />
          <span className="font-mono font-semibold text-workflow-text tracking-tight text-sm">
            FlowForge
          </span>
        </div>

        <div className="h-5 w-px bg-workflow-border" />

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={workflowName}
            onChange={(e) => onWorkflowNameChange(e.target.value)}
            className="bg-transparent border-none text-workflow-text font-mono text-sm focus:outline-none focus:ring-1 focus:ring-workflow-border rounded px-2 py-1 w-44 transition-colors duration-200"
            placeholder="Workflow name"
          />
          {hasChanges && (
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" title="Unsaved changes" />
          )}
        </div>
      </div>

      {/* Center: Action button groups */}
      <div className="flex items-center gap-2">
        {/* Add Node */}
        <div className="relative">
          <ButtonGroup>
            <IconButton
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setShowAddNode(!showAddNode)}
              title="Add node"
              active={showAddNode}
            />
          </ButtonGroup>
          <AddNodeDialog
            isOpen={showAddNode}
            onClose={() => setShowAddNode(false)}
            onAddNode={(nodeType) => {
              onAddNode(nodeType);
              setShowAddNode(false);
            }}
          />
        </div>

        {/* Templates & Clear */}
        <div className="relative">
          <ButtonGroup>
            <IconButton
              icon={<LayoutGrid className="w-4 h-4" />}
              onClick={() => setShowTemplates(!showTemplates)}
              title="Templates"
              active={showTemplates}
            />
            <IconButton
              icon={<Trash2 className="w-4 h-4" />}
              onClick={onClear}
              title="Clear canvas"
              variant="danger"
            />
          </ButtonGroup>
          <TemplatesDialog
            isOpen={showTemplates}
            onClose={() => setShowTemplates(false)}
            onSelectTemplate={(nodes, edges, name) => {
              onSelectTemplate(nodes, edges, name);
              setShowTemplates(false);
            }}
          />
        </div>

        {/* Save & Load */}
        <ButtonGroup>
          <IconButton
            icon={isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            onClick={onSave}
            title="Save workflow"
            disabled={isSaving}
          />
          <IconButton
            icon={<FolderOpen className="w-4 h-4" />}
            onClick={onLoad}
            title="Load workflow"
          />
        </ButtonGroup>

        {/* Theme & History */}
        <ButtonGroup>
          <IconButton
            icon={
              !mounted ? (
                <Monitor className="w-4 h-4" />
              ) : resolvedTheme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )
            }
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            title="Toggle theme"
          />
          <IconButton
            icon={<Clock className="w-4 h-4" />}
            onClick={onOpenHistory}
            title="Run history"
          />
        </ButtonGroup>

        {/* Output toggle */}
        <ButtonGroup>
          <IconButton
            icon={<Code2 className="w-4 h-4" />}
            onClick={onToggleOutput}
            title="Toggle output panel"
            active={showOutput}
          />
        </ButtonGroup>

        {/* Run button */}
        <button
          type="button"
          onClick={onExecute}
          disabled={isExecuting}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm transition-all duration-200",
            isExecuting
              ? "bg-workflow-surface text-workflow-text-muted cursor-not-allowed"
              : "bg-foreground text-background hover:bg-foreground/90"
          )}
        >
          {isExecuting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {isExecuting ? "Running" : "Run"}
        </button>
      </div>

      {/* Right spacer for balance */}
      <div className="w-40" />
    </div>
  );
}
