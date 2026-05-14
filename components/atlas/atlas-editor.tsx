"use client";

import React, { useState, useCallback } from "react";
import {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type NodeChange,
} from "@xyflow/react";

import type { AtlasNode, FilterState, FileExtension, FileNodeData, UploadedFile, WorkspaceSettings } from "@/lib/atlas-types";
import { INITIAL_FILE_NODES, INITIAL_EDGES, getFileCategoryFromExtension, DEFAULT_WORKSPACE_SETTINGS } from "@/lib/atlas-types";
import { AtlasCanvas } from "./atlas-canvas";
import { AtlasToolbar } from "./atlas-toolbar";
import { FileDetailPanel } from "./file-detail-panel";
import { UploadDialog } from "./upload-dialog";
import { WorkspaceSettingsDialog } from "./workspace-settings";

function AtlasEditorInner() {
  const [nodes, setNodes, onNodesChange] = useNodesState<AtlasNode>(INITIAL_FILE_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const [filters, setFilters] = useState<FilterState>({ product: "all", status: "all" });
  const [selectedNode, setSelectedNode] = useState<AtlasNode | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [workspaceSettings, setWorkspaceSettings] = useState<WorkspaceSettings>(DEFAULT_WORKSPACE_SETTINGS);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: "default",
            animated: true,
            style: { strokeWidth: 2, stroke: "#52525b", strokeDasharray: "5 5" },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const handleNodesUpdate = useCallback(
    (newNodes: AtlasNode[]) => {
      setNodes(newNodes);
    },
    [setNodes]
  );

  const handleNodeUpdate = useCallback(
    (nodeId: string, data: Partial<FileNodeData>) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
        )
      );
      setSelectedNode((prev) =>
        prev && prev.id === nodeId ? { ...prev, data: { ...prev.data, ...data } } : prev
      );
    },
    [setNodes]
  );

  const handleAddNode = useCallback(
    (extension: FileExtension) => {
      const today = new Date();
      const formattedDate = today.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      const newNode: AtlasNode = {
        id: `file-${Date.now()}`,
        type: "file",
        position: { x: 100 + nodes.length * 50, y: 100 + nodes.length * 30 },
        data: {
          label: "Untitled File",
          fileName: `Untitled File${extension}`,
          product: "atlas",
          status: "draft",
          fileExtension: extension,
          lastModified: formattedDate,
        },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [nodes.length, setNodes]
  );

  const handleDoubleClickCanvas = useCallback(
    (position: { x: number; y: number }) => {
      const today = new Date();
      const formattedDate = today.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      const newNode: AtlasNode = {
        id: `file-${Date.now()}`,
        type: "file",
        position,
        data: {
          label: "Untitled File",
          fileName: "Untitled File.fig",
          product: "atlas",
          status: "draft",
          fileExtension: ".fig",
          lastModified: formattedDate,
        },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes]
  );

  const handleFilesUploaded = useCallback(
    (files: Array<{
      fileName: string;
      extension: FileExtension;
      uploadedFile: UploadedFile;
      previewUrl?: string;
    }>) => {
      const newNodes: AtlasNode[] = files.map((file, index) => {
        // Get file name without extension for label
        const label = file.fileName.replace(file.extension, "");
        
        // Generate preview images array if we have a preview
        const previewImages = file.previewUrl ? [file.previewUrl] : undefined;
        
        return {
          id: `file-${Date.now()}-${index}`,
          type: "file" as const,
          position: { x: 150 + (index % 3) * 300, y: 150 + Math.floor(index / 3) * 250 },
          data: {
            label,
            fileName: file.fileName,
            product: "atlas" as const,
            status: "draft" as const,
            fileExtension: file.extension,
            lastModified: "Updated just now",
            uploadedFile: file.uploadedFile,
            previewImages,
            tasks: [],
          },
        };
      });

      setNodes((nds) => [...nds, ...newNodes]);
    },
    [setNodes]
  );

  const handleNodesChangeWrapper = useCallback(
    (changes: NodeChange<AtlasNode>[]) => {
      onNodesChange(changes);

      for (const change of changes) {
        if (change.type === "select" && change.selected) {
          const node = nodes.find((n) => n.id === change.id);
          if (node) {
            setSelectedNode(node);
          }
        } else if (change.type === "select" && !change.selected) {
          if (selectedNode?.id === change.id) {
            setSelectedNode(null);
          }
        }
      }
    },
    [onNodesChange, nodes, selectedNode]
  );

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: "#0a0a0a" }}>
      <AtlasToolbar
        filters={filters}
        onFiltersChange={setFilters}
        onAddNode={handleAddNode}
        onUploadClick={() => setShowUploadDialog(true)}
        onSettingsClick={() => setShowSettingsDialog(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        <AtlasCanvas
          nodes={nodes}
          edges={edges}
          filters={filters}
          onNodesChange={handleNodesChangeWrapper}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodesUpdate={handleNodesUpdate}
          onDoubleClick={handleDoubleClickCanvas}
        />

        {selectedNode && (
          <FileDetailPanel
            node={selectedNode}
            onUpdate={handleNodeUpdate}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>

      {/* Upload Dialog */}
      <UploadDialog
        open={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onFilesUploaded={handleFilesUploaded}
      />

      {/* Settings Dialog */}
      <WorkspaceSettingsDialog
        open={showSettingsDialog}
        onClose={() => setShowSettingsDialog(false)}
        settings={workspaceSettings}
        onSettingsChange={setWorkspaceSettings}
      />
    </div>
  );
}

export function AtlasEditor() {
  return (
    <ReactFlowProvider>
      <AtlasEditorInner />
    </ReactFlowProvider>
  );
}
