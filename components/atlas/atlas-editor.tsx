"use client";

import React, { useState, useCallback, useEffect } from "react";
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
import { INITIAL_FILE_NODES, INITIAL_EDGES, getFileCategoryFromExtension, DEFAULT_WORKSPACE_SETTINGS, WORKSPACE_MEMBERS, SUPPORTED_EXTENSIONS } from "@/lib/atlas-types";
import { AtlasCanvas } from "./atlas-canvas";
import { AtlasToolbar } from "./atlas-toolbar";
import { CanvasSideToolbar } from "./canvas-side-toolbar";
import { FileDetailModal } from "./file-detail-modal";
import { UploadDialog } from "./upload-dialog";
import { WorkspaceSettingsDialog } from "./workspace-settings";
import { MockupGeneratorDialog } from "./mockup-generator-dialog";

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
  
  // File detail modal state
  const [detailModalNodeId, setDetailModalNodeId] = useState<string | null>(null);

  // Mockup generator state
  const [mockupSourceFile, setMockupSourceFile] = useState<FileNodeData | null>(null);

  // Listen for mockup generation events from file nodes
  useEffect(() => {
    const handleMockupEvent = (e: CustomEvent<{ nodeId: string; fileData: FileNodeData }>) => {
      setMockupSourceFile(e.detail.fileData);
    };

    window.addEventListener("atlas:generate-mockup", handleMockupEvent as EventListener);
    return () => {
      window.removeEventListener("atlas:generate-mockup", handleMockupEvent as EventListener);
    };
  }, []);

  // Handle creating nodes from generated mockups
  const handleCreateMockupNodes = useCallback(
    (mockups: Array<{ imageUrl: string; name: string }>) => {
      const newNodes: AtlasNode[] = mockups.map((mockup, index) => ({
        id: `mockup-${Date.now()}-${index}`,
        type: "file" as const,
        position: { 
          x: 300 + (nodes.length + index) * 30, 
          y: 200 + (nodes.length + index) * 20 
        },
        data: {
          label: mockup.name,
          fileName: `${mockup.name}.png`,
          product: "atlas" as const,
          status: "draft" as const,
          fileExtension: ".png" as const,
          lastModified: "Generated just now",
          previewImages: [mockup.imageUrl],
          tasks: [],
        },
      }));

      setNodes((nds) => [...nds, ...newNodes]);
    },
    [nodes.length, setNodes]
  );

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
    (extension: FileExtension, position?: { x: number; y: number }, sourceNodeId?: string) => {
      const today = new Date();
      const formattedDate = today.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      const nodeId = `file-${Date.now()}`;
      const nodePosition = position || { x: 100 + nodes.length * 50, y: 100 + nodes.length * 30 };

      const newNode: AtlasNode = {
        id: nodeId,
        type: "file",
        position: nodePosition,
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

      // If source node provided, create an edge
      if (sourceNodeId) {
        setEdges((eds) => [...eds, {
          id: `edge-${sourceNodeId}-${nodeId}`,
          source: sourceNodeId,
          target: nodeId,
        }]);
      }
    },
    [nodes.length, setNodes, setEdges]
  );

  const handleAddStatusPill = useCallback((position?: { x: number; y: number }, sourceNodeId?: string) => {
    const nodeId = `status-${Date.now()}`;
    const nodePosition = position || { x: 150 + nodes.length * 30, y: 80 + nodes.length * 20 };

    const newNode: AtlasNode = {
      id: nodeId,
      type: "statusPill",
      position: nodePosition,
      data: {
        label: "Status",
        color: "#e5e5e5",
      },
    };
    setNodes((nds) => [...nds, newNode]);

    // If source node provided, create an edge
    if (sourceNodeId) {
      setEdges((eds) => [...eds, {
        id: `edge-${sourceNodeId}-${nodeId}`,
        source: sourceNodeId,
        target: nodeId,
      }]);
    }
  }, [nodes.length, setNodes, setEdges]);

  const handleAddTextNode = useCallback(
    (textType: "brief" | "note" | "description", position?: { x: number; y: number }, sourceNodeId?: string) => {
      const today = new Date();
      const formattedDate = today.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      const typeLabels = {
        brief: "Creative Brief",
        note: "Note",
        description: "Description",
      };

      const nodeId = `text-${Date.now()}`;
      const nodePosition = position || { x: 150 + nodes.length * 30, y: 100 + nodes.length * 20 };

      const newNode: AtlasNode = {
        id: nodeId,
        type: "text",
        position: nodePosition,
        data: {
          label: typeLabels[textType],
          content: "",
          textType,
          lastModified: formattedDate,
        },
      };
      setNodes((nds) => [...nds, newNode]);

      // If source node provided, create an edge
      if (sourceNodeId) {
        setEdges((eds) => [...eds, {
          id: `edge-${sourceNodeId}-${nodeId}`,
          source: sourceNodeId,
          target: nodeId,
        }]);
      }
    },
    [nodes.length, setNodes, setEdges]
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

  // Handle files dropped directly onto canvas
  const handleFileDrop = useCallback(
    async (files: FileList, position: { x: number; y: number }) => {
      const uploadedResults: Array<{
        fileName: string;
        extension: FileExtension;
        uploadedFile: UploadedFile;
        previewUrl?: string;
      }> = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

        // Skip unsupported files
        if (!SUPPORTED_EXTENSIONS.includes(extension as FileExtension)) {
          continue;
        }

        try {
          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            console.error("Upload failed for", file.name);
            continue;
          }

          const result = await response.json();

          const isImage = result.extension.match(/^\.(png|jpg|jpeg|gif|webp|avif)$/i);
          const servedUrl = `/api/file?pathname=${encodeURIComponent(result.pathname)}`;

          uploadedResults.push({
            fileName: result.fileName,
            extension: result.extension as FileExtension,
            uploadedFile: {
              url: servedUrl,
              pathname: result.pathname,
              size: result.size,
              uploadedAt: result.uploadedAt,
            },
            previewUrl: isImage ? servedUrl : undefined,
          });
        } catch (error) {
          console.error("Error uploading file:", file.name, error);
        }
      }

      // Create nodes for uploaded files, positioned around the drop point
      if (uploadedResults.length > 0) {
        const newNodes: AtlasNode[] = uploadedResults.map((file, index) => {
          const label = file.fileName.replace(file.extension, "");
          const previewImages = file.previewUrl ? [file.previewUrl] : undefined;
          
          // Offset each file slightly from drop position
          const offsetX = (index % 3) * 260;
          const offsetY = Math.floor(index / 3) * 220;
          
          return {
            id: `file-${Date.now()}-${index}`,
            type: "file" as const,
            position: { 
              x: position.x + offsetX - 110, 
              y: position.y + offsetY - 80 
            },
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
      }
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
        canvasName={canvas.name}
        onBack={onBack}
        onCanvasNameChange={(name) => onCanvasChange({ ...canvas, name })}
      />

      <div className="flex-1 flex overflow-hidden relative" style={{ marginTop: 0 }}>
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
          onNodeDoubleClick={setDetailModalNodeId}
          onFileDrop={handleFileDrop}
          onAddStatusPill={handleAddStatusPill}
          onAddTextNode={handleAddTextNode}
        />

        <CanvasSideToolbar
          onAddStatusPill={handleAddStatusPill}
          onAddTextNode={handleAddTextNode}
          onSettingsClick={() => setShowSettingsDialog(true)}
          onSearchChange={setSearchQuery}
          searchQuery={searchQuery}
          commentMode={commentMode}
          onCommentModeChange={handleCommentModeChange}
          commentCount={comments.filter(c => !c.resolved).length}
        />

        
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

      {/* File Detail Modal */}
      {detailModalNodeId && (() => {
        const node = nodes.find(n => n.id === detailModalNodeId && n.type === "file");
        if (!node) return null;
        const fileData = node.data as FileNodeData;
        return (
          <FileDetailModal
            isOpen={true}
            onClose={() => setDetailModalNodeId(null)}
            fileData={fileData}
            onUpdateFile={(updates) => {
              setNodes(nds => nds.map(n => 
                n.id === detailModalNodeId 
                  ? { ...n, data: { ...n.data, ...updates } }
                  : n
              ));
            }}
          />
        );
      })()}

      {/* Mockup Generator Dialog */}
      {mockupSourceFile && (
        <MockupGeneratorDialog
          isOpen={true}
          onClose={() => setMockupSourceFile(null)}
          sourceFile={mockupSourceFile}
          onCreateNodes={handleCreateMockupNodes}
        />
      )}
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
