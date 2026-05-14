"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { BaseNode } from "../base-node";
import type { MergeNodeData } from "@/lib/workflow-types";

function MergeNodeComponent({ data, selected, ...props }: NodeProps<MergeNodeData>) {
  return (
    <BaseNode nodeType="merge" data={data} selected={selected} hasInput={false} {...props}>
      <Handle
        type="target"
        position={Position.Left}
        id="input-1"
        style={{ top: "35%" }}
        className="!w-3 !h-3 !bg-workflow-handle !border-2 !border-workflow-handle-border"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="input-2"
        style={{ top: "65%" }}
        className="!w-3 !h-3 !bg-workflow-handle !border-2 !border-workflow-handle-border"
      />
      
      <div className="space-y-2">
        <div className="text-xs text-workflow-text-muted font-mono">Merge multiple inputs with:</div>
        <div className="w-full bg-workflow-node-input border border-workflow-border rounded px-2 py-1.5 text-xs text-workflow-text font-mono transition-colors duration-200">
          {data.separator === "\n\n" ? "Double newline" :
           data.separator === "\n" ? "Single newline" :
           data.separator === "\n---\n" ? "Horizontal rule" :
           data.separator === " " ? "Space" : "No separator"}
        </div>
        
        <div className="flex justify-between text-xs font-mono text-workflow-text-muted pt-1">
          <span>Input 1</span>
          <span>Input 2</span>
        </div>
      </div>
    </BaseNode>
  );
}

export const MergeNode = memo(MergeNodeComponent);
