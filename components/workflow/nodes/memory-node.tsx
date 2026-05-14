"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "../base-node";
import type { MemoryNodeData } from "@/lib/workflow-types";

function MemoryNodeComponent({ data, selected, ...props }: NodeProps<MemoryNodeData>) {
  return (
    <BaseNode nodeType="memory" data={data} selected={selected} {...props}>
      <div className="space-y-2">
        <input
          value={data.memoryKey}
          placeholder="Memory key (e.g., user_context)"
          className="w-full bg-workflow-node-input border border-workflow-border rounded px-2 py-1.5 text-xs text-workflow-text font-mono transition-colors duration-200"
          readOnly
        />

        <div className="flex gap-2">
          <div className="flex-1 bg-workflow-node-input border border-workflow-border rounded px-2 py-1 text-xs text-workflow-text font-mono capitalize transition-colors duration-200">
            {data.operation}
          </div>
          <div className="flex-1 bg-workflow-node-input border border-workflow-border rounded px-2 py-1 text-xs text-workflow-text font-mono uppercase transition-colors duration-200">
            {data.dataType}
          </div>
        </div>

        {data.operation === "read" && (
          <input
            value={data.defaultValue || ""}
            placeholder="Default value if not found"
            className="w-full bg-workflow-node-input border border-workflow-border rounded px-2 py-1.5 text-xs text-workflow-text font-mono transition-colors duration-200"
            readOnly
          />
        )}

        <div className="text-xs text-cyan-600 dark:text-cyan-400/70 font-mono">
          {data.operation === "read" ? "Outputs stored value" : "Stores input to memory"}
        </div>
      </div>
    </BaseNode>
  );
}

export const MemoryNode = memo(MemoryNodeComponent);
