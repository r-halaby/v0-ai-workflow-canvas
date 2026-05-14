"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "../base-node";
import type { ConditionNodeData } from "@/lib/workflow-types";

function ConditionNodeComponent({ data, selected, ...props }: NodeProps<ConditionNodeData>) {
  return (
    <BaseNode
      nodeType="condition"
      data={data}
      selected={selected}
      hasOutput={false}
      hasTrueOutput={true}
      {...props}
    >
      <div className="space-y-2">
        <input
          value={data.condition}
          placeholder="Variable to check (e.g., {{input}})"
          className="w-full bg-workflow-node-input border border-workflow-border rounded px-2 py-1.5 text-xs text-workflow-text font-mono transition-colors duration-200"
          readOnly
        />

        <select
          value={data.operator}
          className="w-full bg-workflow-node-input border border-workflow-border rounded px-2 py-1.5 text-xs text-workflow-text font-mono transition-colors duration-200"
        >
          <option value="contains">contains</option>
          <option value="equals">equals</option>
          <option value="notEquals">not equals</option>
          <option value="greaterThan">greater than</option>
          <option value="lessThan">less than</option>
          <option value="isEmpty">is empty</option>
          <option value="isNotEmpty">is not empty</option>
        </select>

        {data.operator !== "isEmpty" && data.operator !== "isNotEmpty" && (
          <input
            value={data.value}
            placeholder="Comparison value"
            className="w-full bg-workflow-node-input border border-workflow-border rounded px-2 py-1.5 text-xs text-workflow-text font-mono transition-colors duration-200"
            readOnly
          />
        )}

        <div className="flex justify-between text-xs font-mono pt-1">
          <span className="text-emerald-600 dark:text-emerald-400">True path</span>
          <span className="text-rose-600 dark:text-rose-400">False path</span>
        </div>
      </div>
    </BaseNode>
  );
}

export const ConditionNode = memo(ConditionNodeComponent);
