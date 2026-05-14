import type { WorkflowNodeType } from "./workflow-types";

export const NODE_COLORS: Record<WorkflowNodeType, { bg: string; border: string; accent: string }> = {
  aiText: {
    bg: "bg-workflow-node-bg",
    border: "border-emerald-500/50 dark:border-emerald-500/50",
    accent: "text-emerald-600 dark:text-emerald-400",
  },
  aiImage: {
    bg: "bg-workflow-node-bg",
    border: "border-violet-500/50 dark:border-violet-500/50",
    accent: "text-violet-600 dark:text-violet-400",
  },
  condition: {
    bg: "bg-workflow-node-bg",
    border: "border-amber-500/50 dark:border-amber-500/50",
    accent: "text-amber-600 dark:text-amber-400",
  },
  memory: {
    bg: "bg-workflow-node-bg",
    border: "border-cyan-500/50 dark:border-cyan-500/50",
    accent: "text-cyan-600 dark:text-cyan-400",
  },
  github: {
    bg: "bg-workflow-node-bg",
    border: "border-gray-400/50 dark:border-zinc-400/50",
    accent: "text-gray-700 dark:text-zinc-300",
  },
  output: {
    bg: "bg-workflow-node-bg",
    border: "border-rose-500/50 dark:border-rose-500/50",
    accent: "text-rose-600 dark:text-rose-400",
  },
  textInput: {
    bg: "bg-workflow-node-bg",
    border: "border-blue-500/50 dark:border-blue-500/50",
    accent: "text-blue-600 dark:text-blue-400",
  },
  merge: {
    bg: "bg-workflow-node-bg",
    border: "border-orange-500/50 dark:border-orange-500/50",
    accent: "text-orange-600 dark:text-orange-400",
  },
};

export const NODE_ICONS: Record<WorkflowNodeType, string> = {
  aiText: "sparkles",
  aiImage: "image",
  condition: "git-branch",
  memory: "database",
  github: "github",
  output: "file-output",
  textInput: "type",
  merge: "merge",
};
