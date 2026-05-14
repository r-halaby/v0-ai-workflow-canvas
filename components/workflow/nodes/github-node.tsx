"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "../base-node";
import type { GitHubNodeData } from "@/lib/workflow-types";

function GitHubNodeComponent({ data, selected, ...props }: NodeProps<GitHubNodeData>) {
  // Parse owner/repo from URL for display
  const parseGitHubUrl = (url: string) => {
    if (!url) return { owner: "", repo: "" };
    const match = url.match(/github\.com\/([^\/]+)(?:\/([^\/]+))?/);
    if (match) {
      return { owner: match[1], repo: match[2] || "" };
    }
    // Fallback for direct owner/repo format
    const parts = url.replace(/^https?:\/\//, "").split("/");
    return { owner: parts[0] || "", repo: parts[1] || "" };
  };

  const { owner, repo } = parseGitHubUrl(data.githubUrl || "");
  const displayText = repo ? `${owner}/${repo}` : owner || "Enter GitHub URL";

  return (
    <BaseNode nodeType="github" data={data} selected={selected} hasInput={false} {...props}>
      <div className="space-y-2">
        <div className="bg-workflow-node-input border border-workflow-border rounded px-2 py-1.5 text-xs text-workflow-text font-mono truncate transition-colors duration-200">
          {displayText}
        </div>

        {data.branch && data.branch !== "main" && (
          <div className="text-xs text-workflow-text-muted font-mono">
            Branch: {data.branch}
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {data.fetchReadme && (
            <span className="px-1.5 py-0.5 bg-workflow-node-input rounded text-[10px] text-workflow-text-muted font-mono transition-colors duration-200">README</span>
          )}
          {data.fetchStructure && (
            <span className="px-1.5 py-0.5 bg-workflow-node-input rounded text-[10px] text-workflow-text-muted font-mono transition-colors duration-200">Structure</span>
          )}
          {data.fetchKeyFiles && (
            <span className="px-1.5 py-0.5 bg-workflow-node-input rounded text-[10px] text-workflow-text-muted font-mono transition-colors duration-200">Files</span>
          )}
        </div>
      </div>
    </BaseNode>
  );
}

export const GitHubNode = memo(GitHubNodeComponent);
