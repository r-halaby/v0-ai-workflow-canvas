"use client";

import React, { useCallback, useRef, useMemo, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Connection,
  type Edge,
  type NodeTypes,
  BackgroundVariant,
  type OnNodesChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { AtlasNode, CanvasComment, WorkspaceMember } from "@/lib/atlas-types";
import { FileNode } from "./file-node";
import { StatusPillNode } from "./status-pill-node";
import { TextNode } from "./text-node";
import { SageChatbotNode } from "./sage-chatbot-node";
import { SageOverviewNode } from "./sage-overview-node";
import { StakeholderNode } from "./stakeholder-node";
import { CapacityNode } from "./capacity-node";
import { FinancialNode } from "./financial-node";
import { ProjectHealthNode } from "./project-health-node";
import { PipelineNode } from "./pipeline-node";
import { TeamHealthNode } from "./team-health-node";
import { MoodboardNode } from "./moodboard-node";
import { CommentPin, NewCommentInput } from "./comment-pin";
import { AddNodeMenu } from "./add-node-menu";
import { SelectionBox } from "./selection-box";

const nodeTypes: NodeTypes = {
  file: FileNode,
  statusPill: StatusPillNode,
  text: TextNode,
  sageChatbot: SageChatbotNode,
  sageOverview: SageOverviewNode,
  stakeholder: StakeholderNode,
  capacity: CapacityNode,
  financial: FinancialNode,
  projectHealth: ProjectHealthNode,
  pipeline: PipelineNode,
  teamHealth: TeamHealthNode,
  moodboard: MoodboardNode,
};

interface AtlasCanvasProps {
  nodes: AtlasNode[];
  edges: Edge[];
  searchQuery?: string;
  comments: CanvasComment[];
  commentMode: boolean;
  newCommentPosition: { x: number; y: number } | null;
  selectedCommentId: string | null;
  currentUser: WorkspaceMember;
  onNodesChange: OnNodesChange<AtlasNode>;
  onEdgesChange: ReturnType<typeof useEdgesState>[1];
  onConnect: (connection: Connection) => void;
  onNodesUpdate: (nodes: AtlasNode[]) => void;
  onDoubleClick: (position: { x: number; y: number }) => void;
  onCanvasClick: (position: { x: number; y: number }) => void;
  onCommentSelect: (commentId: string | null) => void;
  onCommentAdd: (content: string, position: { x: number; y: number }) => void;
  onCommentUpdate: (comment: CanvasComment) => void;
  onCommentDelete: (commentId: string) => void;
  onCancelNewComment: () => void;
  onNodeDoubleClick?: (nodeId: string) => void;
  onFileDrop?: (files: FileList, position: { x: number; y: number }) => void;
  onUploadFile?: (files: FileList, position?: { x: number; y: number }, sourceNodeId?: string) => void;
  onAddStatusPill?: (position?: { x: number; y: number }, sourceNodeId?: string) => void;
  onAddTextNode?: (textType: "brief" | "note" | "description", position?: { x: number; y: number }, sourceNodeId?: string) => void;
  onAddSageNode?: (sageType: "chatbot" | "overview" | "stakeholder", position?: { x: number; y: number }, sourceNodeId?: string) => void;
  onAddOperationalNode?: (opType: "capacity" | "financial" | "projectHealth" | "pipeline" | "teamHealth", position?: { x: number; y: number }, sourceNodeId?: string) => void;
  onCreateMoodboard?: (nodeIds: string[]) => void;
  onMoodboardClick?: (nodeId: string) => void;
}

export function AtlasCanvas({
  nodes,
  edges,
  searchQuery = "",
  comments,
  commentMode,
  newCommentPosition,
  selectedCommentId,
  currentUser,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodesUpdate,
  onDoubleClick,
  onCanvasClick,
  onCommentSelect,
  onCommentAdd,
  onCommentUpdate,
  onCommentDelete,
  onCancelNewComment,
  onNodeDoubleClick,
  onFileDrop,
  onUploadFile,
  onAddStatusPill,
  onAddTextNode,
  onAddSageNode,
  onAddOperationalNode,
  onCreateMoodboard,
  onMoodboardClick,
}: AtlasCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionCurrent, setSelectionCurrent] = useState<{ x: number; y: number } | null>(null);
  const [handleMenu, setHandleMenu] = useState<{
    position: { x: number; y: number };
    sourceNodeId: string;
    handlePosition: "left" | "right";
    canvasPosition: { x: number; y: number };
  } | null>(null);
  const connectionStartRef = useRef<{ nodeId: string; handleType: string; position: { x: number; y: number } } | null>(null);
  const isDraggingConnectionRef = useRef(false);
  const reactFlowInstance = useReactFlow();

  // Listen for handle click events from nodes
  useEffect(() => {
    const handleHandleClick = (e: CustomEvent<{ nodeId: string; handleType: string; position: { x: number; y: number } }>) => {
      const { nodeId, handleType, position } = e.detail;
      // Use try-catch since screenToFlowPosition may not be available immediately
      let flowPosition = { x: position.x, y: position.y };
      try {
        flowPosition = reactFlowInstance.screenToFlowPosition(position);
      } catch {
        // Use screen position as fallback
      }
      setHandleMenu({
        position,
        sourceNodeId: nodeId,
        handlePosition: handleType === "source" ? "right" : "left",
        canvasPosition: flowPosition,
      });
    };

    window.addEventListener("atlas:handle-click", handleHandleClick as EventListener);
    return () => {
      window.removeEventListener("atlas:handle-click", handleHandleClick as EventListener);
    };
  }, [reactFlowInstance]);

  // Handle connection start - track where we started
  const handleConnectStart = useCallback((event: MouseEvent | TouchEvent, params: { nodeId: string | null; handleType: string | null }) => {
    if (params.nodeId && params.handleType) {
      const clientX = 'clientX' in event ? event.clientX : event.touches[0].clientX;
      const clientY = 'clientY' in event ? event.clientY : event.touches[0].clientY;
      connectionStartRef.current = {
        nodeId: params.nodeId,
        handleType: params.handleType,
        position: { x: clientX, y: clientY },
      };
      isDraggingConnectionRef.current = false;
    }
  }, []);

  // Handle connection end - check if it was a click or drag
  const handleConnectEnd = useCallback((event: MouseEvent | TouchEvent, connectionState: { isValid: boolean }) => {
    const start = connectionStartRef.current;
    if (!start) return;

    const clientX = 'clientX' in event ? event.clientX : event.changedTouches[0].clientX;
    const clientY = 'clientY' in event ? event.clientY : event.changedTouches[0].clientY;

    // Calculate distance moved
    const dx = clientX - start.position.x;
    const dy = clientY - start.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If connection was made successfully, don't show menu
    if (connectionState?.isValid) {
      connectionStartRef.current = null;
      isDraggingConnectionRef.current = false;
      return;
    }

    // If moved less than 20px and no connection was made, treat as click - show add menu
    if (distance < 20) {
      let flowPosition = { x: clientX, y: clientY };
      try {
        flowPosition = reactFlowInstance.screenToFlowPosition({ x: clientX, y: clientY });
      } catch {
        // Use screen position as fallback
      }
      setHandleMenu({
        position: { x: clientX, y: clientY },
        sourceNodeId: start.nodeId,
        handlePosition: start.handleType === "source" ? "right" : "left",
        canvasPosition: flowPosition,
      });
    }

    connectionStartRef.current = null;
    isDraggingConnectionRef.current = false;
  }, [reactFlowInstance]);

  

  // Handle menu callbacks
  const handleMenuAddStatusPill = useCallback(() => {
    if (handleMenu && onAddStatusPill) {
      onAddStatusPill(handleMenu.canvasPosition, handleMenu.sourceNodeId);
    }
    setHandleMenu(null);
  }, [handleMenu, onAddStatusPill]);

  const handleMenuAddTextNode = useCallback((textType: "brief" | "note" | "description") => {
    if (handleMenu && onAddTextNode) {
      onAddTextNode(textType, handleMenu.canvasPosition, handleMenu.sourceNodeId);
    }
    setHandleMenu(null);
  }, [handleMenu, onAddTextNode]);

  const handleMenuUploadFile = useCallback((files: FileList) => {
    if (handleMenu && onUploadFile) {
      onUploadFile(files, handleMenu.canvasPosition, handleMenu.sourceNodeId);
    }
    setHandleMenu(null);
  }, [handleMenu, onUploadFile]);

  const handleMenuAddSageNode = useCallback((sageType: "chatbot" | "overview" | "stakeholder") => {
    if (handleMenu && onAddSageNode) {
      onAddSageNode(sageType, handleMenu.canvasPosition, handleMenu.sourceNodeId);
    }
    setHandleMenu(null);
  }, [handleMenu, onAddSageNode]);

  const handleMenuAddOperationalNode = useCallback((opType: "capacity" | "financial" | "projectHealth" | "pipeline" | "teamHealth") => {
    if (handleMenu && onAddOperationalNode) {
      onAddOperationalNode(opType, handleMenu.canvasPosition, handleMenu.sourceNodeId);
    }
    setHandleMenu(null);
  }, [handleMenu, onAddOperationalNode]);

  // Handle file drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) {
      setIsDraggingFiles(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're actually leaving the container
    const rect = reactFlowWrapper.current?.getBoundingClientRect();
    if (rect) {
      const { clientX, clientY } = e;
      if (
        clientX <= rect.left ||
        clientX >= rect.right ||
        clientY <= rect.top ||
        clientY >= rect.bottom
      ) {
        setIsDraggingFiles(false);
      }
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFiles(false);

    if (e.dataTransfer.files.length > 0 && onFileDrop) {
      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (bounds) {
        const position = {
          x: e.clientX - bounds.left,
          y: e.clientY - bounds.top,
        };
        onFileDrop(e.dataTransfer.files, position);
      }
    }
  }, [onFileDrop]);

  // Selection box for grouping nodes
  const handleSelectionStart = useCallback((e: React.MouseEvent) => {
    // Only start selection if shift key is held and clicking on the canvas background
    if (e.shiftKey && (e.target as HTMLElement).classList.contains("react-flow__pane")) {
      setIsSelecting(true);
      setSelectionStart({ x: e.clientX, y: e.clientY });
      setSelectionCurrent({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleSelectionMove = useCallback((e: React.MouseEvent) => {
    if (isSelecting) {
      setSelectionCurrent({ x: e.clientX, y: e.clientY });
    }
  }, [isSelecting]);

  const handleSelectionEnd = useCallback(() => {
    if (isSelecting && selectionStart && selectionCurrent) {
      // Calculate selection box bounds
      const left = Math.min(selectionStart.x, selectionCurrent.x);
      const right = Math.max(selectionStart.x, selectionCurrent.x);
      const top = Math.min(selectionStart.y, selectionCurrent.y);
      const bottom = Math.max(selectionStart.y, selectionCurrent.y);

      // Find nodes within selection box
      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (bounds) {
        const selectedNodeIds = nodes.filter(node => {
          // Get node position in screen coordinates
          const nodePos = reactFlowInstance.flowToScreenPosition(node.position);
          return (
            nodePos.x >= left - bounds.left &&
            nodePos.x <= right - bounds.left &&
            nodePos.y >= top - bounds.top &&
            nodePos.y <= bottom - bounds.top
          );
        }).map(n => n.id);

        // Select the nodes in ReactFlow
        if (selectedNodeIds.length > 0) {
          const updatedNodes = nodes.map(node => ({
            ...node,
            selected: selectedNodeIds.includes(node.id),
          }));
          onNodesUpdate(updatedNodes);
        }
      }
    }
    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionCurrent(null);
  }, [isSelecting, selectionStart, selectionCurrent, nodes, reactFlowInstance, onNodesUpdate]);

  // Get currently selected nodes for moodboard creation
  const selectedNodes = useMemo(() => {
    return nodes.filter(node => node.selected);
  }, [nodes]);

  // Check if selected nodes can be grouped into a moodboard (must be file nodes with images)
  const canCreateMoodboard = useMemo(() => {
    if (selectedNodes.length < 2) return false;
    return selectedNodes.every(node => {
      if (node.type !== "file") return false;
      const fileData = node.data as { fileType?: string; uploadedFile?: { url?: string } };
      return fileData.fileType === "image" || fileData.uploadedFile?.url;
    });
  }, [selectedNodes]);

  // Handle node click for moodboard expansion
  const handleNodeClick = useCallback((_: React.MouseEvent, node: AtlasNode) => {
    if (node.type === "moodboard" && onMoodboardClick) {
      onMoodboardClick(node.id);
    }
  }, [onMoodboardClick]);

  // Apply search highlighting to nodes
  const filteredNodes = useMemo(() => {
    return nodes.map((node) => {
      const label = node.data.label || "";
      const fileName = node.data.fileName || "";
      const matchesSearch = !searchQuery || 
        label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fileName.toLowerCase().includes(searchQuery.toLowerCase());

      return {
        ...node,
        draggable: true,
        style: {
          ...node.style,
          opacity: matchesSearch ? 1 : 0.2,
          transition: "opacity 0.2s ease",
        },
      };
    });
  }, [nodes, searchQuery]);

  // Style edges with dashed animation
  const styledEdges = useMemo(() => {
    return edges.map((edge) => ({
      ...edge,
      style: {
        ...edge.style,
        strokeWidth: 2,
        stroke: "#52525b",
        strokeDasharray: "5 5",
      },
      animated: true,
    }));
  }, [edges]);

  const handlePaneClick = useCallback(() => {
    // Deselect comment when clicking on empty canvas
    if (selectedCommentId && !commentMode) {
      onCommentSelect(null);
    }
  }, [selectedCommentId, commentMode, onCommentSelect]);

  return (
    <div
      ref={reactFlowWrapper}
      className="flex-1 h-full relative"
      style={{ cursor: commentMode ? "crosshair" : isSelecting ? "crosshair" : "default" }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseDown={handleSelectionStart}
      onMouseMove={handleSelectionMove}
      onMouseUp={handleSelectionEnd}
    >
      <ReactFlow
        nodes={filteredNodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={handleConnectStart}
        onConnectEnd={handleConnectEnd}
        onPaneClick={handlePaneClick}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={(event, node) => {
          // Don't open modal if clicking on a handle
          const target = event.target as HTMLElement;
          if (target.closest(".react-flow__handle")) return;
          
          if (node.type === "file" && onNodeDoubleClick) {
            onNodeDoubleClick(node.id);
          }
        }}
        onDoubleClick={(event) => {
          if (commentMode) return;
          const bounds = reactFlowWrapper.current?.getBoundingClientRect();
          if (!bounds) return;
          const target = event.target as HTMLElement;
          if (target.closest(".react-flow__node")) return;
          const position = {
            x: event.clientX - bounds.left - 110,
            y: event.clientY - bounds.top - 80,
          };
          onDoubleClick(position);
        }}
        onClick={(event) => {
          if (!commentMode) return;
          const bounds = reactFlowWrapper.current?.getBoundingClientRect();
          if (!bounds) return;
          const target = event.target as HTMLElement;
          if (target.closest(".react-flow__node") || target.closest("[data-comment-id]")) return;
          const position = {
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top,
          };
          onCanvasClick(position);
        }}
        nodeTypes={nodeTypes}
        nodesDraggable
        nodesConnectable
        elementsSelectable
        selectionOnDrag={false}
        panOnScroll={false}
        fitView
        fitViewOptions={{
          padding: 0.3,
          maxZoom: 0.85,
        }}
        snapToGrid
        snapGrid={[16, 16]}
        defaultEdgeOptions={{
          type: "default",
          style: { strokeWidth: 2, stroke: "#52525b", strokeDasharray: "5 5" },
          animated: true,
        }}
        style={{ backgroundColor: "#0a0a0a" }}
        panOnDrag={commentMode ? false : [1, 2]}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#27272a"
        />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor="#3f3f46"
          maskColor="rgba(0, 0, 0, 0.7)"
          style={{
            backgroundColor: "#111111",
            border: "1px solid #222222",
            borderRadius: 8,
          }}
        />
      </ReactFlow>

      {/* Comment Pins Layer */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
        <div className="relative w-full h-full">
          {comments.map((comment) => (
            <div key={comment.id} className="pointer-events-auto" style={{ position: "absolute", left: comment.position.x, top: comment.position.y }}>
              <CommentPin
                comment={comment}
                isSelected={selectedCommentId === comment.id}
                onSelect={() => onCommentSelect(comment.id)}
                onUpdate={onCommentUpdate}
                onDelete={() => onCommentDelete(comment.id)}
                currentUser={currentUser}
              />
            </div>
          ))}

          {/* New comment input */}
          {newCommentPosition && (
            <div className="pointer-events-auto" style={{ position: "absolute", left: newCommentPosition.x, top: newCommentPosition.y }}>
              <NewCommentInput
                position={{ x: 0, y: 0 }}
                onSubmit={(content) => onCommentAdd(content, newCommentPosition)}
                onCancel={onCancelNewComment}
              />
            </div>
          )}
        </div>
      </div>

      {/* Comment mode overlay hint */}
      {commentMode && !newCommentPosition && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full pointer-events-none"
          style={{ backgroundColor: "rgba(20, 20, 20, 0.9)", border: "1px solid #2a2a2a" }}
        >
          <span
            className="text-sm text-gray-300"
            style={{ fontFamily: "system-ui, Inter, sans-serif" }}
          >
            Click anywhere to add a comment
          </span>
        </div>
      )}

      {/* File drop overlay */}
      {isDraggingFiles && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
          style={{ backgroundColor: "rgba(10, 10, 10, 0.85)" }}
        >
          <div
            className="flex flex-col items-center gap-4 p-8 rounded-2xl"
            style={{ 
              backgroundColor: "#141414", 
              border: "2px dashed #3a3a3a",
            }}
          >
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#1f1f1f" }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#888888" strokeWidth="1.5">
                <path d="M12 16V4M12 4L8 8M12 4L16 8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 17V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V17" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-white" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                Drop files to upload
              </p>
              <p className="text-sm text-gray-500 mt-1" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                Images, documents, and media files
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Handle click menu */}
      {handleMenu && (
        <AddNodeMenu
          onAddStatusPill={handleMenuAddStatusPill}
          onAddTextNode={handleMenuAddTextNode}
          onAddSageNode={handleMenuAddSageNode}
          onAddOperationalNode={handleMenuAddOperationalNode}
          onUploadFile={handleMenuUploadFile}
          onClose={() => setHandleMenu(null)}
          position={handleMenu.position}
          sourceHandlePosition={handleMenu.handlePosition}
        />
      )}

      {/* Selection Box */}
      {isSelecting && selectionStart && selectionCurrent && (
        <SelectionBox startPoint={selectionStart} currentPoint={selectionCurrent} />
      )}

      {/* Create Moodboard floating button */}
      {canCreateMoodboard && onCreateMoodboard && (
        <div 
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50"
        >
          <button
            type="button"
            onClick={() => {
              onCreateMoodboard(selectedNodes.map(n => n.id));
            }}
            className="px-4 py-2.5 rounded-full flex items-center gap-2 transition-all hover:scale-105 shadow-lg"
            style={{
              backgroundColor: "#a855f7",
              color: "#ffffff",
              fontFamily: "system-ui, Inter, sans-serif",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <span className="text-sm font-medium">
              Create Moodboard ({selectedNodes.length} images)
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
