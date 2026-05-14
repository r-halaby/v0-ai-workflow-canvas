"use client";

import React from "react"

import { useState, useEffect } from "react";
import { X, Loader2, Trash2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface SavedWorkflow {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface LoadWorkflowDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (workflowId: string) => void;
}

export function LoadWorkflowDialog({ isOpen, onClose, onLoad }: LoadWorkflowDialogProps) {
  const [workflows, setWorkflows] = useState<SavedWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchWorkflows();
    }
  }, [isOpen]);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/workflows");
      const data = await response.json();
      setWorkflows(data.workflows || []);
    } catch (error) {
      console.error("Failed to fetch workflows:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleting(id);
    try {
      await fetch(`/api/workflows/${id}`, { method: "DELETE" });
      setWorkflows(workflows.filter((w) => w.id !== id));
    } catch (error) {
      console.error("Failed to delete workflow:", error);
    } finally {
      setDeleting(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-workflow-surface border border-workflow-border rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col transition-colors duration-200">
        <div className="flex items-center justify-between p-4 border-b border-workflow-border">
          <h2 className="text-lg font-semibold text-workflow-text font-mono">Load Workflow</h2>
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
              <Loader2 className="w-6 h-6 text-workflow-text-muted animate-spin" />
            </div>
          ) : workflows.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-workflow-text-muted font-mono text-sm">No saved workflows</p>
              <p className="text-workflow-text-subtle text-xs mt-1">Create and save a workflow to see it here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="w-full text-left p-3 bg-workflow-node-input/50 hover:bg-workflow-node-input border border-workflow-border/50 hover:border-workflow-border rounded-lg transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between">
                    <button
                      type="button"
                      onClick={() => onLoad(workflow.id)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <h3 className="font-mono text-sm text-workflow-text truncate">
                        {workflow.name}
                      </h3>
                      {workflow.description && (
                        <p className="text-xs text-workflow-text-muted mt-0.5 truncate">
                          {workflow.description}
                        </p>
                      )}
                      <div className="flex items-center gap-1 mt-2 text-xs text-workflow-text-subtle">
                        <Clock className="w-3 h-3" />
                        {new Date(workflow.updated_at).toLocaleDateString()}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(workflow.id, e)}
                      disabled={deleting === workflow.id}
                      className={cn(
                        "p-1.5 rounded-lg transition-colors duration-200 opacity-0 group-hover:opacity-100",
                        deleting === workflow.id
                          ? "text-workflow-text-subtle"
                          : "text-workflow-text-muted hover:text-rose-500 dark:hover:text-rose-400 hover:bg-workflow-surface-hover"
                      )}
                    >
                      {deleting === workflow.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
