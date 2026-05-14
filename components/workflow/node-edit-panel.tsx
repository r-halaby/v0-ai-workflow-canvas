"use client";

import { X } from "lucide-react";
import type { WorkflowNode, WorkflowNodeType } from "@/lib/workflow-types";
import { AI_MODELS, AGENT_TEMPLATES } from "@/lib/workflow-types";
import { NODE_COLORS } from "@/lib/node-styles";
import { cn } from "@/lib/utils";

interface NodeEditPanelProps {
  node: WorkflowNode | null;
  onUpdate: (nodeId: string, data: Partial<WorkflowNode["data"]>) => void;
  onClose: () => void;
}

export function NodeEditPanel({ node, onUpdate, onClose }: NodeEditPanelProps) {
  if (!node) return null;

  const colors = NODE_COLORS[node.type as WorkflowNodeType];

  const handleChange = (key: string, value: unknown) => {
    onUpdate(node.id, { ...node.data, [key]: value });
  };

  return (
    <div className="w-80 bg-workflow-bg border-l border-workflow-border flex flex-col h-full transition-colors duration-200">
      <div className={cn("flex items-center justify-between p-4 border-b border-workflow-border", colors.accent)}>
        <div>
          <h2 className="text-sm font-semibold font-mono text-workflow-text">{node.data.label}</h2>
          <p className="text-xs text-workflow-text-muted mt-0.5">Edit node properties</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 hover:bg-workflow-surface-hover rounded-lg transition-colors duration-200 text-workflow-text-muted"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Label */}
        <div>
          <label className="block text-xs text-workflow-text-muted font-mono mb-1">Label</label>
          <input
            type="text"
            value={node.data.label}
            onChange={(e) => handleChange("label", e.target.value)}
            className="w-full bg-workflow-node-input border border-workflow-border rounded-lg px-3 py-2 text-sm text-workflow-text font-mono focus:outline-none focus:ring-1 focus:ring-workflow-border transition-colors duration-200"
          />
        </div>

        {/* AI Text Node */}
        {node.type === "aiText" && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-workflow-text-muted font-mono mb-1">Provider</label>
                <select
                  value={(node.data as { provider: string }).provider}
                  onChange={(e) => handleChange("provider", e.target.value)}
                  className="w-full bg-workflow-node-input border border-workflow-border rounded-lg px-3 py-2 text-sm text-workflow-text font-mono transition-colors duration-200"
                >
                  <option value="openai">OpenAI</option>
                  <option value="google">Google</option>
                  <option value="xai">xAI</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-workflow-text-muted font-mono mb-1">Model</label>
                <select
                  value={(node.data as { model: string }).model}
                  onChange={(e) => handleChange("model", e.target.value)}
                  className="w-full bg-workflow-node-input border border-workflow-border rounded-lg px-3 py-2 text-sm text-workflow-text font-mono transition-colors duration-200"
                >
                  {AI_MODELS[(node.data as { provider: "openai" | "google" | "xai" }).provider].map((model) => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-workflow-text-muted font-mono mb-1">System Prompt</label>
              <textarea
                value={(node.data as { systemPrompt?: string }).systemPrompt || ""}
                onChange={(e) => handleChange("systemPrompt", e.target.value)}
                placeholder="Optional system instructions..."
                className="w-full bg-workflow-node-input border border-workflow-border rounded-lg px-3 py-2 text-sm text-workflow-text font-mono transition-colors duration-200 resize-none h-20"
              />
            </div>
            <div>
              <label className="block text-xs text-workflow-text-muted font-mono mb-1">Prompt</label>
              <textarea
                value={(node.data as { prompt: string }).prompt}
                onChange={(e) => handleChange("prompt", e.target.value)}
                placeholder="Enter prompt... Use {{input}} for data from connected nodes"
                className="w-full bg-workflow-node-input border border-workflow-border rounded-lg px-3 py-2 text-sm text-workflow-text font-mono transition-colors duration-200 resize-none h-28"
              />
            </div>
            <div>
              <label className="block text-xs text-workflow-text-muted font-mono mb-1">
                Temperature: {(node.data as { temperature?: number }).temperature ?? 0.7}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={(node.data as { temperature?: number }).temperature ?? 0.7}
                onChange={(e) => handleChange("temperature", parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </>
        )}

        {/* AI Image Node */}
        {node.type === "aiImage" && (
          <>
            <div>
              <label className="block text-xs text-workflow-text-muted font-mono mb-1">Size</label>
              <select
                value={(node.data as { size?: string }).size || "1024x1024"}
                onChange={(e) => handleChange("size", e.target.value)}
                className="w-full bg-workflow-node-input border border-workflow-border rounded-lg px-3 py-2 text-sm text-workflow-text font-mono transition-colors duration-200"
              >
                <option value="1024x1024">1024x1024</option>
                <option value="512x512">512x512</option>
                <option value="1792x1024">1792x1024</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-workflow-text-muted font-mono mb-1">Prompt</label>
              <textarea
                value={(node.data as { prompt: string }).prompt}
                onChange={(e) => handleChange("prompt", e.target.value)}
                placeholder="Describe the image..."
                className="w-full bg-workflow-node-input border border-workflow-border rounded-lg px-3 py-2 text-sm text-workflow-text font-mono transition-colors duration-200 resize-none h-28"
              />
            </div>
          </>
        )}

        {/* GitHub Node */}
        {node.type === "github" && (
          <>
            <div>
              <label className="block text-xs text-workflow-text-muted font-mono mb-1">GitHub URL</label>
              <input
                type="text"
                value={(node.data as { githubUrl: string }).githubUrl || ""}
                onChange={(e) => handleChange("githubUrl", e.target.value)}
                placeholder="https://github.com/vercel/next.js"
                className="w-full bg-workflow-node-input border border-workflow-border rounded-lg px-3 py-2 text-sm text-workflow-text font-mono transition-colors duration-200"
              />
              <p className="text-xs text-workflow-text-subtle mt-1">Paste a repo or profile URL</p>
            </div>
            <div>
              <label className="block text-xs text-workflow-text-muted font-mono mb-1">Branch</label>
              <input
                type="text"
                value={(node.data as { branch?: string }).branch || "main"}
                onChange={(e) => handleChange("branch", e.target.value)}
                className="w-full bg-workflow-node-input border border-workflow-border rounded-lg px-3 py-2 text-sm text-workflow-text font-mono transition-colors duration-200"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(node.data as { fetchReadme: boolean }).fetchReadme}
                  onChange={(e) => handleChange("fetchReadme", e.target.checked)}
                  className="rounded border-workflow-border bg-workflow-node-input transition-colors duration-200"
                />
                <span className="text-sm text-workflow-text font-mono">Fetch README</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(node.data as { fetchStructure: boolean }).fetchStructure}
                  onChange={(e) => handleChange("fetchStructure", e.target.checked)}
                  className="rounded border-workflow-border bg-workflow-node-input transition-colors duration-200"
                />
                <span className="text-sm text-workflow-text font-mono">Fetch file structure</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(node.data as { fetchKeyFiles: boolean }).fetchKeyFiles}
                  onChange={(e) => handleChange("fetchKeyFiles", e.target.checked)}
                  className="rounded border-workflow-border bg-workflow-node-input transition-colors duration-200"
                />
                <span className="text-sm text-workflow-text font-mono">Fetch key files</span>
              </label>
            </div>
          </>
        )}

        {/* Memory Node */}
        {node.type === "memory" && (
          <>
            <div>
              <label className="block text-xs text-workflow-text-muted font-mono mb-1">Memory Key</label>
              <input
                type="text"
                value={(node.data as { memoryKey: string }).memoryKey}
                onChange={(e) => handleChange("memoryKey", e.target.value)}
                placeholder="user_context"
                className="w-full bg-workflow-node-input border border-workflow-border rounded-lg px-3 py-2 text-sm text-workflow-text font-mono transition-colors duration-200"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-workflow-text-muted font-mono mb-1">Operation</label>
                <select
                  value={(node.data as { operation: string }).operation}
                  onChange={(e) => handleChange("operation", e.target.value)}
                  className="w-full bg-workflow-node-input border border-workflow-border rounded-lg px-3 py-2 text-sm text-workflow-text font-mono transition-colors duration-200"
                >
                  <option value="read">Read</option>
                  <option value="write">Write</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-workflow-text-muted font-mono mb-1">Data Type</label>
                <select
                  value={(node.data as { dataType: string }).dataType}
                  onChange={(e) => handleChange("dataType", e.target.value)}
                  className="w-full bg-workflow-node-input border border-workflow-border rounded-lg px-3 py-2 text-sm text-workflow-text font-mono transition-colors duration-200"
                >
                  <option value="text">Text</option>
                  <option value="url">URL</option>
                  <option value="json">JSON</option>
                </select>
              </div>
            </div>
            {(node.data as { operation: string }).operation === "read" && (
              <div>
                <label className="block text-xs text-workflow-text-muted font-mono mb-1">Default Value</label>
                <input
                  type="text"
                  value={(node.data as { defaultValue?: string }).defaultValue || ""}
                  onChange={(e) => handleChange("defaultValue", e.target.value)}
                  placeholder="Value if not found"
                  className="w-full bg-workflow-node-input border border-workflow-border rounded-lg px-3 py-2 text-sm text-workflow-text font-mono transition-colors duration-200"
                />
              </div>
            )}
          </>
        )}

        {/* Condition Node */}
        {node.type === "condition" && (
          <>
            <div>
              <label className="block text-xs text-workflow-text-muted font-mono mb-1">Variable</label>
              <input
                type="text"
                value={(node.data as { condition: string }).condition}
                onChange={(e) => handleChange("condition", e.target.value)}
                placeholder="{{input}}"
                className="w-full bg-workflow-node-input border border-workflow-border rounded-lg px-3 py-2 text-sm text-workflow-text font-mono transition-colors duration-200"
              />
            </div>
            <div>
              <label className="block text-xs text-workflow-text-muted font-mono mb-1">Operator</label>
              <select
                value={(node.data as { operator: string }).operator}
                onChange={(e) => handleChange("operator", e.target.value)}
                className="w-full bg-workflow-node-input border border-workflow-border rounded-lg px-3 py-2 text-sm text-workflow-text font-mono transition-colors duration-200"
              >
                <option value="contains">contains</option>
                <option value="equals">equals</option>
                <option value="notEquals">not equals</option>
                <option value="greaterThan">greater than</option>
                <option value="lessThan">less than</option>
                <option value="isEmpty">is empty</option>
                <option value="isNotEmpty">is not empty</option>
              </select>
            </div>
            {!["isEmpty", "isNotEmpty"].includes((node.data as { operator: string }).operator) && (
              <div>
                <label className="block text-xs text-workflow-text-muted font-mono mb-1">Value</label>
                <input
                  type="text"
                  value={(node.data as { value: string }).value}
                  onChange={(e) => handleChange("value", e.target.value)}
                  placeholder="Comparison value"
                  className="w-full bg-workflow-node-input border border-workflow-border rounded-lg px-3 py-2 text-sm text-workflow-text font-mono transition-colors duration-200"
                />
              </div>
            )}
          </>
        )}

        {/* Output Node */}
        {node.type === "output" && (
          <>
            <div>
              <label className="block text-xs text-workflow-text-muted font-mono mb-1">Output Type</label>
              <select
                value={(node.data as { outputType: string }).outputType}
                onChange={(e) => handleChange("outputType", e.target.value)}
                className="w-full bg-workflow-node-input border border-workflow-border rounded-lg px-3 py-2 text-sm text-workflow-text font-mono transition-colors duration-200"
              >
                <option value="github-wiki">GitHub Wiki</option>
                <option value="agents-md">agents.md</option>
                <option value="readme-md">README.md</option>
                <option value="custom">Custom Document</option>
              </select>
            </div>
            {(node.data as { outputType: string }).outputType === "agents-md" && (
              <div>
                <label className="block text-xs text-workflow-text-muted font-mono mb-1">Agent Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(AGENT_TEMPLATES).map(([key, template]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleChange("agentType", key)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-xs font-mono transition-colors text-left",
                        (node.data as { agentType?: string }).agentType === key
                          ? "bg-rose-500/20 border border-rose-500/50 text-rose-300"
                          : "bg-workflow-node-input border border-workflow-border text-workflow-text-muted hover:border-workflow-border-subtle"
                      )}
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {(node.data as { outputType: string }).outputType === "custom" && (
              <>
                <div>
                  <label className="block text-xs text-workflow-text-muted font-mono mb-1">Filename</label>
                  <input
                    type="text"
                    value={(node.data as { customFilename?: string }).customFilename || ""}
                    onChange={(e) => handleChange("customFilename", e.target.value)}
                    placeholder="my-doc.md"
                    className="w-full bg-workflow-node-input border border-workflow-border rounded-lg px-3 py-2 text-sm text-workflow-text font-mono transition-colors duration-200"
                  />
                </div>
                <div>
                  <label className="block text-xs text-workflow-text-muted font-mono mb-1">Template</label>
                  <textarea
                    value={(node.data as { customTemplate?: string }).customTemplate || ""}
                    onChange={(e) => handleChange("customTemplate", e.target.value)}
                    placeholder="Use {{content}} for generated content"
                    className="w-full bg-workflow-node-input border border-workflow-border rounded-lg px-3 py-2 text-sm text-workflow-text font-mono transition-colors duration-200 resize-none h-24"
                  />
                </div>
              </>
            )}
          </>
        )}

        {/* Text Input Node */}
        {node.type === "textInput" && (
          <div>
            <label className="block text-xs text-workflow-text-muted font-mono mb-1">Text Content</label>
            <textarea
              value={(node.data as { text: string }).text}
              onChange={(e) => handleChange("text", e.target.value)}
              placeholder="Enter your text content..."
              className="w-full bg-workflow-node-input border border-workflow-border rounded-lg px-3 py-2 text-sm text-workflow-text font-mono transition-colors duration-200 resize-none h-40"
            />
          </div>
        )}

        {/* Merge Node */}
        {node.type === "merge" && (
          <div>
            <label className="block text-xs text-workflow-text-muted font-mono mb-1">Separator</label>
            <select
              value={(node.data as { separator: string }).separator}
              onChange={(e) => handleChange("separator", e.target.value)}
              className="w-full bg-workflow-node-input border border-workflow-border rounded-lg px-3 py-2 text-sm text-workflow-text font-mono transition-colors duration-200"
            >
              <option value="\n\n">Double newline</option>
              <option value="\n">Single newline</option>
              <option value="\n---\n">Horizontal rule</option>
              <option value=" ">Space</option>
              <option value="">No separator</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
