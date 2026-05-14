"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "../base-node";
import type { AITextNodeData } from "@/lib/workflow-types";

function AITextNodeComponent({ data, selected, ...props }: NodeProps<AITextNodeData>) {
  return (
    <BaseNode nodeType="aiText" data={data} selected={selected} {...props}>
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 bg-workflow-node-input border border-workflow-border rounded px-2 py-1 text-xs text-workflow-text font-mono truncate transition-colors duration-200">
            {data.provider}
          </div>
          <div className="flex-1 bg-workflow-node-input border border-workflow-border rounded px-2 py-1 text-xs text-workflow-text font-mono truncate transition-colors duration-200">
            {data.model}
          </div>
        </div>

        <textarea
          value={data.systemPrompt || ""}
          placeholder="System prompt (optional)"
          className="w-full bg-workflow-node-input border border-workflow-border rounded px-2 py-1.5 text-xs text-workflow-text font-mono resize-none h-14 transition-colors duration-200"
          readOnly
        />

        <textarea
          value={data.prompt}
          placeholder="Enter prompt... Use {{input}} for connected data"
          className="w-full bg-workflow-node-input border border-workflow-border rounded px-2 py-1.5 text-xs text-workflow-text font-mono resize-none h-20 transition-colors duration-200"
          readOnly
        />

        <div className="flex items-center gap-2">
          <span className="text-xs text-workflow-text-muted font-mono">Temp:</span>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={data.temperature ?? 0.7}
            className="flex-1 h-1 bg-workflow-border rounded-lg appearance-none cursor-pointer"
            readOnly
          />
          <span className="text-xs text-workflow-text-muted font-mono w-8">{data.temperature ?? 0.7}</span>
        </div>
      </div>
    </BaseNode>
  );
}

export const AITextNode = memo(AITextNodeComponent);
