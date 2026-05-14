"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "../base-node";
import type { OutputNodeData } from "@/lib/workflow-types";
import { AGENT_TEMPLATES } from "@/lib/workflow-types";

function OutputNodeComponent({ data, selected, ...props }: NodeProps<OutputNodeData>) {
  return (
    <BaseNode nodeType="output" data={data} selected={selected} hasOutput={false} {...props}>
      <div className="space-y-2">
        <div className="w-full bg-workflow-node-input border border-workflow-border rounded px-2 py-1.5 text-xs text-workflow-text font-mono transition-colors duration-200">
          {data.outputType === "github-wiki" ? "GitHub Wiki" :
           data.outputType === "agents-md" ? "agents.md" :
           data.outputType === "readme-md" ? "README.md" :
           data.outputType === "custom" ? "Custom Document" : "Select output type"}
        </div>

        {data.outputType === "agents-md" && (
          <div className="space-y-2">
            <div className="text-xs text-workflow-text-muted font-mono">Select Agent Type:</div>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(AGENT_TEMPLATES).map(([key, template]) => (
                <button
                  key={key}
                  type="button"
                  className={`px-2 py-1.5 rounded text-xs font-mono transition-colors duration-200 ${
                    data.agentType === key
                      ? "bg-rose-500/20 border border-rose-500/50 text-rose-600 dark:text-rose-300"
                      : "bg-workflow-node-input border border-workflow-border text-workflow-text-muted hover:border-workflow-border-subtle"
                  }`}
                >
                  {template.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {data.outputType === "custom" && (
          <>
            <input
              value={data.customFilename || ""}
              placeholder="Filename (e.g., my-doc.md)"
              className="w-full bg-workflow-node-input border border-workflow-border rounded px-2 py-1.5 text-xs text-workflow-text font-mono transition-colors duration-200"
              readOnly
            />
            <textarea
              value={data.customTemplate || ""}
              placeholder="Custom template (use {{content}} for generated content)"
              className="w-full bg-workflow-node-input border border-workflow-border rounded px-2 py-1.5 text-xs text-workflow-text font-mono resize-none h-16 transition-colors duration-200"
              readOnly
            />
          </>
        )}

        <div className="border border-dashed border-workflow-border rounded p-2 transition-colors duration-200">
          <div className="text-xs text-workflow-text-muted font-mono text-center">
            Output: {data.outputType === "agents-md" && data.agentType
              ? `${data.agentType}-agent.md`
              : data.outputType === "custom"
              ? data.customFilename || "output.md"
              : data.outputType ? `${data.outputType.replace("-", ".")}` : "output.md"}
          </div>
        </div>
      </div>
    </BaseNode>
  );
}

export const OutputNode = memo(OutputNodeComponent);
