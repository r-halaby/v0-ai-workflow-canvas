"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "../base-node";
import type { AIImageNodeData } from "@/lib/workflow-types";

function AIImageNodeComponent({ data, selected, ...props }: NodeProps<AIImageNodeData>) {
  return (
    <BaseNode nodeType="aiImage" data={data} selected={selected} {...props}>
      <div className="space-y-2">
        <div className="flex gap-2">
          <select
            value={data.provider}
            className="flex-1 bg-workflow-node-input border border-workflow-border rounded px-2 py-1 text-xs text-workflow-text font-mono transition-colors duration-200"
          >
            <option value="google">Google Imagen</option>
          </select>
          <select
            value={data.size || "1024x1024"}
            className="flex-1 bg-workflow-node-input border border-workflow-border rounded px-2 py-1 text-xs text-workflow-text font-mono transition-colors duration-200"
          >
            <option value="1024x1024">1024x1024</option>
            <option value="512x512">512x512</option>
            <option value="1792x1024">1792x1024</option>
          </select>
        </div>

        <textarea
          value={data.prompt}
          placeholder="Describe the image to generate..."
          className="w-full bg-workflow-node-input border border-workflow-border rounded px-2 py-1.5 text-xs text-workflow-text font-mono resize-none h-20 transition-colors duration-200"
          readOnly
        />

        <div className="bg-workflow-node-input/50 border border-dashed border-workflow-border rounded p-4 flex items-center justify-center transition-colors duration-200">
          <span className="text-xs text-workflow-text-muted font-mono">Image preview will appear here</span>
        </div>
      </div>
    </BaseNode>
  );
}

export const AIImageNode = memo(AIImageNodeComponent);
