"use client";

import { useState, useEffect } from "react";
import { X, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RunHistoryItem {
  id: string;
  workflow_id: string;
  status: string;
  final_output: string | null;
  started_at: string;
  completed_at: string | null;
}

interface RunHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: string | null;
  onSelectRun: (output: string) => void;
}

export function RunHistoryDialog({
  isOpen,
  onClose,
  workflowId,
  onSelectRun,
}: RunHistoryDialogProps) {
  const [history, setHistory] = useState<RunHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && workflowId) {
      setLoading(true);
      fetch(`/api/workflows/${workflowId}/history`)
        .then((res) => res.json())
        .then((data) => {
          setHistory(data.history || []);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, workflowId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-workflow-surface border border-workflow-border rounded-xl shadow-2xl w-full max-w-lg max-h-[70vh] flex flex-col transition-colors duration-200">
        <div className="flex items-center justify-between p-4 border-b border-workflow-border">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-workflow-text-muted" />
            <h2 className="font-mono font-semibold text-workflow-text">Run History</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-workflow-surface-hover rounded-lg transition-colors duration-200 text-workflow-text-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-workflow-text-muted" />
            </div>
          ) : !workflowId ? (
            <div className="text-center py-12 text-workflow-text-muted font-mono text-sm">
              Save your workflow first to view run history
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-workflow-text-muted font-mono text-sm">
              No runs yet
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((run) => (
                <button
                  key={run.id}
                  type="button"
                  onClick={() => {
                    if (run.final_output) {
                      onSelectRun(run.final_output);
                      onClose();
                    }
                  }}
                  className={cn(
                    "w-full p-3 rounded-lg border text-left transition-colors duration-200",
                    "bg-workflow-node-input/50 border-workflow-border/50 hover:bg-workflow-node-input hover:border-workflow-border"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {run.status === "completed" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : run.status === "failed" ? (
                        <XCircle className="w-4 h-4 text-rose-500" />
                      ) : (
                        <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                      )}
                      <span className="font-mono text-sm text-workflow-text capitalize">
                        {run.status}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-workflow-text-muted">
                      {new Date(run.started_at).toLocaleString()}
                    </span>
                  </div>
                  {run.final_output && (
                    <p className="font-mono text-xs text-workflow-text-muted truncate mt-1">
                      {run.final_output.slice(0, 100)}...
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
