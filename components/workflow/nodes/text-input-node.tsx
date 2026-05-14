"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "../base-node";
import type { TextInputNodeData } from "@/lib/workflow-types";

function TextInputNodeComponent({ data, selected, ...props }: NodeProps<TextInputNodeData>) {
  return (
    <BaseNode nodeType="textInput" data={data} selected={selected} hasInput={false} {...props}>
      <div className="space-y-2">
        <textarea
          value={data.text}
          placeholder="Enter text content here..."
          className="w-full bg-workflow-node-input border border-workflow-border rounded px-2 py-1.5 text-xs text-workflow-text font-mono resize-none h-24 transition-colors duration-200"
          readOnly
        />
        <div className="text-xs text-workflow-text-muted font-mono">
          {data.text.length} characters
        </div>
      </div>
    </BaseNode>
  );
}

export const TextInputNode = memo(TextInputNodeComponent);
