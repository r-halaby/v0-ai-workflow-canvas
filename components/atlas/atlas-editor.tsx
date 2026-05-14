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

import type { AtlasNode, FileExtension, FileNodeData, UploadedFile, WorkspaceSettings, Canvas, CanvasComment } from "@/lib/atlas-types";
import { INITIAL_FILE_NODES, INITIAL_EDGES, getFileCategoryFromExtension, DEFAULT_WORKSPACE_SETTINGS, WORKSPACE_MEMBERS } from "@/lib/atlas-types";
import { AtlasCanvas } from "./atlas-canvas";
import { AtlasToolbar } from "./atlas-toolbar";
import { CanvasSideToolbar } from "./canvas-side-toolbar";
import { FileDetailPanel } from "./file-detail-panel";
import { UploadDialog } from "./upload-dialog";
import { WorkspaceSettingsDialog } from "./workspace-settings";

interface AtlasEditorProps {
  canvas: Canvas;
  onCanvasChange: (canvas: Canvas) => void;
  onBack: () => void;
  workspaceSettings: WorkspaceSettings;
  onWorkspaceSettingsChange: (settings: WorkspaceSettings) => void;
}

function AtlasEditorInner({ canvas, onCanvasChange, onBack, workspaceSettings, onWorkspaceSettingsChange }: AtlasEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<AtlasNode>(canvas.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(canvas.edges);
  const [comments, setComments] = useState<CanvasComment[]>(canvas.comments || []);
  const [selectedNode, setSelectedNode] = useState<AtlasNode | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Comment mode state
  const [commentMode, setCommentMode] = useState(false);
  const [newCommentPosition, setNewCommentPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);

  // Current user (first member for demo)
  const currentUser = workspaceSettings.members[0] || WORKSPACE_MEMBERS[0];

  // Sync canvas changes back to parent
  const syncCanvas = useCallback((updatedComments?: CanvasComment[]) => {
    onCanvasChange({
      ...canvas,
      nodes,
      edges,
      comments: updatedComments || comments,
      updatedAt: new Date().toISOString(),
    });
  }, [canvas, nodes, edges, comments, onCanvasChange]);

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
        const label = file.fileName.replace(file.extension, "");
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

  // Comment handlers
  const handleCanvasClick = useCallback((position: { x: number; y: number }) => {
    if (commentMode) {
      setNewCommentPosition(position);
      setSelectedCommentId(null);
    }
  }, [commentMode]);

  const handleCommentSelect = useCallback((commentId: string | null) => {
    setSelectedCommentId(commentId);
    setNewCommentPosition(null);
  }, []);

  const handleCommentAdd = useCallback((content: string, position: { x: number; y: number }) => {
    const newComment: CanvasComment = {
      id: `comment-${Date.now()}`,
      position,
      content,
      author: currentUser,
      createdAt: new Date().toISOString(),
      resolved: false,
      replies: [],
    };
    
    const updatedComments = [...comments, newComment];
    setComments(updatedComments);
    setNewCommentPosition(null);
    setCommentMode(false);
    setSelectedCommentId(newComment.id);
    syncCanvas(updatedComments);
  }, [comments, currentUser, syncCanvas]);

  const handleCommentUpdate = useCallback((updatedComment: CanvasComment) => {
    const updatedComments = comments.map(c => 
      c.id === updatedComment.id ? updatedComment : c
    );
    setComments(updatedComments);
    syncCanvas(updatedComments);
  }, [comments, syncCanvas]);

  const handleCommentDelete = useCallback((commentId: string) => {
    const updatedComments = comments.filter(c => c.id !== commentId);
    setComments(updatedComments);
    setSelectedCommentId(null);
    syncCanvas(updatedComments);
  }, [comments, syncCanvas]);

  const handleCancelNewComment = useCallback(() => {
    setNewCommentPosition(null);
  }, []);

  const handleCommentModeChange = useCallback((enabled: boolean) => {
    setCommentMode(enabled);
    if (!enabled) {
      setNewCommentPosition(null);
    }
    setSelectedCommentId(null);
  }, []);

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: "#0a0a0a" }}>
      <AtlasToolbar
        onUploadClick={() => setShowUploadDialog(true)}
        canvasName={canvas.name}
        onBack={onBack}
      />

      <div className="flex-1 flex overflow-hidden relative">
        <AtlasCanvas
          nodes={nodes}
          edges={edges}
          searchQuery={searchQuery}
          comments={comments}
          commentMode={commentMode}
          newCommentPosition={newCommentPosition}
          selectedCommentId={selectedCommentId}
          currentUser={currentUser}
          onNodesChange={handleNodesChangeWrapper}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodesUpdate={handleNodesUpdate}
          onDoubleClick={handleDoubleClickCanvas}
          onCanvasClick={handleCanvasClick}
          onCommentSelect={handleCommentSelect}
          onCommentAdd={handleCommentAdd}
          onCommentUpdate={handleCommentUpdate}
          onCommentDelete={handleCommentDelete}
          onCancelNewComment={handleCancelNewComment}
        />

        <CanvasSideToolbar
          onAddNode={handleAddNode}
          onSettingsClick={() => setShowSettingsDialog(true)}
          onSearchChange={setSearchQuery}
          searchQuery={searchQuery}
          commentMode={commentMode}
          onCommentModeChange={handleCommentModeChange}
          commentCount={comments.filter(c => !c.resolved).length}
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
        onSettingsChange={onWorkspaceSettingsChange}
      />
    </div>
  );
}

export function AtlasEditor(props: AtlasEditorProps) {
  return (
    <ReactFlowProvider>
      <AtlasEditorInner {...props} />
    </ReactFlowProvider>
  );
}
