"use client";

import React, { useRef, useEffect } from "react";
import { FileText, Bot, BookOpen, Sparkles } from "lucide-react";
import type { WorkflowNode } from "@/lib/workflow-types";
import type { Edge } from "@xyflow/react";

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  nodes: WorkflowNode[];
  edges: Edge[];
}

const templates: Template[] = [
  {
    id: "readme-generator",
    name: "README Generator",
    description: "Generate README.md from GitHub repo",
    icon: <FileText className="w-4 h-4" />,
    nodes: [
      {
        id: "github-1",
        type: "github",
        position: { x: 50, y: 200 },
        data: {
          label: "GitHub Repo",
          githubUrl: "",
          branch: "main",
          fetchReadme: true,
          fetchStructure: true,
          fetchKeyFiles: true,
        },
      },
      {
        id: "ai-1",
        type: "aiText",
        position: { x: 450, y: 150 },
        data: {
          label: "Generate README",
          provider: "openai",
          model: "gpt-4o",
          prompt:
            "Based on the following repository context, generate a comprehensive README.md file with sections for: Overview, Features, Installation, Usage, API Reference (if applicable), and Contributing guidelines.\n\n{{input}}",
          systemPrompt: "You are a technical documentation expert.",
          temperature: 0.7,
        },
      },
      {
        id: "output-1",
        type: "output",
        position: { x: 900, y: 200 },
        data: {
          label: "README Output",
          outputType: "readme-md",
          customFilename: "README.md",
          customTemplate: "",
        },
      },
    ],
    edges: [
      { id: "e1", source: "github-1", target: "ai-1", type: "default", animated: true },
      { id: "e2", source: "ai-1", target: "output-1", type: "default", animated: true },
    ],
  },
  {
    id: "agents-md",
    name: "Agents.md Generator",
    description: "Create docs for AI coding assistants",
    icon: <Bot className="w-4 h-4" />,
    nodes: [
      {
        id: "github-1",
        type: "github",
        position: { x: 50, y: 80 },
        data: {
          label: "GitHub Repo",
          githubUrl: "",
          branch: "main",
          fetchReadme: true,
          fetchStructure: true,
          fetchKeyFiles: true,
        },
      },
      {
        id: "memory-1",
        type: "memory",
        position: { x: 50, y: 380 },
        data: {
          label: "Project Context",
          memoryKey: "project-rules",
          operation: "read",
          dataType: "text",
          defaultValue: "",
        },
      },
      {
        id: "merge-1",
        type: "merge",
        position: { x: 480, y: 220 },
        data: {
          label: "Combine Context",
          separator: "\n\n---\n\n",
        },
      },
      {
        id: "ai-1",
        type: "aiText",
        position: { x: 880, y: 150 },
        data: {
          label: "Generate Agents.md",
          provider: "openai",
          model: "gpt-4o",
          prompt:
            "Create an agents.md file for AI coding assistants based on this project context. Include: project overview, tech stack, coding conventions, file structure explanation, and specific guidelines for the AI agent.\n\n{{input}}",
          systemPrompt:
            "You are an expert at creating documentation for AI coding assistants like Cursor, Claude, Windsurf, and Warp.",
          temperature: 0.7,
        },
      },
      {
        id: "output-1",
        type: "output",
        position: { x: 1350, y: 220 },
        data: {
          label: "Agents.md",
          outputType: "agents-md",
          agentType: "cursor",
          customFilename: "agents.md",
          customTemplate: "",
        },
      },
    ],
    edges: [
      { id: "e1", source: "github-1", target: "merge-1", type: "default", animated: true },
      { id: "e2", source: "memory-1", target: "merge-1", type: "default", animated: true },
      { id: "e3", source: "merge-1", target: "ai-1", type: "default", animated: true },
      { id: "e4", source: "ai-1", target: "output-1", type: "default", animated: true },
    ],
  },
  {
    id: "wiki-generator",
    name: "Wiki Page",
    description: "Generate GitHub Wiki documentation",
    icon: <BookOpen className="w-4 h-4" />,
    nodes: [
      {
        id: "text-1",
        type: "textInput",
        position: { x: 50, y: 200 },
        data: {
          label: "Topic Input",
          text: "Enter the topic or feature to document...",
        },
      },
      {
        id: "ai-1",
        type: "aiText",
        position: { x: 450, y: 150 },
        data: {
          label: "Generate Wiki",
          provider: "openai",
          model: "gpt-4o",
          prompt:
            "Write a comprehensive GitHub Wiki page about the following topic. Use proper markdown formatting with headers, code blocks, and examples where appropriate.\n\nTopic: {{input}}",
          systemPrompt: "You are a technical documentation writer.",
          temperature: 0.7,
        },
      },
      {
        id: "output-1",
        type: "output",
        position: { x: 900, y: 200 },
        data: {
          label: "Wiki Output",
          outputType: "github-wiki",
          customFilename: "Wiki-Page.md",
          customTemplate: "",
        },
      },
    ],
    edges: [
      { id: "e1", source: "text-1", target: "ai-1", type: "default", animated: true },
      { id: "e2", source: "ai-1", target: "output-1", type: "default", animated: true },
    ],
  },
  {
    id: "custom",
    name: "Blank Canvas",
    description: "Start from scratch",
    icon: <Sparkles className="w-4 h-4" />,
    nodes: [],
    edges: [],
  },
];

interface TemplatesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (nodes: WorkflowNode[], edges: Edge[], name: string) => void;
  anchorRef?: React.RefObject<HTMLElement>;
}

export function TemplatesDialog({
  isOpen,
  onClose,
  onSelectTemplate,
}: TemplatesDialogProps) {
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
      className="absolute top-full left-0 mt-2 z-50 bg-workflow-surface border border-workflow-border rounded-lg shadow-xl min-w-[260px] transition-colors duration-200"
    >
      <div className="px-3 py-2 border-b border-workflow-border">
        <span className="text-[10px] font-mono uppercase tracking-wider text-workflow-text-muted">
          Templates
        </span>
      </div>
      
      <div className="py-1">
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => {
              onSelectTemplate(template.nodes, template.edges, template.name);
              onClose();
            }}
            className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-workflow-surface-hover transition-colors duration-200 text-left"
          >
            <div className="text-workflow-text-muted mt-0.5">
              {template.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-workflow-text">
                {template.name}
              </div>
              <div className="text-xs text-workflow-text-muted mt-0.5">
                {template.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
