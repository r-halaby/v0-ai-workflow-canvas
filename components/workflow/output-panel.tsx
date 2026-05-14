"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Download, Copy, Check, FileText, Code, X, Loader2 } from "lucide-react";
import type { WorkflowExecution } from "@/lib/workflow-types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface OutputPanelProps {
  execution: WorkflowExecution | null;
  isExecuting: boolean;
  onClose: () => void;
}

// Strip markdown formatting to plain text
function stripMarkdown(md: string): string {
  return md
    .replace(/^#{1,6}\s+/gm, "") // headers
    .replace(/\*\*(.+?)\*\*/g, "$1") // bold
    .replace(/\*(.+?)\*/g, "$1") // italic
    .replace(/__(.+?)__/g, "$1") // bold alt
    .replace(/_(.+?)_/g, "$1") // italic alt
    .replace(/~~(.+?)~~/g, "$1") // strikethrough
    .replace(/`{3}[\s\S]*?`{3}/g, (match) => match.replace(/`{3}\w*\n?/g, "")) // code blocks
    .replace(/`(.+?)`/g, "$1") // inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1") // images
    .replace(/^[\s]*[-*+]\s+/gm, "- ") // unordered lists
    .replace(/^[\s]*\d+\.\s+/gm, "") // ordered lists
    .replace(/^>\s+/gm, "") // blockquotes
    .replace(/^---+$/gm, "") // horizontal rules
    .replace(/\n{3,}/g, "\n\n") // excess newlines
    .trim();
}

export function OutputPanel({ execution, isExecuting, onClose }: OutputPanelProps) {
  const [view, setView] = useState<"text" | "markdown">("markdown");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (execution?.finalOutput) {
      await navigator.clipboard.writeText(execution.finalOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (execution?.finalOutput) {
      const blob = new Blob([execution.finalOutput], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "output.md";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="w-96 bg-workflow-bg border-l border-workflow-border flex flex-col h-full transition-colors duration-200">
      <div className="p-4 border-b border-workflow-border flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-workflow-text font-mono">Output</h2>
          <p className="text-xs text-workflow-text-muted mt-0.5">
            {isExecuting ? "Executing workflow..." : execution ? "Execution complete" : "Run workflow to see output"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 hover:bg-workflow-surface-hover rounded-lg transition-colors duration-200 text-workflow-text-muted"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {isExecuting && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
            <p className="text-sm text-workflow-text-muted mt-3 font-mono">Processing nodes...</p>
          </div>
        </div>
      )}

      {!isExecuting && execution && (
        <>
          <div className="p-3 border-b border-workflow-border flex items-center gap-2">
            <button
              type="button"
              onClick={() => setView("markdown")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors duration-200",
                view === "markdown"
                  ? "bg-workflow-surface text-workflow-text"
                  : "text-workflow-text-muted hover:text-workflow-text"
              )}
            >
              <FileText className="w-3.5 h-3.5" />
              Markdown
            </button>
            <button
              type="button"
              onClick={() => setView("text")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors duration-200",
                view === "text"
                  ? "bg-workflow-surface text-workflow-text"
                  : "text-workflow-text-muted hover:text-workflow-text"
              )}
            >
              <Code className="w-3.5 h-3.5" />
              Raw Text
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {view === "markdown" ? (
              <div className="prose dark:prose-invert prose-sm max-w-none prose-headings:text-workflow-text prose-p:text-workflow-text prose-strong:text-workflow-text prose-code:text-emerald-600 dark:prose-code:text-emerald-400 prose-code:bg-workflow-node-input prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-workflow-surface prose-pre:border prose-pre:border-workflow-border prose-a:text-emerald-600 dark:prose-a:text-emerald-400 prose-li:text-workflow-text prose-blockquote:border-workflow-border prose-blockquote:text-workflow-text-muted prose-hr:border-workflow-border">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {execution.finalOutput || "No output"}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="text-sm text-workflow-text whitespace-pre-wrap leading-relaxed transition-colors duration-200">
                {stripMarkdown(execution.finalOutput || "No output")}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-workflow-border flex gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-workflow-surface hover:bg-workflow-surface-hover rounded-lg text-xs font-mono text-workflow-text transition-colors duration-200"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-mono text-white transition-colors duration-200"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
          </div>

          {execution.results.length > 0 && (
            <div className="p-3 border-t border-workflow-border max-h-48 overflow-auto">
              <div className="text-xs text-workflow-text-muted font-mono mb-2">Execution Log</div>
              <div className="space-y-1">
                {execution.results.map((result, i) => (
                  <div
                    key={`${result.nodeId}-${i}`}
                    className={cn(
                      "text-xs font-mono px-2 py-1 rounded transition-colors duration-200",
                      result.error ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" : "bg-workflow-surface text-workflow-text-muted"
                    )}
                  >
                    <span className="text-workflow-text-subtle">[{result.nodeType}]</span>{" "}
                    {result.error || "OK"}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!isExecuting && !execution && (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-workflow-text-subtle">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-mono">No output yet</p>
            <p className="text-xs mt-1">Execute your workflow to generate output</p>
          </div>
        </div>
      )}
    </div>
  );
}
